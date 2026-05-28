<?php

function checkoutRequireAuthenticatedUser() {
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

function checkoutReadInput() {
    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody, true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    return is_array($input) ? $input : [];
}

function checkoutParseBool($value) {
    if (is_bool($value)) {
        return $value;
    }

    return in_array(strtolower((string)$value), ['1', 'true', 'yes', 'on'], true);
}

function checkoutNormalizeCartItems($items) {
    if (!is_array($items)) {
        Response::badRequest(['items' => 'Cart is empty']);
    }

    $cartItems = [];

    foreach ($items as $item) {
        $productId = $item['product_id'] ?? $item['id'] ?? null;
        $quantity = (int)($item['quantity'] ?? 0);

        if (!validatePositiveInt($productId) || $quantity < 1) {
            Response::badRequest(['items' => 'Invalid cart item']);
        }

        $productId = (int)$productId;

        if (!isset($cartItems[$productId])) {
            $cartItems[$productId] = [
                'product_id' => $productId,
                'quantity' => 0,
                'note' => sanitizeString($item['note'] ?? '')
            ];
        }

        $cartItems[$productId]['quantity'] += $quantity;
    }

    if (empty($cartItems)) {
        Response::badRequest(['items' => 'Cart is empty']);
    }

    return array_values($cartItems);
}

function checkoutBuildOrderItems(PDO $pdo, array $cartItems) {
    $productStmt = $pdo->prepare(
        "SELECT id, title, price, image_url FROM products WHERE id = ? AND status = 1"
    );

    $orderItems = [];
    $subtotal = 0;

    foreach ($cartItems as $cartItem) {
        $productStmt->execute([$cartItem['product_id']]);
        $product = $productStmt->fetch();

        if (!$product) {
            throw new Exception('Product not found or unavailable: ' . $cartItem['product_id']);
        }

        $price = (float)$product['price'];
        $quantity = (int)$cartItem['quantity'];
        $lineTotal = $price * $quantity;
        $subtotal += $lineTotal;

        $orderItems[] = [
            'product_id' => (int)$product['id'],
            'title' => $product['title'],
            'image_url' => $product['image_url'],
            'quantity' => $quantity,
            'price' => $price,
            'line_total' => $lineTotal,
            'note' => $cartItem['note']
        ];
    }

    return [
        'items' => $orderItems,
        'subtotal' => $subtotal
    ];
}

function checkoutDeliveryType($input) {
    return ($input['delivery_type'] ?? 'delivery') === 'pickup' ? 'pickup' : 'delivery';
}

function checkoutBaseShippingFee($deliveryType) {
    return $deliveryType === 'delivery' ? 25000 : 0;
}

function checkoutFormatCurrency($amount) {
    return number_format((float)$amount, 0, ',', '.') . 'đ';
}

function checkoutFindCoupon(PDO $pdo, $userId, $couponCode, $forUpdate = false) {
    $couponCode = trim((string)$couponCode);
    if ($couponCode === '') {
        return null;
    }

    $sql = "SELECT
                uc.id AS user_coupon_id,
                uc.user_id,
                uc.coupon_id,
                uc.coupon_code,
                uc.is_used,
                uc.used_order_id,
                uc.expired_at,
                c.code AS base_coupon_code,
                c.title,
                c.description,
                c.discount_type,
                c.discount_value,
                c.min_order_amount,
                c.max_discount_amount,
                c.usage_limit,
                c.used_count,
                c.start_date,
                c.end_date,
                c.status
            FROM user_coupons uc
            INNER JOIN coupons c ON c.id = uc.coupon_id
            WHERE uc.user_id = ?
              AND UPPER(uc.coupon_code) = UPPER(?)
            LIMIT 1";

    if ($forUpdate) {
        $sql .= " FOR UPDATE";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([(int)$userId, $couponCode]);
    $coupon = $stmt->fetch();

    return $coupon ?: null;
}

function checkoutCalculateCouponDiscount($coupon, $subtotal, $baseShippingFee) {
    if (!$coupon) {
        return [
            'coupon' => null,
            'discount_amount' => 0,
            'order_discount' => 0,
            'shipping_discount' => 0,
            'shipping_fee' => $baseShippingFee,
            'message' => ''
        ];
    }

    $now = time();
    $discountType = $coupon['discount_type'];
    $discountValue = (float)$coupon['discount_value'];
    $maxDiscount = $coupon['max_discount_amount'] !== null ? (float)$coupon['max_discount_amount'] : null;
    $minOrderAmount = (float)$coupon['min_order_amount'];

    if ((int)$coupon['is_used'] === 1) {
        throw new Exception('Mã giảm giá đã được sử dụng.');
    }

    if (!empty($coupon['expired_at']) && strtotime($coupon['expired_at']) < $now) {
        throw new Exception('Mã giảm giá đã hết hạn.');
    }

    if ((int)$coupon['status'] !== 1) {
        throw new Exception('Mã giảm giá hiện không khả dụng.');
    }

    if (!empty($coupon['start_date']) && strtotime($coupon['start_date']) > $now) {
        throw new Exception('Mã giảm giá chưa đến thời gian sử dụng.');
    }

    if (!empty($coupon['end_date']) && strtotime($coupon['end_date']) < $now) {
        throw new Exception('Mã giảm giá đã hết hạn.');
    }

    if ($coupon['usage_limit'] !== null && (int)$coupon['used_count'] >= (int)$coupon['usage_limit']) {
        throw new Exception('Mã giảm giá đã hết lượt sử dụng.');
    }

    if ($subtotal < $minOrderAmount) {
        throw new Exception('Đơn hàng cần tối thiểu ' . checkoutFormatCurrency($minOrderAmount) . ' để dùng mã này.');
    }

    $orderDiscount = 0;
    $shippingDiscount = 0;

    if ($discountType === 'fixed') {
        $orderDiscount = min($discountValue, $subtotal);
    } elseif ($discountType === 'percent') {
        $orderDiscount = $subtotal * $discountValue / 100;

        if ($maxDiscount !== null && $maxDiscount > 0) {
            $orderDiscount = min($orderDiscount, $maxDiscount);
        }

        $orderDiscount = min($orderDiscount, $subtotal);
    } elseif ($discountType === 'freeship') {
        if ($baseShippingFee <= 0) {
            throw new Exception('Mã freeship chỉ áp dụng cho đơn giao tận nơi.');
        }

        $shippingDiscount = $baseShippingFee;
        if ($maxDiscount !== null && $maxDiscount > 0) {
            $shippingDiscount = min($shippingDiscount, $maxDiscount);
        }
    } else {
        throw new Exception('Loại mã giảm giá không hợp lệ.');
    }

    $discountAmount = $orderDiscount + $shippingDiscount;
    $shippingFee = max(0, $baseShippingFee - $shippingDiscount);

    return [
        'coupon' => [
            'user_coupon_id' => (int)$coupon['user_coupon_id'],
            'coupon_id' => (int)$coupon['coupon_id'],
            'coupon_code' => $coupon['coupon_code'],
            'title' => $coupon['title'],
            'discount_type' => $discountType
        ],
        'discount_amount' => $discountAmount,
        'order_discount' => $orderDiscount,
        'shipping_discount' => $shippingDiscount,
        'shipping_fee' => $shippingFee,
        'message' => 'Áp dụng mã giảm giá thành công.'
    ];
}

function checkoutCalculateTotals(PDO $pdo, $userId, array $items, $deliveryType, $couponCode = '', $lockCoupon = false) {
    $cartItems = checkoutNormalizeCartItems($items);
    $products = checkoutBuildOrderItems($pdo, $cartItems);
    $subtotal = (float)$products['subtotal'];
    $baseShippingFee = checkoutBaseShippingFee($deliveryType);
    $couponCode = trim((string)$couponCode);
    $coupon = $couponCode !== '' ? checkoutFindCoupon($pdo, $userId, $couponCode, $lockCoupon) : null;

    if ($couponCode !== '' && !$coupon) {
        throw new Exception('Mã giảm giá không hợp lệ hoặc không thuộc tài khoản của bạn.');
    }

    $discount = checkoutCalculateCouponDiscount($coupon, $subtotal, $baseShippingFee);
    $finalAmount = max(0, $subtotal + $baseShippingFee - (float)$discount['discount_amount']);

    return [
        'items' => $products['items'],
        'subtotal' => $subtotal,
        'base_shipping_fee' => $baseShippingFee,
        'shipping_fee' => (float)$discount['shipping_fee'],
        'discount_amount' => (float)$discount['discount_amount'],
        'order_discount' => (float)$discount['order_discount'],
        'shipping_discount' => (float)$discount['shipping_discount'],
        'final_amount' => $finalAmount,
        'coupon' => $discount['coupon'],
        'message' => $discount['message']
    ];
}

function checkoutBuildCustomerAddress($input) {
    $address = trim($input['customer_address'] ?? $input['address'] ?? $input['customerAddress'] ?? '');
    $ward = trim($input['ward'] ?? '');
    $province = trim($input['province'] ?? '');
    $parts = array_values(array_filter([$address, $ward, $province], function ($part) {
        return $part !== '';
    }));

    return implode(', ', array_unique($parts));
}

function checkoutMaybeSaveUserInfo(PDO $pdo, $userId, $customerName, $email, $address, $saveInfo) {
    if (!$saveInfo) {
        return;
    }

    $updates = ['fullname = ?', 'address = ?'];
    $values = [
        sanitizeString($customerName),
        sanitizeString($address)
    ];

    if (trim((string)$email) !== '') {
        $updates[] = 'email = ?';
        $values[] = sanitizeString($email);
    }

    $values[] = (int)$userId;

    $stmt = $pdo->prepare(
        "UPDATE users
         SET " . implode(', ', $updates) . ", updated_at = NOW()
         WHERE id = ?"
    );
    $stmt->execute($values);
}

?>
