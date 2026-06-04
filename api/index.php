<?php
/**
 * 🔌 API ROUTER - Main entry point for all API requests
 * Routes: /api/index.php?controller=NAME&action=METHOD
 */

// ===== LOAD CONFIGURATION =====
require_once __DIR__ . '/config/config.php';
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Helper.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/middleware/Validator.php';
require_once __DIR__ . '/middleware/Auth.php';

// ===== LOAD MODELS =====
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/Product.php';
require_once __DIR__ . '/models/Order.php';

// ===== ROUTE HANDLER =====
try {
    $controller = $_GET['controller'] ?? 'index';
    $action = $_GET['action'] ?? 'index';
    
    // Security: Sanitize controller and action names
    $controller = preg_replace('/[^a-zA-Z0-9_]/', '', $controller);
    $action = preg_replace('/[^a-zA-Z0-9_]/', '', $action);
    
    // Load appropriate controller
    $controllerFile = __DIR__ . "/controllers/" . ucfirst($controller) . "Controller.php";
    
    if (!file_exists($controllerFile)) {
        Response::notFound("Controller: $controller");
    }
    
    require_once $controllerFile;
    
} catch (Exception $e) {
    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    } else {
        Response::internalError('Internal Server Error');
    }
}

?>
