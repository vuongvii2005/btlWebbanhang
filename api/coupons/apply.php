<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../checkout/checkout-helpers.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $currentUser = checkoutRequireAuthenticatedUser();
    $input = checkoutReadInput();
    $couponCode = trim($input['coupon_code'] ?? '');

    if ($couponCode === '') {
        Response::badRequest(['coupon_code' => 'Coupon code is required']);
    }

    $deliveryType = checkoutDeliveryType($input);
    $items = $input['items'] ?? [];

    $totals = checkoutCalculateTotals(
        $pdo,
        $currentUser['id'],
        $items,
        $deliveryType,
        $couponCode,
        false
    );

    Response::success([
        'coupon' => $totals['coupon'],
        'subtotal' => $totals['subtotal'],
        'base_shipping_fee' => $totals['base_shipping_fee'],
        'shipping_fee' => $totals['shipping_fee'],
        'discount_amount' => $totals['discount_amount'],
        'final_amount' => $totals['final_amount']
    ], $totals['message'] ?: 'Coupon applied');
} catch (Exception $e) {
    logError('Apply coupon failed', ['error' => $e->getMessage()]);
    Response::error($e->getMessage() ?: 'Không thể áp dụng mã giảm giá', 400);
}

?>
