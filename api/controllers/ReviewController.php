<?php
/**
 * REVIEW CONTROLLER - API đánh giá sản phẩm.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Auth.php';

header('Content-Type: application/json; charset=utf-8');

function reviewGetProductId() {
    $productId = getInput('product_id') ?? getInput('id');

    if (!validatePositiveInt($productId)) {
        Response::badRequest(['product_id' => 'Product ID is required']);
    }

    return (int)$productId;
}

function reviewGetOrderId() {
    $orderId = getInput('order_id');
    return validatePositiveInt($orderId) ? (int)$orderId : null;
}

function reviewColumnExists(PDO $pdo, $column) {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'reviews'
           AND COLUMN_NAME = ?"
    );
    $stmt->execute([$column]);
    return (int)$stmt->fetchColumn() > 0;
}

function reviewGetProduct(PDO $pdo, $productId, $forUpdate = false) {
    $stmt = $pdo->prepare('SELECT id, title FROM products WHERE id = ? LIMIT 1' . ($forUpdate ? ' FOR UPDATE' : ''));
    $stmt->execute([(int)$productId]);
    return $stmt->fetch() ?: null;
}

function reviewVisibleWhere(PDO $pdo) {
    if (reviewColumnExists($pdo, 'is_visible')) {
        return ' AND r.is_visible = 1';
    }

    if (reviewColumnExists($pdo, 'status')) {
        return " AND r.status = 'visible'";
    }

    return '';
}

function reviewDecodeImages($images) {
    if (!$images) {
        return [];
    }

    $decoded = json_decode($images, true);
    return is_array($decoded) ? array_values(array_filter($decoded)) : [];
}

function reviewUserHasCompletedProduct(PDO $pdo, $userId, $productId, $orderId = null) {
    $orderFilter = $orderId ? ' AND o.id = ?' : '';
    $stmt = $pdo->prepare(
        "SELECT 1
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ?
           AND oi.product_id = ?
           AND o.status IN ('delivered', 'completed')
           $orderFilter
         LIMIT 1"
    );
    $params = [(int)$userId, (int)$productId];
    if ($orderId) {
        $params[] = (int)$orderId;
    }

    $stmt->execute($params);
    return (bool)$stmt->fetchColumn();
}

function reviewUserAlreadyReviewed(PDO $pdo, $userId, $productId, $orderId = null) {
    $hasOrderColumn = reviewColumnExists($pdo, 'order_id');
    $sql = 'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?';
    $params = [(int)$userId, (int)$productId];

    if ($hasOrderColumn && $orderId) {
        $sql .= ' AND order_id = ?';
        $params[] = (int)$orderId;
    }

    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchColumn();
}

function reviewBuildSummary(PDO $pdo, $productId) {
    $visibleWhere = reviewVisibleWhere($pdo);
    $hasImages = reviewColumnExists($pdo, 'images');

    $summaryStmt = $pdo->prepare(
        "SELECT
            COUNT(*) AS total_reviews,
            COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
            SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS rating_5,
            SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS rating_4,
            SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS rating_3,
            SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS rating_2,
            SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS rating_1,
            SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END) AS positive_reviews" .
            ($hasImages ? ", SUM(CASE WHEN r.images IS NOT NULL AND r.images <> '' AND r.images <> '[]' THEN 1 ELSE 0 END) AS with_images" : ", 0 AS with_images") . "
         FROM reviews r
         WHERE r.product_id = ?$visibleWhere"
    );
    $summaryStmt->execute([$productId]);
    $summary = $summaryStmt->fetch() ?: [];
    $total = (int)($summary['total_reviews'] ?? 0);
    $positive = (int)($summary['positive_reviews'] ?? 0);

    return [
        'total_reviews' => $total,
        'average_rating' => (float)($summary['average_rating'] ?? 0),
        'with_images' => (int)($summary['with_images'] ?? 0),
        'positive_percent' => $total > 0 ? (int)round($positive * 100 / $total) : 0,
        'breakdown' => [
            5 => (int)($summary['rating_5'] ?? 0),
            4 => (int)($summary['rating_4'] ?? 0),
            3 => (int)($summary['rating_3'] ?? 0),
            2 => (int)($summary['rating_2'] ?? 0),
            1 => (int)($summary['rating_1'] ?? 0)
        ]
    ];
}

function reviewList(PDO $pdo) {
    $productId = reviewGetProductId();

    if (!reviewGetProduct($pdo, $productId)) {
        Response::notFound('Product');
    }

    $summary = reviewBuildSummary($pdo, $productId);
    $visibleWhere = reviewVisibleWhere($pdo);
    $hasOrderColumn = reviewColumnExists($pdo, 'order_id');
    $hasImages = reviewColumnExists($pdo, 'images');

    $reviewStmt = $pdo->prepare(
        "SELECT
            r.id,
            r.product_id,
            r.user_id,
            " . ($hasOrderColumn ? 'r.order_id,' : 'NULL AS order_id,') . "
            r.rating,
            r.comment,
            " . ($hasImages ? 'r.images,' : 'NULL AS images,') . "
            r.created_at,
            u.fullname AS user_name,
            u.avatar_url AS user_avatar
         FROM reviews r
         INNER JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ?$visibleWhere
         ORDER BY r.created_at DESC, r.id DESC"
    );
    $reviewStmt->execute([$productId]);
    $reviews = $reviewStmt->fetchAll();

    foreach ($reviews as &$review) {
        $review['images'] = reviewDecodeImages($review['images'] ?? null);
        $review['verified_purchase'] = true;
    }

    Response::success([
        'product_id' => $productId,
        'summary' => $summary,
        'reviews' => $reviews
    ], 'Reviews fetched');
}

function reviewStats(PDO $pdo) {
    $productId = reviewGetProductId();

    if (!reviewGetProduct($pdo, $productId)) {
        Response::notFound('Product');
    }

    Response::success([
        'product_id' => $productId,
        'summary' => reviewBuildSummary($pdo, $productId)
    ], 'Review stats fetched');
}

function reviewStatus(PDO $pdo, Auth $auth) {
    $productId = reviewGetProductId();

    if (!reviewGetProduct($pdo, $productId)) {
        Response::notFound('Product');
    }

    $user = $auth->user();
    $orderId = reviewGetOrderId();
    if (!$user) {
        Response::success([
            'product_id' => $productId,
            'order_id' => $orderId,
            'is_logged_in' => false,
            'has_completed_order' => false,
            'already_reviewed' => false,
            'can_review' => false,
            'message' => 'Bạn chỉ có thể đánh giá sau khi đã mua sản phẩm.'
        ], 'Review status fetched');
    }

    $userId = (int)$user['id'];
    $hasCompletedOrder = reviewUserHasCompletedProduct($pdo, $userId, $productId, $orderId);
    $alreadyReviewed = (bool)reviewUserAlreadyReviewed($pdo, $userId, $productId, $orderId);
    $canReview = $hasCompletedOrder && !$alreadyReviewed;
    $message = 'Bạn có thể đánh giá sản phẩm này.';

    if (!$hasCompletedOrder) {
        $message = 'Bạn chỉ có thể đánh giá sau khi đã mua sản phẩm.';
    } elseif ($alreadyReviewed) {
        $message = 'Bạn đã đánh giá sản phẩm này rồi.';
    }

    Response::success([
        'product_id' => $productId,
        'order_id' => $orderId,
        'is_logged_in' => true,
        'has_completed_order' => $hasCompletedOrder,
        'already_reviewed' => $alreadyReviewed,
        'can_review' => $canReview,
        'message' => $message
    ], 'Review status fetched');
}

function reviewCreate(PDO $pdo, Auth $auth) {
    $user = $auth->require();
    $userId = (int)$user['id'];
    $productId = reviewGetProductId();
    $orderId = reviewGetOrderId();
    $rating = getInput('rating');
    $comment = trim((string)(getInput('comment', '') ?? ''));
    $errors = [];

    if (!validatePositiveInt($rating) || (int)$rating < 1 || (int)$rating > 5) {
        $errors['rating'] = 'Rating must be between 1 and 5';
    }

    if ($comment !== '' && (function_exists('mb_strlen') ? mb_strlen($comment, 'UTF-8') : strlen($comment)) > 1000) {
        $errors['comment'] = 'Comment must not exceed 1000 characters';
    }

    if (!empty($errors)) {
        Response::badRequest($errors);
    }

    $product = reviewGetProduct($pdo, $productId);
    if (!$product) {
        Response::notFound('Product');
    }

    try {
        $pdo->beginTransaction();

        $product = reviewGetProduct($pdo, $productId, true);
        if (!$product) {
            $pdo->rollBack();
            Response::notFound('Product');
        }

        if (!reviewUserHasCompletedProduct($pdo, $userId, $productId, $orderId)) {
            $pdo->rollBack();
            Response::error('Bạn chỉ có thể đánh giá sản phẩm trong đơn hàng đã hoàn thành.', 403);
        }

        if (reviewUserAlreadyReviewed($pdo, $userId, $productId, $orderId)) {
            $pdo->rollBack();
            Response::conflict('Bạn đã đánh giá sản phẩm này rồi.');
        }

        $safeComment = $comment === '' ? null : sanitizeString($comment);
        $hasOrderColumn = reviewColumnExists($pdo, 'order_id');

        if ($hasOrderColumn) {
            $stmt = $pdo->prepare(
                'INSERT INTO reviews (product_id, user_id, order_id, rating, comment, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $productId,
                $userId,
                $orderId,
                (int)$rating,
                $safeComment
            ]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $productId,
                $userId,
                (int)$rating,
                $safeComment
            ]);
        }

        $reviewId = (int)$pdo->lastInsertId();
        $pdo->commit();

        Response::success([
            'id' => $reviewId,
            'product_id' => $productId,
            'order_id' => $orderId,
            'user_id' => $userId,
            'rating' => (int)$rating,
            'comment' => $safeComment
        ], 'Review created', 201);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $e;
    }
}

try {
    $auth = new Auth($pdo);
    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? ($method === 'POST' ? 'create' : 'list');

    switch ($action) {
        case 'list':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            reviewList($pdo);
            break;

        case 'create':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }

            reviewCreate($pdo, $auth);
            break;

        case 'status':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            reviewStatus($pdo, $auth);
            break;

        case 'stats':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }

            reviewStats($pdo);
            break;

        default:
            Response::error('Action not found', 404);
    }
} catch (Exception $e) {
    logError('Review controller error', ['error' => $e->getMessage()]);

    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    }

    Response::internalError();
}

?>
