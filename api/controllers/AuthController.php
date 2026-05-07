<?php
/**
 * 🔐 AUTH CONTROLLER - Xử lý đăng ký, đăng nhập
 * API Routes:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET  /api/auth/profile
 * - POST /api/auth/logout
 * - POST /api/auth/change-password
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../models/User.php';

header('Content-Type: application/json; charset=utf-8');

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $user = new User($pdo);
    $auth = new Auth($pdo);
    
    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? 'register';
    
    switch ($action) {
        
        case 'register':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $input = getInput();
            $result = $user->register(
                $input['fullname'] ?? '',
                $input['phone'] ?? '',
                $input['password'] ?? '',
                $input['email'] ?? null
            );
            
            if ($result['success']) {
                Response::success(
                    ['user_id' => $result['user_id']],
                    $result['message'],
                    201
                );
            } else {
                Response::error(
                    $result['message'],
                    $result['code'] === 'PHONE_EXISTS' ? 409 : 400,
                    $result['errors'] ?? []
                );
            }
            break;
            
        case 'login':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $input = getInput();
            $identifier = $input['identifier'] ?? $input['phone'] ?? $input['email'] ?? '';
            $result = $user->login(
                $identifier,
                $input['password'] ?? ''
            );
            
            if ($result['success']) {
                Response::success(
                    [
                        'token' => $result['token'],
                        'user' => $result['user']
                    ],
                    $result['message']
                );
            } else {
                Response::error(
                    $result['message'],
                    400,
                    $result['errors'] ?? []
                );
            }
            break;
            
        case 'profile':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $currentUser = $auth->require();
            $userInfo = $user->getById($currentUser['id']);
            
            if ($userInfo) {
                unset($userInfo['password']);
                Response::success($userInfo);
            } else {
                Response::notFound('User');
            }
            break;
            
        case 'logout':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->require();
            $auth->logout();
            Response::success(null, 'Logout successful');
            break;
            
        case 'change-password':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $currentUser = $auth->require();
            $input = getInput();
            
            $result = $user->changePassword(
                $currentUser['id'],
                $input['old_password'] ?? '',
                $input['new_password'] ?? ''
            );
            
            if ($result['success']) {
                Response::success(null, $result['message']);
            } else {
                Response::error($result['message'], 400, $result['errors'] ?? []);
            }
            break;
            
        default:
            Response::error('Action not found', 404);
    }
    
} catch (Exception $e) {
    logError('Auth controller error', ['error' => $e->getMessage()]);
    
    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    } else {
        Response::internalError();
    }
}

?>
