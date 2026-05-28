<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/Auth.php';

function redeemInput() {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    return is_array($input) ? $input : $_POST;
}

function redeemGenerateUserCouponCode(PDO $pdo, $baseCode, $userId) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_coupons WHERE coupon_code = ?");

    for ($attempt = 0; $attempt < 8; $attempt++) {
        $code = strtoupper($baseCode) . '-U' . (int)$userId . '-' . random_int(1000, 9999);
        $stmt->execute([$code]);

        if ((int)$stmt->fetchColumn() === 0) {
            return $code;
        }
    }

    throw new Exception('Không thể tạo mã giảm giá riêng, vui lòng thử lại.');
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $auth = new Auth($pdo);
    $currentUser = $auth->require();
    $userId = (int)$currentUser['id'];
    $input = redeemInput();
    $couponId = $input['coupon_id'] ?? null;

    if (!validatePositiveInt($couponId)) {
        Response::badRequest(['coupon_id' => 'Invalid coupon ID']);
    }

    $pdo->beginTransaction();

    $couponStmt = $pdo->prepare(
        "SELECT *,
            (start_date IS NULL OR start_date <= NOW()) AS coupon_has_started,
            (end_date IS NULL OR end_date >= NOW()) AS coupon_not_ended
         FROM coupons
         WHERE id = ?
         LIMIT 1
         FOR UPDATE"
    );
    $couponStmt->execute([(int)$couponId]);
    $coupon = $couponStmt->fetch();

    if (!$coupon) {
        throw new Exception('Mã ưu đãi không tồn tại.');
    }

    if ((int)$coupon['status'] !== 1) {
        throw new Exception('Mã ưu đãi hiện không khả dụng.');
    }

    if ((int)$coupon['points_required'] <= 0) {
        throw new Exception('Mã ưu đãi này không hỗ trợ đổi bằng điểm.');
    }

    if (isset($coupon['coupon_has_started']) && (int)$coupon['coupon_has_started'] !== 1) {
        throw new Exception('Mã ưu đãi chưa đến thời gian đổi.');
    }

    if (isset($coupon['coupon_not_ended']) && (int)$coupon['coupon_not_ended'] !== 1) {
        throw new Exception('Mã ưu đãi đã hết hạn.');
    }

    $limitStmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM user_coupons
         WHERE user_id = ?
           AND coupon_id = ?"
    );
    $limitStmt->execute([$userId, (int)$couponId]);
    $redeemedCount = (int)$limitStmt->fetchColumn();
    $perUserLimit = max(1, (int)$coupon['per_user_limit']);

    if ($redeemedCount >= $perUserLimit) {
        throw new Exception('Bạn đã đổi đủ lượt cho mã ưu đãi này.');
    }

    $pointStmt = $pdo->prepare(
        "SELECT points, lifetime_points
         FROM user_points
         WHERE user_id = ?
         LIMIT 1
         FOR UPDATE"
    );
    $pointStmt->execute([$userId]);
    $pointsRow = $pointStmt->fetch();
    $currentPoints = $pointsRow ? (int)$pointsRow['points'] : 0;
    $pointsRequired = (int)$coupon['points_required'];

    if ($currentPoints < $pointsRequired) {
        throw new Exception('Bạn không đủ điểm để đổi mã này.');
    }

    $couponCode = redeemGenerateUserCouponCode($pdo, $coupon['code'], $userId);
    $expiredAt = $coupon['end_date'] ?: date('Y-m-d H:i:s', strtotime('+30 days'));

    $updatePointsStmt = $pdo->prepare(
        "UPDATE user_points
         SET points = points - ?, updated_at = NOW()
         WHERE user_id = ?
           AND points >= ?"
    );
    $updatePointsStmt->execute([$pointsRequired, $userId, $pointsRequired]);

    if ($updatePointsStmt->rowCount() !== 1) {
        throw new Exception('Không thể trừ điểm, vui lòng thử lại.');
    }

    $insertCouponStmt = $pdo->prepare(
        "INSERT INTO user_coupons
         (user_id, coupon_id, coupon_code, source, is_used, expired_at, created_at)
         VALUES (?, ?, ?, 'points_exchange', 0, ?, NOW())"
    );
    $insertCouponStmt->execute([
        $userId,
        (int)$couponId,
        $couponCode,
        $expiredAt
    ]);

    $transactionStmt = $pdo->prepare(
        "INSERT INTO point_transactions
         (user_id, order_id, points, type, description, created_at)
         VALUES (?, NULL, ?, 'redeem', ?, NOW())"
    );
    $transactionStmt->execute([
        $userId,
        -$pointsRequired,
        'Đổi điểm lấy mã giảm giá ' . $coupon['code']
    ]);

    $pdo->commit();

    Response::success([
        'coupon_code' => $couponCode,
        'points' => $currentPoints - $pointsRequired,
        'expired_at' => $expiredAt
    ], 'Đổi mã giảm giá thành công');
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logError('Redeem coupon failed', ['error' => $e->getMessage()]);
    Response::error($e->getMessage() ?: 'Không thể đổi mã giảm giá', 400);
}

?>
