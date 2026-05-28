<?php
/**
 * FAVORITE CONTROLLER - Quan ly mon an yeu thich cua nguoi dung.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Auth.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $auth = new Auth($pdo);
    $user = $auth->require();
    $userId = (int)$user['id'];
    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? 'status';

    switch ($action) {
        case 'status':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $productId = getInput('product_id');
            if (!validatePositiveInt($productId)) {
                Response::badRequest(['product_id' => 'Invalid product ID']);
            }

            $stmt = $pdo->prepare(
                'SELECT 1 FROM favorite_products WHERE user_id = ? AND product_id = ? LIMIT 1'
            );
            $stmt->execute([$userId, (int)$productId]);

            Response::success([
                'product_id' => (int)$productId,
                'is_favorite' => (bool)$stmt->fetchColumn()
            ]);
            break;

        case 'toggle':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }

            $productId = getInput('product_id');
            if (!validatePositiveInt($productId)) {
                Response::badRequest(['product_id' => 'Invalid product ID']);
            }

            $productStmt = $pdo->prepare('SELECT id FROM products WHERE id = ? AND status = 1');
            $productStmt->execute([(int)$productId]);
            if (!$productStmt->fetchColumn()) {
                Response::notFound('Product');
            }

            $favoriteStmt = $pdo->prepare(
                'SELECT id FROM favorite_products WHERE user_id = ? AND product_id = ? LIMIT 1'
            );
            $favoriteStmt->execute([$userId, (int)$productId]);
            $favoriteId = $favoriteStmt->fetchColumn();

            if ($favoriteId) {
                $deleteStmt = $pdo->prepare('DELETE FROM favorite_products WHERE id = ?');
                $deleteStmt->execute([(int)$favoriteId]);

                Response::success([
                    'product_id' => (int)$productId,
                    'is_favorite' => false
                ], 'Removed from favorites');
            }

            $insertStmt = $pdo->prepare(
                'INSERT INTO favorite_products (user_id, product_id) VALUES (?, ?)'
            );
            $insertStmt->execute([$userId, (int)$productId]);

            Response::success([
                'product_id' => (int)$productId,
                'is_favorite' => true
            ], 'Added to favorites');
            break;

        case 'list':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            $stmt = $pdo->prepare(
                'SELECT p.*, fp.created_at AS favorited_at
                 FROM favorite_products fp
                 INNER JOIN products p ON p.id = fp.product_id
                 WHERE fp.user_id = ? AND p.status = 1
                 ORDER BY fp.created_at DESC'
            );
            $stmt->execute([$userId]);

            Response::success($stmt->fetchAll(), 'Favorites fetched');
            break;

        default:
            Response::error('Action not found', 404);
    }
} catch (Exception $e) {
    logError('Favorite controller error', ['error' => $e->getMessage()]);

    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    }

    Response::internalError();
}

?>
