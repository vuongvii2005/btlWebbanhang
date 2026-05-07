<?php
/**
 * 🛠️ HELPER FUNCTIONS
 */

/**
 * Sanitize string input
 */
function sanitizeString($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email format
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number (Vietnamese format)
 */
function validatePhone($phone) {
    // Accepts: 0901234567, 09012-34567, +84901234567
    return preg_match('/^(0|\+84)[1-9][0-9]{8,9}$/', $phone) === 1;
}

/**
 * Validate price (must be > 0)
 */
function validatePrice($price) {
    return is_numeric($price) && $price > 0;
}

/**
 * Validate positive integer
 */
function validatePositiveInt($value) {
    return filter_var($value, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1]
    ]) !== false;
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Generate JWT token
 */
function generateJWT($payload) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode($payload));
    
    $signature = hash_hmac(
        'sha256',
        "$header.$payload",
        JWT_SECRET,
        true
    );
    
    return "$header.$payload." . base64_encode($signature);
}

/**
 * Verify JWT token
 */
function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    list($header, $payload, $signature) = $parts;
    
    $expectedSignature = base64_encode(hash_hmac(
        'sha256',
        "$header.$payload",
        JWT_SECRET,
        true
    ));
    
    if ($signature !== $expectedSignature) return false;
    
    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time()) return false;
    
    return $data;
}

/**
 * Get user from JWT token (in Authorization header)
 */
function getAuthUser() {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $parts = explode(' ', $headers['Authorization']);
        if (count($parts) === 2 && $parts[0] === 'Bearer') {
            $token = $parts[1];
        }
    }
    
    if (!$token) return null;
    
    return verifyJWT($token);
}

/**
 * Require user to be authenticated
 */
function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        Response::unauthorized();
    }
    return $user;
}

/**
 * Require user to be admin
 */
function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        Response::forbidden();
    }
    return $user;
}

/**
 * Get request input (POST/PUT/JSON)
 */
function getInput($key = null, $default = null) {
    $input = [];
    
    // GET parameters
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $input = $_GET;
    }
    
    // POST form data
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && 
        isset($_SERVER['CONTENT_TYPE']) && 
        strpos($_SERVER['CONTENT_TYPE'], 'application/x-www-form-urlencoded') !== false) {
        $input = $_POST;
    }
    
    // JSON data
    if (isset($_SERVER['CONTENT_TYPE']) && 
        strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $json = json_decode(file_get_contents('php://input'), true);
        $input = is_array($json) ? $json : [];
    }
    
    if ($key === null) {
        return $input;
    }
    
    return $input[$key] ?? $default;
}

/**
 * Get request method
 */
function getMethod() {
    return strtoupper($_SERVER['REQUEST_METHOD']);
}

/**
 * Log error to file
 */
function logError($message, $context = []) {
    if (!is_dir(LOG_DIR)) {
        mkdir(LOG_DIR, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $log = "[$timestamp] $message\n";
    
    if (!empty($context)) {
        $log .= json_encode($context, JSON_PRETTY_PRINT) . "\n";
    }
    
    file_put_contents(ERROR_LOG_FILE, $log, FILE_APPEND);
}

/**
 * Format currency for VND
 */
function formatCurrency($amount) {
    return number_format($amount, 0, ',', '.') . ' ₫';
}

/**
 * Format date
 */
function formatDate($date, $format = 'd/m/Y H:i') {
    return date($format, strtotime($date));
}

/**
 * Check if user is production
 */
function isProduction() {
    return ENVIRONMENT === 'production';
}

?>
