<?php
/**
 * 📦 ORDER MODEL - Quản lý đơn hàng
 */

class Order {
    
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Tạo đơn hàng mới
     */
    public function create($userId, $data) {
        // Validate
        $validator = new Validator($data);
        $validator
            ->required('customer_name', 'Customer name is required')
            ->required('customer_phone', 'Customer phone is required')
            ->phone('customer_phone', 'Phone format is invalid')
            ->required('customer_address', 'Address is required')
            ->required('items', 'Order items required')
            ->isArray('items', 'Items must be array')
            ->required('total_amount', 'Total amount required')
            ->numeric('total_amount', 'Total amount must be numeric');
        
        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->firstError()
            ];
        }
        
        if (empty($data['items'])) {
            return ['success' => false, 'message' => 'Order must have at least 1 item'];
        }
        
        try {
            // Start transaction
            $this->pdo->beginTransaction();
            
            // Create order
            $stmt = $this->pdo->prepare(
                "INSERT INTO orders 
                (user_id, total_amount, shipping_fee, delivery_type, delivery_date, delivery_time,
                 customer_name, customer_phone, customer_address, notes, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())"
            );
            
            $stmt->execute([
                $userId,
                $data['total_amount'],
                $data['shipping_fee'] ?? 30000,
                $data['delivery_type'] ?? 'delivery',
                $data['delivery_date'] ?? date('Y-m-d'),
                $data['delivery_time'] ?? null,
                sanitizeString($data['customer_name']),
                sanitizeString($data['customer_phone']),
                sanitizeString($data['customer_address']),
                sanitizeString($data['notes'] ?? '')
            ]);
            
            $orderId = $this->pdo->lastInsertId();
            
            // Add order items
            $itemStmt = $this->pdo->prepare(
                "INSERT INTO order_items (order_id, product_id, quantity, price, note)
                 VALUES (?, ?, ?, ?, ?)"
            );
            
            foreach ($data['items'] as $item) {
                if (!isset($item['id']) || !isset($item['quantity']) || !isset($item['price'])) {
                    throw new Exception('Invalid item structure');
                }
                
                $itemStmt->execute([
                    $orderId,
                    $item['id'],
                    $item['quantity'],
                    $item['price'],
                    $item['note'] ?? null
                ]);
            }
            
            // Commit transaction
            $this->pdo->commit();
            
            return [
                'success' => true,
                'message' => 'Order created successfully',
                'order_id' => $orderId
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            logError('Order creation failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Failed to create order'];
        }
    }
    
    /**
     * Lấy chi tiết đơn hàng
     */
    public function getById($id, $userId = null) {
        $query = "SELECT * FROM orders WHERE id = ?";
        $params = [$id];
        
        if ($userId !== null) {
            $query .= " AND user_id = ?";
            $params[] = $userId;
        }
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $order = $stmt->fetch();
        
        if (!$order) return null;
        
        // Get order items
        $itemStmt = $this->pdo->prepare(
            "SELECT oi.*, p.title, p.image_url 
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?"
        );
        $itemStmt->execute([$id]);
        $order['items'] = $itemStmt->fetchAll();
        
        return $order;
    }
    
    /**
     * Lấy danh sách đơn hàng của user
     */
    public function getUserOrders($userId, $limit = 20, $offset = 0) {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM orders 
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?"
        );
        
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Lấy danh sách tất cả đơn hàng (Admin)
     */
    public function getAll($filters = [], $limit = 20, $offset = 0) {
        $query = "SELECT * FROM orders WHERE 1=1";
        $params = [];
        
        if (!empty($filters['status'])) {
            $query .= " AND status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['date_from'])) {
            $query .= " AND DATE(created_at) >= ?";
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $query .= " AND DATE(created_at) <= ?";
            $params[] = $filters['date_to'];
        }
        
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->pdo->prepare($query);
        
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
            $i++;
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Cập nhật status đơn hàng (Admin)
     */
    public function updateStatus($id, $status) {
        $validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
        
        if (!in_array($status, $validStatuses)) {
            return ['success' => false, 'message' => 'Invalid status'];
        }
        
        $stmt = $this->pdo->prepare("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$status, $id]);
        
        return [
            'success' => $result,
            'message' => $result ? 'Status updated successfully' : 'Update failed'
        ];
    }
    
    /**
     * Đếm tổng đơn hàng (có filter)
     */
    public function count($filters = []) {
        $query = "SELECT COUNT(*) as count FROM orders WHERE 1=1";
        $params = [];
        
        if (!empty($filters['status'])) {
            $query .= " AND status = ?";
            $params[] = $filters['status'];
        }
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Lấy thống kê doanh thu (Admin)
     */
    public function getRevenueStats($dateFrom = null, $dateTo = null) {
        $query = "SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_order_value,
                    DATE(created_at) as order_date
                  FROM orders
                  WHERE 1=1";
        
        $params = [];
        
        if ($dateFrom) {
            $query .= " AND DATE(created_at) >= ?";
            $params[] = $dateFrom;
        }
        
        if ($dateTo) {
            $query .= " AND DATE(created_at) <= ?";
            $params[] = $dateTo;
        }
        
        $query .= " GROUP BY DATE(created_at) ORDER BY order_date DESC";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}

?>
