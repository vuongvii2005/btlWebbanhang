<?php
/**
 * Admin API - dashboard, categories, customers.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../models/Product.php';

header('Content-Type: application/json; charset=utf-8');

function adminNormalizeCouponCode($code) {
    $code = strtoupper(trim((string)$code));
    $code = preg_replace('/[^A-Z0-9_-]/', '', $code);
    return substr($code, 0, 50);
}

function adminNormalizeDateTime($value) {
    $value = trim((string)$value);
    if ($value === '') {
        return null;
    }

    $value = str_replace('T', ' ', $value);
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $value)) {
        $value .= ':00';
    }

    $timestamp = strtotime($value);
    return $timestamp ? date('Y-m-d H:i:s', $timestamp) : null;
}

function adminCouponBenefit($coupon) {
    $type = $coupon['discount_type'] ?? '';
    $value = (float)($coupon['discount_value'] ?? 0);

    if ($type === 'freeship') {
        return 'Miễn phí giao hàng';
    }

    if ($type === 'percent') {
        return 'Giảm ' . rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.') . '%';
    }

    return 'Giảm ' . formatCurrency($value);
}

function adminCouponHasColumn(PDO $pdo, $column) {
    static $cache = [];
    $column = (string)$column;

    if (array_key_exists($column, $cache)) {
        return $cache[$column];
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'coupons'
           AND COLUMN_NAME = ?"
    );
    $stmt->execute([$column]);
    $cache[$column] = (int)$stmt->fetchColumn() > 0;

    return $cache[$column];
}

function adminParseCouponInput($input) {
    $code = adminNormalizeCouponCode($input['code'] ?? '');
    $title = trim((string)($input['title'] ?? ''));
    $discountType = (string)($input['discount_type'] ?? 'fixed');
    $discountValue = (float)($input['discount_value'] ?? 0);
    $minOrderAmount = max(0, (float)($input['min_order_amount'] ?? 0));
    $maxDiscountAmount = isset($input['max_discount_amount']) && $input['max_discount_amount'] !== ''
        ? max(0, (float)$input['max_discount_amount'])
        : null;
    $pointsRequired = max(0, (int)($input['points_required'] ?? 0));
    $usageLimit = isset($input['usage_limit']) && $input['usage_limit'] !== ''
        ? max(1, (int)$input['usage_limit'])
        : null;
    $perUserLimit = max(1, (int)($input['per_user_limit'] ?? 1));
    $startDate = adminNormalizeDateTime($input['start_date'] ?? '');
    $endDate = adminNormalizeDateTime($input['end_date'] ?? '');
    $status = (int)($input['status'] ?? 1) === 1 ? 1 : 0;

    $errors = [];
    if ($code === '') $errors['code'] = 'Coupon code is required';
    if ($title === '') $errors['title'] = 'Coupon title is required';
    if (!in_array($discountType, ['fixed', 'percent', 'freeship'], true)) $errors['discount_type'] = 'Invalid discount type';
    if ($discountType !== 'freeship' && $discountValue <= 0) $errors['discount_value'] = 'Discount value must be greater than 0';
    if ($discountType === 'percent' && $discountValue > 100) $errors['discount_value'] = 'Percent discount cannot exceed 100';
    if ($startDate && $endDate && strtotime($startDate) > strtotime($endDate)) $errors['end_date'] = 'End date must be after start date';

    return [
        'data' => [
            'code' => $code,
            'title' => sanitizeString($title),
            'description' => sanitizeString($input['description'] ?? ''),
            'discount_type' => $discountType,
            'discount_value' => $discountType === 'freeship' ? 0 : $discountValue,
            'min_order_amount' => $minOrderAmount,
            'max_discount_amount' => $maxDiscountAmount,
            'points_required' => $pointsRequired,
            'usage_limit' => $usageLimit,
            'per_user_limit' => $perUserLimit,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $status
        ],
        'errors' => $errors
    ];
}

try {
    $auth = new Auth($pdo);
    $auth->requireAdmin();

    $userModel = new User($pdo);
    $orderModel = new Order($pdo);
    $productModel = new Product($pdo);

    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? 'dashboard';

    switch ($action) {
        case 'me':
            Response::success($auth->user(), 'Admin session valid');
            break;

        case 'dashboard':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $revenueStmt = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status <> 'cancelled'");
            $revenue = $revenueStmt->fetch()['total'];

            Response::success([
                'total_products' => (int)$productModel->countAdmin(['status' => null]),
                'total_orders' => (int)$orderModel->count(),
                'total_customers' => (int)$userModel->count('customer'),
                'total_revenue' => (float)$revenue,
                'recent_orders' => $orderModel->getAll([], 8, 0)
            ], 'Dashboard fetched');
            break;

        case 'categories':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $stmt = $pdo->query("SELECT * FROM categories ORDER BY display_order ASC, name ASC");
            Response::success($stmt->fetchAll(), 'Categories fetched');
            break;

        case 'category-create':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }

            $input = getInput();
            if (empty($input['name'])) {
                Response::badRequest(['name' => 'Category name is required']);
            }

            try {
                $stmt = $pdo->prepare("INSERT INTO categories (name, description, icon, display_order, created_at) VALUES (?, ?, ?, ?, NOW())");
                $stmt->execute([
                    sanitizeString($input['name']),
                    sanitizeString($input['description'] ?? ''),
                    sanitizeString($input['icon'] ?? ''),
                    (int)($input['display_order'] ?? 0)
                ]);
                Response::success(['id' => $pdo->lastInsertId()], 'Category created', 201);
            } catch (PDOException $e) {
                Response::error('Category name already exists or data is invalid', 400);
            }
            break;

        case 'category-update':
            if ($method !== 'POST' && $method !== 'PUT') {
                Response::error('Method not allowed', 405);
            }

            $input = getInput();
            $id = $input['id'] ?? null;
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid category ID']);
            }

            $stmt = $pdo->prepare("UPDATE categories SET name = ?, description = ?, icon = ?, display_order = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([
                sanitizeString($input['name'] ?? ''),
                sanitizeString($input['description'] ?? ''),
                sanitizeString($input['icon'] ?? ''),
                (int)($input['display_order'] ?? 0),
                $id
            ]);
            Response::success(null, 'Category updated');
            break;

        case 'category-delete':
            if ($method !== 'POST' && $method !== 'DELETE') {
                Response::error('Method not allowed', 405);
            }

            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid category ID']);
            }

            $check = $pdo->prepare("SELECT COUNT(*) AS count FROM products WHERE category_id = ?");
            $check->execute([$id]);
            if ((int)$check->fetch()['count'] > 0) {
                Response::error('Cannot delete category with products', 409);
            }

            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            Response::success(null, 'Category deleted');
            break;

        case 'customers':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $limit = (int)getInput('limit', 100);
            $offset = (int)getInput('offset', 0);
            Response::paginated(
                $userModel->getAll($limit, $offset, 'customer'),
                (int)($offset / $limit) + 1,
                $limit,
                $userModel->count('customer'),
                'Customers fetched'
            );
            break;

        case 'customer-detail':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid customer ID']);
            }

            $customer = $userModel->getById($id);
            if (!$customer || $customer['role'] !== 'customer') {
                Response::notFound('Customer');
            }
            Response::success($customer, 'Customer fetched');
            break;

        case 'customer-status':
            if ($method !== 'POST' && $method !== 'PUT') {
                Response::error('Method not allowed', 405);
            }

            $input = getInput();
            if (!validatePositiveInt($input['id'] ?? null)) {
                Response::badRequest(['id' => 'Invalid customer ID']);
            }
            $status = (int)($input['status'] ?? 0) === 1 ? 1 : 0;
            $result = $userModel->updateStatus($input['id'], $status);
            Response::success(null, $result['message']);
            break;

        case 'coupons':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $redeemedCountExpr = adminCouponHasColumn($pdo, 'redeemed_count')
                ? 'c.redeemed_count'
                : "(SELECT COUNT(*) FROM user_coupons uc WHERE uc.coupon_id = c.id AND uc.source = 'points_exchange')";

            $stmt = $pdo->query(
                "SELECT c.*,
                        (
                            SELECT COUNT(*)
                            FROM user_coupons uc
                            WHERE uc.coupon_id = c.id
                              AND uc.source = 'admin_gift'
                        ) AS gifted_count,
                        (
                            SELECT COUNT(*)
                            FROM user_coupons uc
                            WHERE uc.coupon_id = c.id
                              AND uc.source = 'admin_gift'
                              AND uc.is_used = 1
                        ) AS gifted_used_count,
                        (
                            SELECT COUNT(*)
                            FROM user_coupons uc
                            WHERE uc.coupon_id = c.id
                              AND uc.source = 'points_exchange'
                        ) AS fallback_redeemed_count,
                        $redeemedCountExpr AS redeemed_count,
                        (
                            c.status = 1
                            AND (c.start_date IS NULL OR c.start_date <= NOW())
                            AND (c.end_date IS NULL OR c.end_date >= NOW())
                            AND (c.usage_limit IS NULL OR $redeemedCountExpr < c.usage_limit)
                        ) AS can_gift
                 FROM coupons c
                 ORDER BY (c.points_required > 0) DESC, c.points_required ASC, c.created_at DESC, c.id DESC"
            );

            $coupons = array_map(function ($coupon) {
                $coupon['gifted_count'] = (int)($coupon['gifted_count'] ?? 0);
                $coupon['gifted_used_count'] = (int)($coupon['gifted_used_count'] ?? 0);
                $coupon['redeemed_count'] = (int)($coupon['redeemed_count'] ?? 0);
                $coupon['is_redeemable'] = (int)($coupon['points_required'] ?? 0) > 0;
                $coupon['can_gift'] = (int)($coupon['can_gift'] ?? 0) === 1;
                $coupon['benefit_label'] = adminCouponBenefit($coupon);
                return $coupon;
            }, $stmt->fetchAll());

            Response::success($coupons, 'Coupons fetched');
            break;

        case 'coupon-create':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }

            $parsed = adminParseCouponInput(getInput());
            $data = $parsed['data'];
            $errors = $parsed['errors'];
            if ($errors) {
                Response::badRequest($errors);
            }

            try {
                $hasRedeemedCount = adminCouponHasColumn($pdo, 'redeemed_count');
                $redeemedColumn = $hasRedeemedCount ? ', redeemed_count' : '';
                $redeemedValue = $hasRedeemedCount ? ', 0' : '';

                $stmt = $pdo->prepare(
                    "INSERT INTO coupons
                     (code, title, description, discount_type, discount_value, min_order_amount,
                      max_discount_amount, points_required, usage_limit$redeemedColumn, used_count,
                      per_user_limit, start_date, end_date, status, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?$redeemedValue, 0, ?, ?, ?, ?, NOW(), NOW())"
                );
                $stmt->execute([
                    $data['code'],
                    $data['title'],
                    $data['description'],
                    $data['discount_type'],
                    $data['discount_value'],
                    $data['min_order_amount'],
                    $data['max_discount_amount'],
                    $data['points_required'],
                    $data['usage_limit'],
                    $data['per_user_limit'],
                    $data['start_date'],
                    $data['end_date'],
                    $data['status']
                ]);

                Response::success(['id' => $pdo->lastInsertId()], 'Coupon created', 201);
            } catch (PDOException $e) {
                Response::error('Coupon code already exists or data is invalid', 400);
            }
            break;

        case 'coupon-update':
            if ($method !== 'POST' && $method !== 'PUT') {
                Response::error('Method not allowed', 405);
            }

            $input = getInput();
            $id = $input['id'] ?? null;
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid coupon ID']);
            }

            $parsed = adminParseCouponInput($input);
            $data = $parsed['data'];
            $errors = $parsed['errors'];
            if ($errors) {
                Response::badRequest($errors);
            }

            try {
                $stmt = $pdo->prepare(
                    "UPDATE coupons
                     SET code = ?,
                         title = ?,
                         description = ?,
                         discount_type = ?,
                         discount_value = ?,
                         min_order_amount = ?,
                         max_discount_amount = ?,
                         points_required = ?,
                         usage_limit = ?,
                         per_user_limit = ?,
                         start_date = ?,
                         end_date = ?,
                         status = ?,
                         updated_at = NOW()
                     WHERE id = ?"
                );
                $stmt->execute([
                    $data['code'],
                    $data['title'],
                    $data['description'],
                    $data['discount_type'],
                    $data['discount_value'],
                    $data['min_order_amount'],
                    $data['max_discount_amount'],
                    $data['points_required'],
                    $data['usage_limit'],
                    $data['per_user_limit'],
                    $data['start_date'],
                    $data['end_date'],
                    $data['status'],
                    (int)$id
                ]);

                Response::success(null, 'Coupon updated');
            } catch (PDOException $e) {
                Response::error('Coupon code already exists or data is invalid', 400);
            }
            break;

        case 'coupon-toggle':
            if ($method !== 'POST' && $method !== 'PUT') {
                Response::error('Method not allowed', 405);
            }

            $input = getInput();
            $id = $input['id'] ?? null;
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid coupon ID']);
            }

            if (array_key_exists('status', $input)) {
                $status = (int)$input['status'] === 1 ? 1 : 0;
            } else {
                $currentStmt = $pdo->prepare("SELECT status FROM coupons WHERE id = ? LIMIT 1");
                $currentStmt->execute([(int)$id]);
                $currentStatus = $currentStmt->fetchColumn();
                if ($currentStatus === false) {
                    Response::notFound('Coupon');
                }
                $status = (int)$currentStatus === 1 ? 0 : 1;
            }

            $stmt = $pdo->prepare("UPDATE coupons SET status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, (int)$id]);
            Response::success(['status' => $status], 'Coupon status updated');
            break;

        case 'coupon-delete':
            if ($method !== 'POST' && $method !== 'DELETE') {
                Response::error('Method not allowed', 405);
            }

            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid coupon ID']);
            }

            $stmt = $pdo->prepare("UPDATE coupons SET status = 0, updated_at = NOW() WHERE id = ?");
            $stmt->execute([(int)$id]);
            Response::success(null, 'Coupon hidden');
            break;

        case 'coupon-gift':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }

            $input = getInput();
            $couponId = $input['coupon_id'] ?? null;
            $userId = $input['user_id'] ?? null;
            $expiredAt = adminNormalizeDateTime($input['expired_at'] ?? '');

            if (!validatePositiveInt($couponId)) {
                Response::badRequest(['coupon_id' => 'Invalid coupon ID']);
            }

            if (!validatePositiveInt($userId)) {
                Response::badRequest(['user_id' => 'Invalid customer ID']);
            }

            $giftRedeemedCountExpr = adminCouponHasColumn($pdo, 'redeemed_count')
                ? 'redeemed_count'
                : "(SELECT COUNT(*) FROM user_coupons uc WHERE uc.coupon_id = coupons.id AND uc.source = 'points_exchange')";

            $couponStmt = $pdo->prepare(
                "SELECT *,
                    $giftRedeemedCountExpr AS redeemed_count,
                    (start_date IS NULL OR start_date <= NOW()) AS coupon_has_started,
                    (end_date IS NULL OR end_date >= NOW()) AS coupon_not_ended
                 FROM coupons
                 WHERE id = ?
                 LIMIT 1"
            );
            $couponStmt->execute([$couponId]);
            $coupon = $couponStmt->fetch();
            if (!$coupon) {
                Response::notFound('Coupon');
            }

            if ((int)$coupon['status'] !== 1) {
                Response::error('Coupon is disabled', 409);
            }

            if (isset($coupon['coupon_has_started']) && (int)$coupon['coupon_has_started'] !== 1) {
                Response::error('Coupon has not started yet', 409);
            }

            if (isset($coupon['coupon_not_ended']) && (int)$coupon['coupon_not_ended'] !== 1) {
                Response::error('Coupon has expired', 409);
            }

            if ($coupon['usage_limit'] !== null && (int)$coupon['redeemed_count'] >= (int)$coupon['usage_limit']) {
                Response::error('Coupon usage limit reached', 409);
            }

            $customerStmt = $pdo->prepare("SELECT id, fullname, role, status FROM users WHERE id = ? LIMIT 1");
            $customerStmt->execute([$userId]);
            $customer = $customerStmt->fetch();
            if (!$customer || $customer['role'] !== 'customer') {
                Response::notFound('Customer');
            }
            if ((int)$customer['status'] !== 1) {
                Response::error('Customer account is locked', 409);
            }

            if (!$expiredAt && !empty($coupon['end_date'])) {
                $expiredAt = $coupon['end_date'];
            }

            for ($attempt = 0; $attempt < 5; $attempt++) {
                $giftCode = substr($coupon['code'], 0, 34) . '-U' . (int)$userId . '-' . strtoupper(bin2hex(random_bytes(3)));

                try {
                    $insertStmt = $pdo->prepare(
                        "INSERT INTO user_coupons
                         (user_id, coupon_id, coupon_code, source, is_used, expired_at, created_at)
                         VALUES (?, ?, ?, 'admin_gift', 0, ?, NOW())"
                    );
                    $insertStmt->execute([(int)$userId, (int)$couponId, $giftCode, $expiredAt]);

                    Response::success([
                        'coupon_code' => $giftCode,
                        'customer_name' => $customer['fullname']
                    ], 'Coupon gifted', 201);
                } catch (PDOException $e) {
                    if ($attempt === 4) {
                        Response::error('Could not create a unique gift code', 500);
                    }
                }
            }
            break;

        default:
            Response::error('Action not found', 404);
    }
} catch (Exception $e) {
    logError('Admin controller error', ['error' => $e->getMessage()]);

    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    } else {
        Response::internalError();
    }
}

?>
