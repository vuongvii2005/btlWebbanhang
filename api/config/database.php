<?php
/**
 * CẤU HÌNH KẾT NỐI DATABASE
 */
require_once __DIR__ . '/config.php';

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_CHARSET
    );
    
    $pdo = new PDO(
        $dsn,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    
    // Test connection
    $pdo->query('SELECT 1');
    
    if (DEBUG_MODE) {
        error_log('Database connected successfully');
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    
    if (DEBUG_MODE) {
        die(json_encode([
            'error' => 'Database Connection Failed',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]));
    } else {
        die(json_encode([
            'error' => 'Database Connection Failed',
            'message' => 'Unable to connect to database'
        ]));
    }
}

?>
