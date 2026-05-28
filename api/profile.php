<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Helper.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/middleware/Auth.php';

function profileTableExists($pdo, $table) {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?"
    );
    $stmt->execute([$table]);
    return (int)$stmt->fetchColumn() > 0;
}

function profileColumnExists($pdo, $table, $column) {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?"
    );
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function profileNormalizePhone($phone) {
    return preg_replace('/[\s\.\-]+/', '', trim($phone));
}

function profileTextLength($value) {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function profileGetUser($pdo, $userId, $hasAvatarColumn) {
    $columns = 'id, fullname, phone, email, address, role, status, created_at';
    if ($hasAvatarColumn) {
        $columns .= ', avatar_url';
    }

    $stmt = $pdo->prepare("SELECT $columns FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::notFound('User');
    }

    if (!$hasAvatarColumn) {
        $user['avatar_url'] = null;
    }

    return $user;
}

function profileGetStats($pdo, $userId) {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_spent
         FROM orders
         WHERE user_id = ?"
    );
    $stmt->execute([$userId]);
    $orderStats = $stmt->fetch() ?: ['total_orders' => 0, 'total_spent' => 0];

    $favoriteCount = 0;
    if (profileTableExists($pdo, 'favorite_products')) {
        $favStmt = $pdo->prepare("SELECT COUNT(*) FROM favorite_products WHERE user_id = ?");
        $favStmt->execute([$userId]);
        $favoriteCount = (int)$favStmt->fetchColumn();
    }

    $totalSpent = (float)$orderStats['total_spent'];

    return [
        'total_orders' => (int)$orderStats['total_orders'],
        'favorite_count' => $favoriteCount,
        'points' => (int)floor($totalSpent / 10000)
    ];
}

function profileGetRecentOrders($pdo, $userId) {
    $stmt = $pdo->prepare(
        "SELECT id, created_at, total_amount, status
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 3"
    );
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();

    foreach ($orders as &$order) {
        $itemStmt = $pdo->prepare(
            "SELECT oi.quantity, p.title, p.image_url
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?
             ORDER BY oi.id ASC
             LIMIT 3"
        );
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll();

        $countStmt = $pdo->prepare("SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = ?");
        $countStmt->execute([$order['id']]);

        $order['items'] = $items;
        $order['item_count'] = (int)$countStmt->fetchColumn();
    }

    return $orders;
}

function profileBuildPayload($pdo, $userId, $hasAvatarColumn) {
    return [
        'user' => profileGetUser($pdo, $userId, $hasAvatarColumn),
        'stats' => profileGetStats($pdo, $userId),
        'recent_orders' => profileGetRecentOrders($pdo, $userId)
    ];
}

function profileValidateUnique($pdo, $field, $value, $userId) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE $field = ? AND id <> ?");
    $stmt->execute([$value, $userId]);
    return (int)$stmt->fetchColumn() === 0;
}

function profileDetectMimeType($path) {
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $path);
        finfo_close($finfo);
        return $mime;
    }

    $imageInfo = @getimagesize($path);
    return $imageInfo['mime'] ?? '';
}

function profileUploadErrorMessage($code) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'Ảnh đại diện không được vượt quá 2MB';
        case UPLOAD_ERR_PARTIAL:
            return 'Ảnh đại diện chưa được tải lên đầy đủ';
        case UPLOAD_ERR_NO_TMP_DIR:
        case UPLOAD_ERR_CANT_WRITE:
        case UPLOAD_ERR_EXTENSION:
            return 'Server không thể nhận ảnh đại diện';
        default:
            return 'Upload ảnh đại diện thất bại';
    }
}

function profileValidateAvatarUpload($hasAvatarColumn, &$errors) {
    if (empty($_FILES['avatar_file']) || $_FILES['avatar_file']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (!$hasAvatarColumn) {
        $errors['avatar_file'][] = 'Database chưa có cột users.avatar_url';
        return null;
    }

    $file = $_FILES['avatar_file'];
    if (is_array($file['error'])) {
        $errors['avatar_file'][] = 'Ảnh đại diện không hợp lệ';
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors['avatar_file'][] = profileUploadErrorMessage($file['error']);
        return null;
    }

    if ((int)$file['size'] > 2 * 1024 * 1024) {
        $errors['avatar_file'][] = 'Ảnh đại diện không được vượt quá 2MB';
        return null;
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        $errors['avatar_file'][] = 'Ảnh đại diện không hợp lệ';
        return null;
    }

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($extension, $allowedExtensions, true)) {
        $errors['avatar_file'][] = 'Ảnh đại diện chỉ hỗ trợ JPG, JPEG, PNG, GIF hoặc WEBP';
        return null;
    }

    $mime = profileDetectMimeType($file['tmp_name']);
    if (!in_array($mime, $allowedMimes, true)) {
        $errors['avatar_file'][] = 'File tải lên không phải ảnh hợp lệ';
        return null;
    }

    return [
        'tmp_name' => $file['tmp_name'],
        'extension' => $extension === 'jpeg' ? 'jpg' : $extension
    ];
}

function profileStoreAvatarFile($avatarFile, $userId) {
    if (!$avatarFile) {
        return null;
    }

    $relativeDir = 'uploads/avatars';
    $targetDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';

    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
        throw new Exception('Không thể tạo thư mục lưu ảnh đại diện');
    }

    if (!is_writable($targetDir)) {
        throw new Exception('Thư mục lưu ảnh đại diện không có quyền ghi');
    }

    $filename = sprintf(
        'user_%d_%d_%s.%s',
        $userId,
        time(),
        bin2hex(random_bytes(4)),
        $avatarFile['extension']
    );
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($avatarFile['tmp_name'], $targetPath)) {
        throw new Exception('Không thể lưu ảnh đại diện');
    }

    return $relativeDir . '/' . $filename;
}

try {
    $auth = new Auth($pdo);
    $currentUser = $auth->require();
    $method = getMethod();
    $userId = $currentUser['id'];
    $hasAvatarColumn = profileColumnExists($pdo, 'users', 'avatar_url');

    if ($method === 'GET') {
        Response::success(profileBuildPayload($pdo, $userId, $hasAvatarColumn), 'Profile fetched');
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        Response::error('Method not allowed', 405);
    }

    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
    $input = $isMultipart ? $_POST : getInput();
    $fullname = trim($input['fullname'] ?? '');
    $phone = profileNormalizePhone($input['phone'] ?? '');
    $email = trim($input['email'] ?? '');
    $address = trim($input['address'] ?? '');
    $errors = [];

    if ($fullname === '') {
        $errors['fullname'][] = 'Vui lòng nhập họ và tên';
    } elseif (profileTextLength($fullname) > 100) {
        $errors['fullname'][] = 'Họ và tên không được vượt quá 100 ký tự';
    }

    if ($phone === '') {
        $errors['phone'][] = 'Vui lòng nhập số điện thoại';
    } elseif (!validatePhone($phone)) {
        $errors['phone'][] = 'Số điện thoại không đúng định dạng';
    } elseif (!profileValidateUnique($pdo, 'phone', $phone, $userId)) {
        $errors['phone'][] = 'Số điện thoại đã được sử dụng';
    }

    if ($email !== '') {
        if (!validateEmail($email)) {
            $errors['email'][] = 'Email không đúng định dạng';
        } elseif (!profileValidateUnique($pdo, 'email', $email, $userId)) {
            $errors['email'][] = 'Email đã được sử dụng';
        }
    }

    if (profileTextLength($address) > 500) {
        $errors['address'][] = 'Địa chỉ không được vượt quá 500 ký tự';
    }

    $avatarFile = profileValidateAvatarUpload($hasAvatarColumn, $errors);

    if (!empty($errors)) {
        Response::error('Dữ liệu tài khoản không hợp lệ', 400, $errors);
    }

    $uploadedAvatarUrl = profileStoreAvatarFile($avatarFile, $userId);

    $fields = [
        'fullname = ?',
        'phone = ?',
        'email = ?',
        'address = ?'
    ];
    $values = [
        sanitizeString($fullname),
        sanitizeString($phone),
        $email === '' ? null : sanitizeString($email),
        $address === '' ? null : sanitizeString($address)
    ];

    if ($hasAvatarColumn && $uploadedAvatarUrl !== null) {
        $fields[] = 'avatar_url = ?';
        $values[] = sanitizeString($uploadedAvatarUrl);
    }

    $values[] = $userId;
    $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = ?');
    $stmt->execute($values);

    Response::success(profileBuildPayload($pdo, $userId, $hasAvatarColumn), 'Profile updated');
} catch (Exception $e) {
    logError('Profile API error', ['error' => $e->getMessage()]);
    Response::internalError(DEBUG_MODE ? $e->getMessage() : 'Internal Server Error');
}
?>
