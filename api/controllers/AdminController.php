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
