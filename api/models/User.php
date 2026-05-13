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
            'password' => $password,
            'email' => $email
        ]);
        
        $validator
            ->required('fullname', 'Fullname is required')
            ->required('phone', 'Phone is required')
            ->phone('phone', 'Phone format is invalid')
            ->required('password', 'Password is required')
            ->min('password', PASSWORD_MIN_LENGTH, 'Password min ' . PASSWORD_MIN_LENGTH . ' chars')
            ->email('email', 'Email format is invalid');
        
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

        if (!empty($email) && $this->emailExists($email)) {
            return [
                'success' => false,
                'message' => 'Email already registered',
                'code' => 'EMAIL_EXISTS'
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
            "SELECT id, fullname, phone, email, password, role, status FROM users WHERE phone = ? OR email = ?"
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

        if ((int)$user['status'] !== 1) {
            return [
                'success' => false,
                'message' => 'Account is locked',
                'code' => 'ACCOUNT_LOCKED'
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
     * Tạo admin tạm (dev only)
     */
    public function seedAdmin($fullname, $phone, $password, $email = null) {
        $stmt = $this->pdo->prepare(
            "SELECT id, role FROM users WHERE phone = ? OR email = ? LIMIT 1"
        );
        $stmt->execute([sanitizeString($phone), $email ? sanitizeString($email) : null]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['role'] !== 'admin') {
                return [
                    'success' => false,
                    'message' => 'User already exists and is not admin'
                ];
            }

            $hashedPassword = hashPassword($password);
            $stmt = $this->pdo->prepare(
                "UPDATE users
                 SET fullname = ?, phone = ?, password = ?, email = ?, status = 1, updated_at = NOW()
                 WHERE id = ?"
            );
            $stmt->execute([
                sanitizeString($fullname),
                sanitizeString($phone),
                $hashedPassword,
                $email ? sanitizeString($email) : null,
                $existing['id']
            ]);

            return [
                'success' => true,
                'message' => 'Admin updated',
                'user_id' => $existing['id'],
                'created' => false
            ];
        }

        $hashedPassword = hashPassword($password);

        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO users (fullname, phone, password, email, role, created_at)
                 VALUES (?, ?, ?, ?, 'admin', NOW())"
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
                'message' => 'Admin created',
                'user_id' => $userId,
                'created' => true
            ];
        } catch (PDOException $e) {
            logError('Seed admin failed', [
                'phone' => $phone,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Seed admin failed'
            ];
        }
    }
    
    /**
     * Lấy thông tin user
     */
    public function getById($id) {
        $stmt = $this->pdo->prepare(
            "SELECT id, fullname, phone, email, address, role, status, created_at FROM users WHERE id = ?"
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
     * Check if email exists
     */
    public function emailExists($email) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
        $stmt->execute([sanitizeString($email)]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Lấy danh sách users (Admin)
     */
    public function getAll($limit = 20, $offset = 0, $role = null) {
        $query = "SELECT id, fullname, phone, email, address, role, status, created_at FROM users WHERE 1=1";
        $params = [];

        if ($role) {
            $query .= " AND role = ?";
            $params[] = $role;
        }

        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = (int)$limit;
        $params[] = (int)$offset;

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
     * Đếm tổng users
     */
    public function count($role = null) {
        if ($role) {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM users WHERE role = ?");
            $stmt->execute([$role]);
        } else {
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM users");
        }
        $result = $stmt->fetch();
        return $result['count'];
    }

    public function updateStatus($id, $status) {
        $stmt = $this->pdo->prepare("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND role = 'customer'");
        $result = $stmt->execute([(int)$status, $id]);

        return [
            'success' => $result,
            'message' => $result ? 'User status updated' : 'Update failed'
        ];
    }
}

?>
