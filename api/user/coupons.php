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
require_once __DIR__ . '/welcome-coupon-helper.php';

function couponFormatDateValue($value) {
    return $value ?: null;
}

function couponIsExpired($expiredAt, $couponEndDate) {
    $expiresAt = $expiredAt ?: $couponEndDate;
    return $expiresAt !== null && strtotime($expiresAt) < time();
}

function couponStatusLabel($coupon) {
    if ((int)$coupon['is_used'] === 1) {
        return ['used', 'Đã dùng'];
    }

    if ((int)$coupon['coupon_status'] !== 1 || couponIsExpired($coupon['expired_at'], $coupon['end_date'])) {
        return ['expired', 'Hết hạn'];
    }

    return ['active', 'Chưa dùng'];
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Method not allowed', 405);
    }

    $auth = new Auth($pdo);
    $currentUser = $auth->require();
    $userId = (int)$currentUser['id'];

    welcomeCouponEnsureForUser($pdo, $userId);

    $pointStmt = $pdo->prepare("SELECT points, lifetime_points FROM user_points WHERE user_id = ? LIMIT 1");
    $pointStmt->execute([$userId]);
    $pointsRow = $pointStmt->fetch() ?: ['points' => 0, 'lifetime_points' => 0];
    $currentPoints = (int)$pointsRow['points'];

    $userCouponStmt = $pdo->prepare(
        "SELECT
            uc.id AS user_coupon_id,
            uc.coupon_id,
            uc.coupon_code,
            uc.is_used,
            uc.used_order_id,
            uc.created_at,
            uc.expired_at,
            uc.used_at,
            c.code,
            c.title,
            c.description,
            c.discount_type,
            c.discount_value,
            c.min_order_amount,
            c.max_discount_amount,
            c.points_required,
            c.end_date,
            c.status AS coupon_status
         FROM user_coupons uc
         INNER JOIN coupons c ON c.id = uc.coupon_id
         WHERE uc.user_id = ?
         ORDER BY uc.is_used ASC, COALESCE(uc.expired_at, c.end_date) ASC, uc.created_at DESC"
    );
    $userCouponStmt->execute([$userId]);
    $userCoupons = $userCouponStmt->fetchAll();

    foreach ($userCoupons as &$coupon) {
        [$statusCode, $statusLabel] = couponStatusLabel($coupon);
        $coupon['status_code'] = $statusCode;
        $coupon['status_label'] = $statusLabel;
        $coupon['expires_at'] = couponFormatDateValue($coupon['expired_at'] ?: $coupon['end_date']);
        $coupon['can_use'] = $statusCode === 'active';
        $coupon['discount_value'] = (float)$coupon['discount_value'];
        $coupon['min_order_amount'] = (float)$coupon['min_order_amount'];
        $coupon['max_discount_amount'] = $coupon['max_discount_amount'] !== null ? (float)$coupon['max_discount_amount'] : null;
        $coupon['points_required'] = (int)$coupon['points_required'];
        $coupon['is_used'] = (int)$coupon['is_used'];
    }
    unset($coupon);

    $availableStmt = $pdo->prepare(
        "SELECT
            c.id,
            c.code,
            c.title,
            c.description,
            c.discount_type,
            c.discount_value,
            c.min_order_amount,
            c.max_discount_amount,
            c.points_required,
            c.per_user_limit,
            c.end_date,
            (
                SELECT COUNT(*)
                FROM user_coupons uc
                WHERE uc.user_id = ?
                  AND uc.coupon_id = c.id
            ) AS user_redeemed_count
         FROM coupons c
         WHERE c.status = 1
           AND c.points_required > 0
           AND (c.start_date IS NULL OR c.start_date <= NOW())
           AND (c.end_date IS NULL OR c.end_date >= NOW())
         ORDER BY c.points_required ASC, c.id ASC"
    );
    $availableStmt->execute([$userId]);
    $availableCoupons = $availableStmt->fetchAll();

    foreach ($availableCoupons as &$coupon) {
        $coupon['discount_value'] = (float)$coupon['discount_value'];
        $coupon['min_order_amount'] = (float)$coupon['min_order_amount'];
        $coupon['max_discount_amount'] = $coupon['max_discount_amount'] !== null ? (float)$coupon['max_discount_amount'] : null;
        $coupon['points_required'] = (int)$coupon['points_required'];
        $coupon['per_user_limit'] = (int)$coupon['per_user_limit'];
        $coupon['user_redeemed_count'] = (int)$coupon['user_redeemed_count'];
        $coupon['can_redeem'] = $currentPoints >= $coupon['points_required']
            && $coupon['user_redeemed_count'] < $coupon['per_user_limit'];
        $coupon['redeem_status'] = $coupon['can_redeem']
            ? 'available'
            : ($currentPoints < $coupon['points_required'] ? 'not_enough_points' : 'limit_reached');
    }
    unset($coupon);

    Response::success([
        'points' => [
            'points' => $currentPoints,
            'lifetime_points' => (int)$pointsRow['lifetime_points']
        ],
        'user_coupons' => $userCoupons,
        'available_coupons' => $availableCoupons
    ], 'User coupons fetched');
} catch (Exception $e) {
    logError('User coupons API error', ['error' => $e->getMessage()]);
    Response::internalError(DEBUG_MODE ? $e->getMessage() : 'Internal Server Error');
}

?>
