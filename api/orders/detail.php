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
    $id = $_GET['id'] ?? null;

    if (!validatePositiveInt($id)) {
        Response::badRequest(['id' => 'Invalid order ID']);
    }

    $stmt = $pdo->prepare(
        "SELECT o.*, COALESCE(p.payment_method, 'COD') AS payment_method
         FROM orders o
         LEFT JOIN payments p ON p.order_id = o.id
         WHERE o.id = ? AND o.user_id = ?"
    );
    $stmt->execute([$id, $currentUser['id']]);
    $order = $stmt->fetch();

    if (!$order) {
        Response::notFound('Order');
    }

    $itemStmt = $pdo->prepare(
        "SELECT oi.*, p.title, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?"
    );
    $itemStmt->execute([$id]);
    $order['items'] = $itemStmt->fetchAll();
    $order['status'] = normalizeOrderStatus($order['status']);

    Response::success($order, 'Order detail fetched');
} catch (Exception $e) {
    logError('Order detail API error', ['error' => $e->getMessage()]);
    Response::internalError(DEBUG_MODE ? $e->getMessage() : 'Internal Server Error');
}
?>
