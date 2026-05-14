<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../utils/Response.php';

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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $currentUser = requireSessionUser();
    $input = getInput();
    $id = $input['id'] ?? null;

    if (!validatePositiveInt($id)) {
        Response::badRequest(['id' => 'Invalid order ID']);
    }

    $stmt = $pdo->prepare("SELECT id, status FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $currentUser['id']]);
    $order = $stmt->fetch();

    if (!$order) {
        Response::notFound('Order');
    }

    if ($order['status'] !== 'pending') {
        Response::error('Only pending orders can be cancelled', 400);
    }

    $update = $pdo->prepare("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND user_id = ? AND status = 'pending'");
    $update->execute([$id, $currentUser['id']]);

    Response::success(null, 'Order cancelled');
} catch (Exception $e) {
    logError('Order cancel API error', ['error' => $e->getMessage()]);
    Response::internalError(DEBUG_MODE ? $e->getMessage() : 'Internal Server Error');
}
?>
