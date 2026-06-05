<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/checkout-helpers.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $currentUser = checkoutRequireAuthenticatedUser();
    $input = checkoutReadInput();

    $customerName = trim($input['customer_name'] ?? '');
    $customerPhone = trim($input['customer_phone'] ?? $input['phone'] ?? $input['customerPhone'] ?? '');
    $customerEmail = trim($input['email'] ?? '');
    $streetAddress = trim($input['customer_address'] ?? $input['address'] ?? $input['customerAddress'] ?? '');
    $province = trim($input['province'] ?? '');
    $ward = trim($input['ward'] ?? '');
    $deliveryType = checkoutDeliveryType($input);

    if ($deliveryType === 'pickup') {
        $streetAddress = 'U8-I82, khu đô thị Đô Nghĩa';
        $province = 'thành phố Hà Nội';
        $ward = 'Phường Yên Nghĩa';
        $input['customer_address'] = $streetAddress;
        $input['province'] = $province;
        $input['ward'] = $ward;
    }

    $customerAddress = checkoutBuildCustomerAddress($input);
    $couponCode = trim($input['coupon_code'] ?? '');
    $items = $input['items'] ?? [];

    if ($customerName === '') {
        Response::badRequest(['customer_name' => 'Customer name is required']);
    }

    if ($customerPhone === '') {
        Response::badRequest(['customer_phone' => 'Customer phone is required']);
    }

    if (!validatePhone($customerPhone)) {
        Response::badRequest(['customer_phone' => 'Phone format is invalid']);
    }

    if ($customerEmail !== '' && !validateEmail($customerEmail)) {
        Response::badRequest(['email' => 'Email format is invalid']);
    }

    if ($deliveryType === 'delivery') {
        $missingAddress = [];
        if ($streetAddress === '') $missingAddress['customer_address'] = 'Address is required';
        if ($province === '') $missingAddress['province'] = 'Province is required';
        if ($ward === '') $missingAddress['ward'] = 'Ward is required';

        if (!empty($missingAddress)) {
            Response::badRequest($missingAddress);
        }
    }

    $paymentMap = [
        'cod' => 'COD',
        'bank_card' => 'bank_card',
        'e_wallet' => 'e_wallet',
        'bank_transfer' => 'bank_transfer'
    ];
    $paymentKey = strtolower(trim($input['payment_method'] ?? 'cod'));
    $paymentMethod = $paymentMap[$paymentKey] ?? 'COD';

    $deliveryDate = $input['delivery_date'] ?? date('Y-m-d');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$deliveryDate)) {
        $deliveryDate = date('Y-m-d');
    }

    $deliveryTime = sanitizeString($input['delivery_time'] ?? 'asap');
    $notes = trim($input['notes'] ?? '');
    $vatInvoice = checkoutParseBool($input['vat_invoice'] ?? false);
    $saveInfo = checkoutParseBool($input['save_info'] ?? false);

    $noteParts = [];
    if ($notes !== '') {
        $noteParts[] = sanitizeString($notes);
    }
    if ($vatInvoice) {
        $noteParts[] = 'Yêu cầu xuất hóa đơn VAT.';
    }
    $orderNotes = implode("\n", $noteParts);

    $pdo->beginTransaction();

    $totals = checkoutCalculateTotals(
        $pdo,
        $currentUser['id'],
        $items,
        $deliveryType,
        $couponCode,
        true,
        true,
        true
    );

    $finalAmount = (float)$totals['final_amount'];
    $pointsEarned = (int)floor($finalAmount / 10000);
    $coupon = $totals['coupon'];

    $orderStmt = $pdo->prepare(
        "INSERT INTO orders
         (user_id, total_amount, shipping_fee, coupon_id, coupon_code, discount_amount,
          points_earned, points_used, final_amount, delivery_type, delivery_date, delivery_time,
          customer_name, customer_phone, customer_address, notes, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())"
    );

    $orderStmt->execute([
        (int)$currentUser['id'],
        $finalAmount,
        $totals['shipping_fee'],
        $coupon['coupon_id'] ?? null,
        $coupon['coupon_code'] ?? null,
        $totals['discount_amount'],
        $pointsEarned,
        $finalAmount,
        $deliveryType,
        $deliveryDate,
        $deliveryTime,
        sanitizeString($customerName),
        sanitizeString($customerPhone),
        sanitizeString($customerAddress),
        $orderNotes
    ]);

    $orderId = (int)$pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, quantity, price, note)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stockStmt = $pdo->prepare(
        "UPDATE products
         SET stock = stock - ?, updated_at = NOW()
         WHERE id = ? AND status = 1 AND stock >= ?"
    );

    foreach ($totals['items'] as $item) {
        $itemStmt->execute([
            $orderId,
            $item['product_id'],
            $item['quantity'],
            $item['price'],
            $item['note']
        ]);

        $stockStmt->execute([
            $item['quantity'],
            $item['product_id'],
            $item['quantity']
        ]);

        if ($stockStmt->rowCount() !== 1) {
            throw new CheckoutClientException('Sản phẩm "' . $item['title'] . '" không còn đủ tồn kho để đặt hàng.');
        }
    }

    if ($coupon) {
        $couponUseStmt = $pdo->prepare(
            "UPDATE user_coupons
             SET is_used = 1, used_order_id = ?, used_at = NOW()
             WHERE id = ? AND user_id = ? AND is_used = 0"
        );
        $couponUseStmt->execute([
            $orderId,
            $coupon['user_coupon_id'],
            (int)$currentUser['id']
        ]);

        if ($couponUseStmt->rowCount() !== 1) {
            throw new Exception('Mã giảm giá đã được sử dụng hoặc không còn hợp lệ.');
        }

        $couponCountStmt = $pdo->prepare("UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = ?");
        $couponCountStmt->execute([$coupon['coupon_id']]);
    }

    $paymentStmt = $pdo->prepare(
        "INSERT INTO payments (order_id, amount, payment_method, payment_status, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', NOW(), NOW())"
    );
    $paymentStmt->execute([$orderId, $finalAmount, $paymentMethod]);

    if ($pointsEarned > 0) {
        $pointsStmt = $pdo->prepare(
            "INSERT INTO user_points (user_id, points, lifetime_points, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                points = points + VALUES(points),
                lifetime_points = lifetime_points + VALUES(lifetime_points),
                updated_at = NOW()"
        );
        $pointsStmt->execute([(int)$currentUser['id'], $pointsEarned, $pointsEarned]);

        $pointTransactionStmt = $pdo->prepare(
            "INSERT INTO point_transactions (user_id, order_id, points, type, description, created_at)
             VALUES (?, ?, ?, 'earn', ?, NOW())"
        );
        $pointTransactionStmt->execute([
            (int)$currentUser['id'],
            $orderId,
            $pointsEarned,
            'Cộng điểm từ đơn hàng #' . $orderId
        ]);
    }

    checkoutMaybeSaveUserInfo(
        $pdo,
        $currentUser['id'],
        $customerName,
        $customerEmail,
        $deliveryType === 'delivery' ? $customerAddress : null,
        $saveInfo
    );

    $pdo->commit();

    Response::success([
        'order_id' => $orderId,
        'subtotal' => $totals['subtotal'],
        'base_shipping_fee' => $totals['base_shipping_fee'],
        'shipping_fee' => $totals['shipping_fee'],
        'discount_amount' => $totals['discount_amount'],
        'final_amount' => $finalAmount,
        'coupon' => $coupon,
        'points_earned' => $pointsEarned,
        'payment_method' => $paymentMethod
    ], 'Đặt hàng thành công', 201);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logError('Checkout create order failed', ['error' => $e->getMessage()]);
    Response::error((DEBUG_MODE || $e instanceof CheckoutClientException) ? $e->getMessage() : 'Không thể tạo đơn hàng', 400);
}

?>
