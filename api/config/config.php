<?php
/**
 * ⚙️ CẤU HÌNH CHUNG CHO API
 */

// ===== Môi trường =====
define('ENVIRONMENT', 'development'); // development / production
define('DEBUG_MODE', ENVIRONMENT === 'development');

// ===== API SETTINGS =====
define('API_URL', 'http://localhost:8000/api');
define('APP_NAME', 'Vy Food API');
define('APP_VERSION', '1.0.0');

// ===== Bảo mật =====
define('JWT_SECRET', 'your-super-secret-key-change-in-production');
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
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]);

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
