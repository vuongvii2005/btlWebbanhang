<?php
/**
 * ⚙️ CẤU HÌNH CHUNG CHO API
 */

// ===== Môi trường =====
$appEnv = strtolower(trim(getenv('APP_ENV') ?: 'development'));
if (!in_array($appEnv, ['development', 'production'], true)) {
    $appEnv = 'development';
}

define('APP_ENV', $appEnv); // development / production
define('ENVIRONMENT', APP_ENV); // Backward compatible alias
define('DEBUG_MODE', APP_ENV === 'development');

// Keep API JSON responses stable by default. In production, PHP errors are
// never displayed to the client. Locally, set APP_DISPLAY_ERRORS=1 if needed.
$displayErrors = (APP_ENV !== 'production' && getenv('APP_DISPLAY_ERRORS') === '1') ? '1' : '0';
ini_set('display_errors', $displayErrors);
ini_set('display_startup_errors', $displayErrors);
ini_set('log_errors', '1');
error_reporting(E_ALL);

// ===== API SETTINGS =====
define('API_URL', 'http://localhost:8000/api');
define('APP_NAME', 'Vy Food API');
define('APP_VERSION', '1.0.0');

// ===== Bảo mật =====
define('JWT_SECRET', getenv('JWT_SECRET') ?: '7520793baef4a2eefbf874bf74eb4f723d3213d8b9e786ecadd254f4171968cb534a02228050a778b0255f54d615dc2a');
define('JWT_ALGORITHM', 'HS256');
define('SESSION_TIMEOUT', 86400 * 7); // 7 days
define('PASSWORD_MIN_LENGTH', 6);

// ===== DATABASE SETTINGS =====
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'vy_food');
define('DB_PORT', 3306);
define('DB_CHARSET', 'utf8mb4');

// ===== ORIGINS CHO PHÉP (CORS) =====
$corsOrigins = getenv('CORS_ALLOWED_ORIGINS');
$allowedOrigins = $corsOrigins
    ? array_values(array_filter(array_map('trim', explode(',', $corsOrigins))))
    : [
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ];
define('ALLOWED_ORIGINS', $allowedOrigins);

if (!function_exists('applyCorsHeaders')) {
    function applyCorsHeaders(): void
    {
        if (PHP_SAPI === 'cli' || headers_sent()) {
            return;
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
}

applyCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===== ERROR LOGGING =====
define('LOG_DIR', __DIR__ . '/../../logs');
define('ERROR_LOG_FILE', LOG_DIR . '/error.log');

// ===== PAGINATION =====
define('DEFAULT_PER_PAGE', 12);
define('MAX_PER_PAGE', 100);

// ===== FILE UPLOADS =====
define('UPLOAD_DIR', __DIR__ . '/../../uploads');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// ===== EMAIL SETTINGS (for notifications) =====
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
define('MAIL_USERNAME', 'your-email@gmail.com');
define('MAIL_PASSWORD', 'your-app-password');
define('MAIL_FROM', 'noreply@vyfood.com');

// ===== API RESPONSE CODES =====
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_CONFLICT', 409);
define('HTTP_INTERNAL_ERROR', 500);

?>
