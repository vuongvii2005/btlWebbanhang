<?php
/**
 * PRODUCT MODEL - Quản lý sản phẩm
 */

class Product {
    
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Lấy danh sách sản phẩm (có phân trang, lọc, tìm kiếm)
     */
    public function getAll($filters = []) {
        $mealPrioritySql = $this->buildMealPrioritySql($this->getMealPeriod());
        $query = "SELECT p.*, c.name AS category_name, COALESCE(s.total_sold, 0) AS total_sold,
                         $mealPrioritySql AS meal_priority
                  FROM products p
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN (
                      SELECT oi.product_id, SUM(oi.quantity) AS total_sold
                      FROM order_items oi
                      INNER JOIN orders o ON oi.order_id = o.id
                      WHERE o.status <> 'cancelled'
                      GROUP BY oi.product_id
                  ) s ON p.id = s.product_id
                  WHERE p.status = 1";
        $params = [];
        
        // Filter by category
        if (!empty($filters['category'])) {
            $query .= " AND p.category_id = (SELECT id FROM categories WHERE name = ?)";
            $params[] = $filters['category'];
        }
        
        // Search
        if (!empty($filters['search'])) {
            $query .= " AND (p.title LIKE ? OR p.description LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }
        
        // Sorting
        $orderBy = 'meal_priority DESC, total_sold DESC, p.created_at DESC';
        if (!empty($filters['sort'])) {
            $validSorts = [
                'recommended' => 'meal_priority DESC, total_sold DESC, p.created_at DESC',
                'best_selling' => 'total_sold DESC, meal_priority DESC, p.created_at DESC',
                'price_asc' => 'p.price ASC',
                'price_desc' => 'p.price DESC',
                'newest' => 'p.created_at DESC'
            ];
            $orderBy = $validSorts[$filters['sort']] ?? $orderBy;
        }
        $query .= " ORDER BY $orderBy";
        
        // Pagination
        $limit = (int)($filters['limit'] ?? DEFAULT_PER_PAGE);
        $offset = (int)($filters['offset'] ?? 0);
        
        $limit = min($limit, MAX_PER_PAGE);
        
        $query .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->pdo->prepare($query);
        
        // Bind parameters with correct types
        $i = 1;
        foreach ($params as $param) {
            if (is_int($param)) {
                $stmt->bindValue($i, $param, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($i, $param, PDO::PARAM_STR);
            }
            $i++;
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    }

    private function getMealPeriod() { // sắp xếp theo bữa ăn (sáng, trưa, tối)
        $hour = (int)(new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('G');

        if ($hour >= 5 && $hour < 11) {
            return 'morning';
        }

        if ($hour >= 11 && $hour < 16) {
            return 'lunch';
        }

        return 'dinner';
    }

    private function buildMealPrioritySql($mealPeriod) {
        $text = "CONCAT_WS(' ', p.title, c.name, p.description)";

        $rules = [
            'morning' => [
                ['phở', 'pho', 'bún', 'bun', 'hủ tiếu', 'hu tieu', 'xôi', 'xiu mai', 'xíu mại', 'há cảo', 'ha cao'],
                ['trà', 'tra', 'cà phê', 'ca phe', 'nước ép', 'nuoc ep'],
                ['cơm', 'com', 'bánh', 'banh']
            ],
            'lunch' => [
                ['cơm', 'com', 'bún', 'bun', 'phở', 'pho', 'hủ tiếu', 'hu tieu', 'món chay', 'mon chay', 'canh', 'rau'],
                ['cuốn', 'cuon', 'nộm', 'nom', 'gà', 'ga', 'bò', 'bo', 'heo'],
                ['nước ép', 'nuoc ep', 'trà', 'tra']
            ],
            'dinner' => [
                ['lẩu', 'lau', 'nướng', 'nuong', 'súp', 'sup', 'sushi', 'bít tết', 'bit tet'],
                ['món mặn', 'mon man', 'hải sản', 'hai san', 'hà cảo', 'ha cao', 'cuộn', 'cuon'],
                ['chè', 'che', 'bánh', 'banh', 'tráng miệng', 'trang mieng']
            ]
        ];

        $groups = $rules[$mealPeriod] ?? $rules['lunch'];
        $cases = [];

        foreach ($groups as $index => $keywords) {
            $conditions = array_map(function ($keyword) use ($text) {
                return "$text LIKE " . $this->pdo->quote('%' . $keyword . '%');
            }, $keywords);
            $cases[] = 'WHEN ' . implode(' OR ', $conditions) . ' THEN ' . (3 - $index);
        }

        return 'CASE ' . implode(' ', $cases) . ' ELSE 0 END';
    }

    /**
     * Lay danh sach san pham cho admin, bao gom ca mon ngung ban.
     */
    public function getAllAdmin($filters = []) {
        $query = "SELECT p.*, c.name AS category_name
                  FROM products p
                  LEFT JOIN categories c ON p.category_id = c.id
                  WHERE 1=1";
        $params = [];

        if (!empty($filters['search'])) {
            $query .= " AND (p.title LIKE ? OR p.description LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }

        if (array_key_exists('status', $filters) && $filters['status'] !== null && $filters['status'] !== '') {
            $query .= " AND p.status = ?";
            $params[] = (int)$filters['status'];
        }

        if (!empty($filters['category_id'])) {
            $query .= " AND p.category_id = ?";
            $params[] = (int)$filters['category_id'];
        }

        $query .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
        $params[] = min((int)($filters['limit'] ?? DEFAULT_PER_PAGE), MAX_PER_PAGE);
        $params[] = (int)($filters['offset'] ?? 0);

        $stmt = $this->pdo->prepare($query);
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
            $i++;
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function countAdmin($filters = []) {
        $query = "SELECT COUNT(*) AS count FROM products p WHERE 1=1";
        $params = [];

        if (!empty($filters['search'])) {
            $query .= " AND (p.title LIKE ? OR p.description LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }

        if (array_key_exists('status', $filters) && $filters['status'] !== null && $filters['status'] !== '') {
            $query .= " AND p.status = ?";
            $params[] = (int)$filters['status'];
        }

        if (!empty($filters['category_id'])) {
            $query .= " AND p.category_id = ?";
            $params[] = (int)$filters['category_id'];
        }

        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Lấy chi tiết sản phẩm
     */
    public function getById($id) {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM products WHERE id = ? AND status = 1"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Tạo sản phẩm (Admin)
     */
    public function create($data) {
        // Validate
        $validator = new Validator($data);
        $validator
            ->required('title', 'Title is required')
            ->required('price', 'Price is required')
            ->numeric('price', 'Price must be numeric')
            ->required('category_id', 'Category is required')
            ->integer('category_id', 'Category must be integer');
        
        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->firstError()
            ];
        }
        
        if (!validatePrice($data['price'])) {
            return ['success' => false, 'message' => 'Price must be greater than 0'];
        }
        
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO products (category_id, title, description, price, image_url, stock, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
            );
            
            $stmt->execute([
                $data['category_id'],
                sanitizeString($data['title']),
                sanitizeString($data['description'] ?? ''),
                $data['price'],
                $data['image_url'] ?? null,
                $data['stock'] ?? 999,
                isset($data['status']) ? (int)$data['status'] : 1
            ]);
            
            $productId = $this->pdo->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Product created successfully',
                'product_id' => $productId
            ];
            
        } catch (PDOException $e) {
            logError('Product creation failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Failed to create product'];
        }
    }
    
    /**
     * Cập nhật sản phẩm (Admin)
     */
    public function update($id, $data) {
        $allowed = ['title', 'description', 'price', 'category_id', 'image_url', 'stock', 'status'];
        $updates = [];
        $values = [];
        
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                if ($field === 'price' && !validatePrice($data[$field])) {
                    return ['success' => false, 'message' => 'Price must be greater than 0'];
                }
                
                $updates[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            return ['success' => true, 'message' => 'No changes'];
        }
        
        $values[] = $id;
        $query = "UPDATE products SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $this->pdo->prepare($query);
        $result = $stmt->execute($values);
        
        return [
            'success' => $result,
            'message' => $result ? 'Product updated successfully' : 'Update failed'
        ];
    }
    
    /**
     * Xóa sản phẩm (soft delete - set status = 0)
     */
    public function delete($id) {
        $stmt = $this->pdo->prepare("UPDATE products SET status = 0, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        return [
            'success' => $result,
            'message' => $result ? 'Product deleted successfully' : 'Delete failed'
        ];
    }
    
    /**
     * Tìm kiếm sản phẩm
     */
    public function search($keyword, $limit = 20) {
        $keyword = '%' . $keyword . '%';
        $stmt = $this->pdo->prepare(
            "SELECT * FROM products 
             WHERE status = 1 AND (title LIKE ? OR description LIKE ?)
             LIMIT ?"
        );
        
        $stmt->bindValue(1, $keyword, PDO::PARAM_STR);
        $stmt->bindValue(2, $keyword, PDO::PARAM_STR);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Đếm tổng sản phẩm (có filter)
     */
    public function count($filters = []) {
        $query = "SELECT COUNT(*) as count FROM products WHERE status = 1";
        $params = [];
        
        if (!empty($filters['category'])) {
            $query .= " AND category_id = (SELECT id FROM categories WHERE name = ?)";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['search'])) {
            $query .= " AND (title LIKE ? OR description LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Lấy danh sách categories
     */
    public function getCategories() {
        $stmt = $this->pdo->query("SELECT id, name, description FROM categories ORDER BY name");
        return $stmt->fetchAll();
    }
    
    /**
     * Lấy top sản phẩm bán chạy (Admin)
     */
    public function getBestSellers($limit = 10) {
        $stmt = $this->pdo->prepare(
            "SELECT p.*, COALESCE(SUM(CASE WHEN o.id IS NULL THEN 0 ELSE oi.quantity END), 0) as total_sold
             FROM products p
             LEFT JOIN order_items oi ON p.id = oi.product_id
             LEFT JOIN orders o ON oi.order_id = o.id AND o.status <> 'cancelled'
             WHERE p.status = 1
             GROUP BY p.id
             ORDER BY total_sold DESC
             LIMIT ?"
        );
        
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}

?>
