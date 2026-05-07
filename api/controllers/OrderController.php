<?php
/**
 * 📦 ORDER CONTROLLER - Xử lý đơn hàng
 * API Routes:
 * - POST /api/orders (Tạo đơn hàng)
 * - GET  /api/orders (Lấy đơn hàng của user)
 * - GET  /api/orders/:id (Chi tiết đơn hàng)
 * - GET  /api/orders/admin/all (Admin - Lấy all đơn)
 * - PUT  /api/orders/:id/status (Admin - Update status)
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../models/Order.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $order = new Order($pdo);
    $auth = new Auth($pdo);
    
    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? 'list';
    
    switch ($action) {
        
        case 'create':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $currentUser = $auth->require();
            $input = getInput();
            
            // Assume items từ localStorage/frontend
            $result = $order->create($currentUser['id'], $input);
            
            if ($result['success']) {
                Response::success(
                    ['order_id' => $result['order_id']],
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
            
        case 'list':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $currentUser = $auth->require();
            
            $limit = getInput('limit', DEFAULT_PER_PAGE);
            $offset = getInput('offset', 0);
            
            $orders = $order->getUserOrders($currentUser['id'], $limit, $offset);
            
            // Lấy chi tiết items cho mỗi order
            foreach ($orders as &$o) {
                $detail = $order->getById($o['id'], $currentUser['id']);
                if ($detail) {
                    $o['items'] = $detail['items'];
                }
            }
            
            Response::success(
                $orders,
                'Orders fetched successfully'
            );
            break;
            
        case 'detail':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $currentUser = $auth->require();
            $id = getInput('id');
            
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid order ID']);
            }
            
            $orderData = $order->getById($id, $currentUser['id']);
            
            if ($orderData) {
                Response::success($orderData);
            } else {
                Response::notFound('Order');
            }
            break;
            
        case 'admin-all':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $filters = [
                'status' => getInput('status'),
                'date_from' => getInput('date_from'),
                'date_to' => getInput('date_to')
            ];
            
            $limit = getInput('limit', DEFAULT_PER_PAGE);
            $offset = getInput('offset', 0);
            
            $orders = $order->getAll($filters, $limit, $offset);
            $total = $order->count($filters);
            
            Response::paginated(
                $orders,
                (int)($offset / $limit) + 1,
                $limit,
                $total,
                'All orders fetched'
            );
            break;
            
        case 'update-status':
            if ($method !== 'PUT' && $method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $id = getInput('id');
            $status = getInput('status');
            
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid order ID']);
            }
            
            $result = $order->updateStatus($id, $status);
            
            if ($result['success']) {
                Response::success(null, $result['message']);
            } else {
                Response::error($result['message']);
            }
            break;
            
        case 'revenue-stats':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $stats = $order->getRevenueStats(
                getInput('date_from'),
                getInput('date_to')
            );
            
            Response::success($stats, 'Revenue stats fetched');
            break;
            
        default:
            Response::error('Action not found', 404);
    }
    
} catch (Exception $e) {
    logError('Order controller error', ['error' => $e->getMessage()]);
    
    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    } else {
        Response::internalError();
    }
}

?>
