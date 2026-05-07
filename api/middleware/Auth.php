<?php
/**
 * 🔐 AUTH MIDDLEWARE - Xác thực người dùng
 */

class Auth {
    
    private $pdo;
    private $user = null;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Check if user is authenticated
     */
    public function check() {
        return $this->user() !== null;
    }
    
    /**
     * Get authenticated user
     */
    public function user() {
        if ($this->user !== null) {
            return $this->user;
        }
        
        // Try JWT from Authorization header
        $user = getAuthUser();
        if ($user) {
            $this->user = $user;
            return $user;
        }
        
        // Try session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (isset($_SESSION['user'])) {
            $this->user = $_SESSION['user'];
            return $_SESSION['user'];
        }
        
        return null;
    }
    
    /**
     * Require authentication (throw error if not)
     */
    public function require() {
        if (!$this->check()) {
            Response::unauthorized();
        }
        return $this->user();
    }
    
    /**
     * Require admin role
     */
    public function requireAdmin() {
        $user = $this->require();
        if ($user['role'] !== 'admin') {
            Response::forbidden();
        }
        return $user;
    }
    
    /**
     * Check if user is admin
     */
    public function isAdmin() {
        $user = $this->user();
        return $user && $user['role'] === 'admin';
    }
    
    /**
     * Get user ID
     */
    public function id() {
        $user = $this->user();
        return $user ? $user['id'] : null;
    }
    
    /**
     * Get user role
     */
    public function role() {
        $user = $this->user();
        return $user ? $user['role'] : null;
    }
    
    /**
     * Create session
     */
    public function login($userId) {
        // Get user data
        $stmt = $this->pdo->prepare(
            "SELECT id, fullname, phone, email, role FROM users WHERE id = ?"
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return false;
        }
        
        // Set session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['user'] = [
            'id' => $user['id'],
            'fullname' => $user['fullname'],
            'phone' => $user['phone'],
            'email' => $user['email'],
            'role' => $user['role'],
            'logged_in_at' => time()
        ];
        
        $this->user = $_SESSION['user'];
        return true;
    }
    
    /**
     * Destroy session
     */
    public function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        session_destroy();
        $this->user = null;
        return true;
    }
}

?>
