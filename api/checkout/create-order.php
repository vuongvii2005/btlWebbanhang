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
    $rawBody = file_get_contents("php://input");
    $input = json_decode($rawBody, true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $customerName = trim($input['customer_name'] ?? '');
    $customerPhone = trim($input['customer_phone'] ?? $input['phone'] ?? $input['customerPhone'] ?? '');
    $customerAddress = trim($input['customer_address'] ?? $input['address'] ?? $input['customerAddress'] ?? '');
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
    if ($customerAddress === '') {
        Response::badRequest(['customer_address' => 'Address is required']);
    }
    if (!is_array($items) || count($items) === 0) {
        Response::badRequest(['items' => 'Cart is empty']);
    }

    $cartItems = [];
    foreach ($items as $item) {
        $productId = $item['product_id'] ?? $item['id'] ?? null;
        $quantity = (int)($item['quantity'] ?? 0);

        if (!validatePositiveInt($productId) || $quantity < 1) {
            Response::badRequest(['items' => 'Invalid cart item']);
        }

        if (!isset($cartItems[$productId])) {
            $cartItems[$productId] = [
                'product_id' => (int)$productId,
                'quantity' => 0,
                'note' => sanitizeString($item['note'] ?? '')
            ];
        }
        $cartItems[$productId]['quantity'] += $quantity;
    }

    $pdo->beginTransaction();

    $productStmt = $pdo->prepare("SELECT id, title, price FROM products WHERE id = ? AND status = 1");
    $orderItems = [];
    $subtotal = 0;

    foreach ($cartItems as $cartItem) {
        $productStmt->execute([$cartItem['product_id']]);
        $product = $productStmt->fetch();

        if (!$product) {
            throw new Exception('Product not found or unavailable: ' . $cartItem['product_id']);
        }

        $price = (float)$product['price'];
        $lineTotal = $price * $cartItem['quantity'];
        $subtotal += $lineTotal;
        $orderItems[] = [
            'product_id' => (int)$product['id'],
            'title' => $product['title'],
            'quantity' => $cartItem['quantity'],
            'price' => $price,
            'note' => $cartItem['note']
        ];
    }

    $deliveryType = ($input['delivery_type'] ?? 'delivery') === 'pickup' ? 'pickup' : 'delivery';
    $shippingFee = $deliveryType === 'delivery' ? 30000 : 0;
    $totalAmount = $subtotal + $shippingFee;
    $deliveryDate = $input['delivery_date'] ?? date('Y-m-d');
    $deliveryTime = $input['delivery_time'] ?? null;
    $notes = sanitizeString($input['notes'] ?? '');

    $orderStmt = $pdo->prepare(
        "INSERT INTO orders
         (user_id, total_amount, shipping_fee, delivery_type, delivery_date, delivery_time,
          customer_name, customer_phone, customer_address, notes, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())"
    );

    $orderStmt->execute([
        $currentUser['id'],
        $totalAmount,
        $shippingFee,
        $deliveryType,
        $deliveryDate,
        $deliveryTime,
        sanitizeString($customerName),
        sanitizeString($customerPhone),
        sanitizeString($customerAddress),
        $notes
    ]);

    $orderId = $pdo->lastInsertId();
    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, quantity, price, note)
         VALUES (?, ?, ?, ?, ?)"
    );

    foreach ($orderItems as $item) {
        $itemStmt->execute([
            $orderId,
            $item['product_id'],
            $item['quantity'],
            $item['price'],
            $item['note']
        ]);
    }

    $paymentStmt = $pdo->prepare(
        "INSERT INTO payments (order_id, amount, payment_method, payment_status, created_at)
         VALUES (?, ?, 'COD', 'pending', NOW())"
    );
    $paymentStmt->execute([$orderId, $totalAmount]);

    $pdo->commit();

    Response::success([
        'order_id' => $orderId,
        'subtotal' => $subtotal,
        'shipping_fee' => $shippingFee,
        'total_amount' => $totalAmount,
        'payment_method' => 'COD'
    ], 'Order created successfully', 201);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logError('Checkout create order failed', ['error' => $e->getMessage()]);
    Response::error(DEBUG_MODE ? $e->getMessage() : 'Failed to create order', 400);
}
?>
