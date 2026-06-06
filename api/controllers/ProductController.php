<?php
/**
 * 🍔 PRODUCT CONTROLLER - Xử lý sản phẩm
 * API Routes:
 * - GET    /api/products
 * - GET    /api/products/:id
 * - POST   /api/products (Admin)
 * - PUT    /api/products/:id (Admin)
 * - DELETE /api/products/:id (Admin)
 * - GET    /api/products/search?q=keyword
 * - GET    /api/categories
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../models/Product.php';

header('Content-Type: application/json; charset=utf-8');

function productDetectMimeType($path) {
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $path);
        finfo_close($finfo);
        return $mime;
    }

    $imageInfo = @getimagesize($path);
    return $imageInfo['mime'] ?? '';
}

function productUploadErrorMessage($code) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'Ảnh món ăn không được vượt quá 3MB';
        case UPLOAD_ERR_PARTIAL:
            return 'Ảnh món ăn chưa được tải lên đầy đủ';
        case UPLOAD_ERR_NO_TMP_DIR:
        case UPLOAD_ERR_CANT_WRITE:
        case UPLOAD_ERR_EXTENSION:
            return 'Server không thể nhận ảnh món ăn';
        default:
            return 'Upload ảnh món ăn thất bại';
    }
}

function productValidateImageUpload(&$errors) {
    if (empty($_FILES['product_image']) || $_FILES['product_image']['error'] === UPLOAD_ERR_NO_FILE) {
        $errors['product_image'][] = 'Vui lòng chọn ảnh món ăn';
        return null;
    }

    $file = $_FILES['product_image'];
    if (is_array($file['error'])) {
        $errors['product_image'][] = 'Ảnh món ăn không hợp lệ';
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors['product_image'][] = productUploadErrorMessage($file['error']);
        return null;
    }

    if ((int)$file['size'] > 3 * 1024 * 1024) {
        $errors['product_image'][] = 'Ảnh món ăn không được vượt quá 3MB';
        return null;
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        $errors['product_image'][] = 'Ảnh món ăn không hợp lệ';
        return null;
    }

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($extension, $allowedExtensions, true)) {
        $errors['product_image'][] = 'Ảnh món ăn chỉ hỗ trợ JPG, JPEG, PNG, GIF hoặc WEBP';
        return null;
    }

    $mime = productDetectMimeType($file['tmp_name']);
    if (!in_array($mime, $allowedMimes, true)) {
        $errors['product_image'][] = 'File tải lên không phải ảnh hợp lệ';
        return null;
    }

    return [
        'tmp_name' => $file['tmp_name'],
        'extension' => $extension === 'jpeg' ? 'jpg' : $extension
    ];
}

function productStoreImageFile($imageFile) {
    $relativeDir = 'uploads/products';
    $targetDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products';

    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
        throw new Exception('Không thể tạo thư mục lưu ảnh món ăn');
    }

    if (!is_writable($targetDir)) {
        throw new Exception('Thư mục lưu ảnh món ăn không có quyền ghi');
    }

    $filename = sprintf(
        'product_%d_%s.%s',
        time(),
        bin2hex(random_bytes(6)),
        $imageFile['extension']
    );
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($imageFile['tmp_name'], $targetPath)) {
        throw new Exception('Không thể lưu ảnh món ăn');
    }

    return $relativeDir . '/' . $filename;
}

try {
    $product = new Product($pdo);
    $auth = new Auth($pdo);
    
    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? 'list';
    
    switch ($action) {
        case 'admin-list':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $auth->requireAdmin();

            $filters = [
                'search' => getInput('search'),
                'status' => getInput('status'),
                'category_id' => getInput('category_id'),
                'limit' => getInput('limit', 100),
                'offset' => getInput('offset', 0)
            ];

            $products = $product->getAllAdmin($filters);
            $total = $product->countAdmin($filters);
            Response::paginated(
                $products,
                (int)($filters['offset'] / $filters['limit']) + 1,
                $filters['limit'],
                $total,
                'Admin products fetched'
            );
            break;
        
        case 'list':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $filters = [
                'category' => getInput('category'),
                'search' => getInput('search'),
                'sort' => getInput('sort'),
                'limit' => getInput('limit', DEFAULT_PER_PAGE),
                'offset' => getInput('offset', 0)
            ];
            
            $products = $product->getAll($filters);
            $total = $product->count(['category' => $filters['category'], 'search' => $filters['search']]);
            
            Response::paginated(
                $products,
                (int)($filters['offset'] / $filters['limit']) + 1,
                $filters['limit'],
                $total,
                'Products fetched successfully'
            );
            break;
            
        case 'detail':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid product ID']);
            }
            
            $prod = $product->getById($id);
            if ($prod) {
                Response::success($prod);
            } else {
                Response::notFound('Product');
            }
            break;
            
        case 'create':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            $input = getInput();
            $result = $product->create($input);
            
            if ($result['success']) {
                Response::success(
                    ['product_id' => $result['product_id']],
                    $result['message'],
                    201
                );
            } else {
                Response::error(
                    $result['message'],
                    400,
                    $result['errors'] ?? []
                );
            }
            break;
            
        case 'update':
            if ($method !== 'PUT' && $method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid product ID']);
            }
            
            $input = getInput();
            $result = $product->update($id, $input);
            
            if ($result['success']) {
                Response::success(null, $result['message']);
            } else {
                Response::error($result['message']);
            }
            break;
            
        case 'delete':
            if ($method !== 'DELETE' && $method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid product ID']);
            }
            
            $result = $product->delete($id);
            
            if ($result['success']) {
                Response::success(null, $result['message']);
            } else {
                Response::error($result['message']);
            }
            break;
            
        case 'search':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $q = getInput('q');
            if (strlen($q) < 2) {
                Response::badRequest(['q' => 'Search keyword must be at least 2 characters']);
            }
            
            $results = $product->search($q);
            Response::success($results, 'Search results');
            break;
            
        case 'categories':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $categories = $product->getCategories();
            Response::success($categories, 'Categories fetched successfully');
            break;

        case 'upload-image':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }

            $auth->requireAdmin();
            $errors = [];
            $imageFile = productValidateImageUpload($errors);

            if (!empty($errors)) {
                Response::error('Ảnh món ăn không hợp lệ', 400, $errors);
            }

            $imageUrl = productStoreImageFile($imageFile);
            Response::success(['image_url' => $imageUrl], 'Product image uploaded');
            break;
            
        case 'best-sellers':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            $limit = getInput('limit', 10);
            
            $sellers = $product->getBestSellers($limit);
            Response::success($sellers, 'Best sellers fetched');
            break;
            
        default:
            Response::error('Action not found', 404);
    }
    
} catch (Exception $e) {
    logError('Product controller error', ['error' => $e->getMessage()]);
    
    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    } else {
        Response::internalError();
    }
}

?>
