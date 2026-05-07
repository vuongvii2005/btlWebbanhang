<?php
/**
 * 👤 USER MODEL - Quản lý người dùng
 */

class User {
    
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Tạo user mới (Đăng ký)
     */
    public function register($fullname, $phone, $password, $email = null) {
        // Validate
        $validator = new Validator([
            'fullname' => $fullname,
            'phone' => $phone,
            'password' => $password
        ]);
        
        $validator
            ->required('fullname', 'Fullname is required')
            ->required('phone', 'Phone is required')
            ->phone('phone', 'Phone format is invalid')
            ->required('password', 'Password is required')
            ->min('password', PASSWORD_MIN_LENGTH, 'Password min ' . PASSWORD_MIN_LENGTH . ' chars');
        
        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->firstError()
            ];
        }
        
        // Check if phone exists
        if ($this->phoneExists($phone)) {
            return [
                'success' => false,
                'message' => 'Phone number already registered',
                'code' => 'PHONE_EXISTS'
            ];
        }
        
        // Hash password
        $hashedPassword = hashPassword($password);
        
        // Insert
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO users (fullname, phone, password, email, role, created_at)
                 VALUES (?, ?, ?, ?, 'customer', NOW())"
            );
            
            $stmt->execute([
                sanitizeString($fullname),
                sanitizeString($phone),
                $hashedPassword,
                $email ? sanitizeString($email) : null
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Register successful',
                'user_id' => $userId
            ];
            
        } catch (PDOException $e) {
            logError('User registration failed', [
                'phone' => $phone,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Registration failed',
                'code' => 'REGISTER_ERROR'
            ];
        }
    }
    
    /**
     * Đăng nhập
     */
    public function login($identifier, $password) {
        // Validate
        $validator = new Validator([
            'identifier' => $identifier,
            'password' => $password
        ]);
        
        $validator
            ->required('identifier', 'Phone or email is required')
            ->required('password', 'Password is required');
        
        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->firstError()
            ];
        }
        
        $identifier = sanitizeString($identifier);
        
        // Find user by phone or email
        $stmt = $this->pdo->prepare(
            "SELECT id, fullname, phone, email, password, role FROM users WHERE phone = ? OR email = ?"
        );
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'Phone/email or password is incorrect',
                'code' => 'INVALID_CREDENTIALS'
            ];
        }
        
        // Verify password
        if (!verifyPassword($password, $user['password'])) {
            return [
                'success' => false,
                'message' => 'Phone/email or password is incorrect',
                'code' => 'INVALID_CREDENTIALS'
            ];
        }
        
        // Generate JWT token
        $token = generateJWT([
            'id' => $user['id'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + SESSION_TIMEOUT
        ]);
        
        return [
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'fullname' => $user['fullname'],
                'phone' => $user['phone'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ];
    }
    
    /**
     * Lấy thông tin user
     */
    public function getById($id) {
        $stmt = $this->pdo->prepare(
            "SELECT id, fullname, phone, email, address, role, created_at FROM users WHERE id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Cập nhật thông tin user
     */
    public function update($id, $data) {
        $allowed = ['fullname', 'email', 'address'];
        $updates = [];
        $values = [];
        
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $values[] = sanitizeString($data[$field]);
            }
        }
        
        if (empty($updates)) {
            return ['success' => true, 'message' => 'No changes'];
        }
        
        $values[] = $id;
        $query = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $this->pdo->prepare($query);
        $result = $stmt->execute($values);
        
        return [
            'success' => $result,
            'message' => $result ? 'Update successful' : 'Update failed'
        ];
    }
    
    /**
     * Đổi mật khẩu
     */
    public function changePassword($id, $oldPassword, $newPassword) {
        // Validate
        $validator = new Validator([
            'old_password' => $oldPassword,
            'new_password' => $newPassword
        ]);
        
        $validator
            ->required('old_password', 'Current password is required')
            ->required('new_password', 'New password is required')
            ->min('new_password', PASSWORD_MIN_LENGTH, 'New password min ' . PASSWORD_MIN_LENGTH . ' chars');
        
        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->firstError()
            ];
        }
        
        // Get user
        $user = $this->getById($id);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }
        
        // Verify old password
        $stmt = $this->pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $record = $stmt->fetch();
        
        if (!verifyPassword($oldPassword, $record['password'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }
        
        // Update password
        $hashedPassword = hashPassword($newPassword);
        $stmt = $this->pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$hashedPassword, $id]);
        
        return [
            'success' => $result,
            'message' => $result ? 'Password changed successfully' : 'Failed to change password'
        ];
    }
    
    /**
     * Check if phone exists
     */
    public function phoneExists($phone) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM users WHERE phone = ?");
        $stmt->execute([sanitizeString($phone)]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Lấy danh sách users (Admin)
     */
    public function getAll($limit = 20, $offset = 0) {
        $stmt = $this->pdo->prepare(
            "SELECT id, fullname, phone, email, role, created_at 
             FROM users 
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?"
        );
        
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Đếm tổng users
     */
    public function count() {
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        return $result['count'];
    }
}

?>
