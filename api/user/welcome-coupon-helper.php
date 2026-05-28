<?php

const WELCOME_COUPON_CODE = 'WELCOME50K';
const WELCOME_COUPON_DISCOUNT = 50000;

function welcomeCouponEnsureDefinition(PDO $pdo) {
    $stmt = $pdo->prepare(
        "INSERT INTO coupons
         (code, title, description, discount_type, discount_value, min_order_amount, max_discount_amount,
          points_required, usage_limit, used_count, per_user_limit, start_date, end_date, status, created_at, updated_at)
         VALUES
         (?, 'Giảm 50.000đ cho tài khoản mới',
          'Mã giảm giá chào mừng, mỗi tài khoản khách hàng nhận 1 lần.',
          'fixed', ?, 0, NULL, 0, NULL, 0, 1, NULL, NULL, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            discount_type = 'fixed',
            discount_value = VALUES(discount_value),
            min_order_amount = 0,
            max_discount_amount = NULL,
            points_required = 0,
            usage_limit = NULL,
            per_user_limit = 1,
            start_date = NULL,
            end_date = NULL,
            status = 1,
            updated_at = NOW()"
    );
    $stmt->execute([WELCOME_COUPON_CODE, WELCOME_COUPON_DISCOUNT]);

    $selectStmt = $pdo->prepare("SELECT id FROM coupons WHERE code = ? LIMIT 1");
    $selectStmt->execute([WELCOME_COUPON_CODE]);
    $couponId = $selectStmt->fetchColumn();

    if (!$couponId) {
        throw new Exception('Không thể tạo mã giảm giá chào mừng.');
    }

    return (int)$couponId;
}

function welcomeCouponUserIsCustomer(PDO $pdo, $userId) {
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([(int)$userId]);
    return $stmt->fetchColumn() === 'customer';
}

function welcomeCouponFindUserCoupon(PDO $pdo, $userId, $couponId) {
    $stmt = $pdo->prepare(
        "SELECT id, coupon_code
         FROM user_coupons
         WHERE user_id = ?
           AND coupon_id = ?
         LIMIT 1"
    );
    $stmt->execute([(int)$userId, (int)$couponId]);
    return $stmt->fetch() ?: null;
}

function welcomeCouponEnsureForUser(PDO $pdo, $userId) {
    $userId = (int)$userId;
    if ($userId <= 0 || !welcomeCouponUserIsCustomer($pdo, $userId)) {
        return null;
    }

    $couponId = welcomeCouponEnsureDefinition($pdo);
    $existing = welcomeCouponFindUserCoupon($pdo, $userId, $couponId);
    if ($existing) {
        return $existing;
    }

    $couponCode = WELCOME_COUPON_CODE . '-U' . $userId;

    try {
        $insertStmt = $pdo->prepare(
            "INSERT INTO user_coupons
             (user_id, coupon_id, coupon_code, source, is_used, expired_at, created_at)
             VALUES (?, ?, ?, 'campaign', 0, NULL, NOW())"
        );
        $insertStmt->execute([$userId, $couponId, $couponCode]);
    } catch (PDOException $e) {
        if ($e->getCode() !== '23000') {
            throw $e;
        }
    }

    return welcomeCouponFindUserCoupon($pdo, $userId, $couponId);
}

?>
