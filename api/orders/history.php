<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../utils/Response.php';

function normalizeOrderStatus($status) {
    return $status === 'delivered' ? 'completed' : $status;
}

function requireSessionUser() {
    if (hasBearerToken()) {
        $tokenUser = getAuthUser();
        if ($tokenUser) {
            return $tokenUser;
        }

        Response::unauthorized();
    }

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (empty($_SESSION['user'])) {
        Response::unauthorized();
    }

    return $_SESSION['user'];
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Method not allowed', 405);
    }

    $currentUser = requireSessionUser();

    $stmt = $pdo->prepare(
        "SELECT o.id, o.created_at, o.total_amount, o.shipping_fee, o.status,
                o.customer_name, o.customer_phone, o.customer_address,
                COALESCE(p.payment_method, 'COD') AS payment_method
         FROM orders o
         LEFT JOIN payments p ON p.order_id = o.id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC"
    );
    $stmt->execute([$currentUser['id']]);
    $orders = $stmt->fetchAll();

    foreach ($orders as &$order) {
        $order['status'] = normalizeOrderStatus($order['status']);
        $itemStmt = $pdo->prepare(
            "SELECT oi.product_id, oi.quantity, oi.price, p.title, p.image_url
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?
             ORDER BY oi.id ASC"
        );
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll();
        $order['items'] = $items;
        $order['total_items'] = array_reduce($items, function ($total, $item) {
            return $total + (int)$item['quantity'];
        }, 0);
        $order['thumbnail'] = $items[0]['image_url'] ?? '';
    }

    Response::success($orders, 'Order history fetched');
} catch (Exception $e) {
    logError('Order history API error', ['error' => $e->getMessage()]);
    Response::internalError(DEBUG_MODE ? $e->getMessage() : 'Internal Server Error');
}
?>
