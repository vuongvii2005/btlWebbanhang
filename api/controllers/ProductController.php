<?php
/**
 * 🍔 PRODUCT CONTROLLER - Xử lý sản phẩm
 * API Routes:
 * - GET    /api/products
 * - GET    /api/products/:id
 * - POST   /api/products (Admin)
 * - PUT    /api/products/:id (Admin)
 * - DELETE /api/products/:id (Admin)
 * - GET    /api/products/search?q=keyword
 * - GET    /api/categories
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../models/Product.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $product = new Product($pdo);
    $auth = new Auth($pdo);
    
    $method = getMethod();
    $action = $_GET['action'] ?? getInput('action') ?? 'list';
    
    switch ($action) {
        
        case 'list':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $filters = [
                'category' => getInput('category'),
                'search' => getInput('search'),
                'sort' => getInput('sort'),
                'limit' => getInput('limit', DEFAULT_PER_PAGE),
                'offset' => getInput('offset', 0)
            ];
            
            $products = $product->getAll($filters);
            $total = $product->count(['category' => $filters['category'], 'search' => $filters['search']]);
            
            Response::paginated(
                $products,
                (int)($filters['offset'] / $filters['limit']) + 1,
                $filters['limit'],
                $total,
                'Products fetched successfully'
            );
            break;
            
        case 'detail':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid product ID']);
            }
            
            $prod = $product->getById($id);
            if ($prod) {
                Response::success($prod);
            } else {
                Response::notFound('Product');
            }
            break;
            
        case 'create':
            if ($method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            $input = getInput();
            $result = $product->create($input);
            
            if ($result['success']) {
                Response::success(
                    ['product_id' => $result['product_id']],
                    $result['message'],
                    201
                );
            } else {
                Response::error(
                    $result['message'],
                    400,
                    $result['errors'] ?? []
                );
            }
            break;
            
        case 'update':
            if ($method !== 'PUT' && $method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid product ID']);
            }
            
            $input = getInput();
            $result = $product->update($id, $input);
            
            if ($result['success']) {
                Response::success(null, $result['message']);
            } else {
                Response::error($result['message']);
            }
            break;
            
        case 'delete':
            if ($method !== 'DELETE' && $method !== 'POST') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            
            $id = getInput('id');
            if (!validatePositiveInt($id)) {
                Response::badRequest(['id' => 'Invalid product ID']);
            }
            
            $result = $product->delete($id);
            
            if ($result['success']) {
                Response::success(null, $result['message']);
            } else {
                Response::error($result['message']);
            }
            break;
            
        case 'search':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $q = getInput('q');
            if (strlen($q) < 2) {
                Response::badRequest(['q' => 'Search keyword must be at least 2 characters']);
            }
            
            $results = $product->search($q);
            Response::success($results, 'Search results');
            break;
            
        case 'categories':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $categories = $product->getCategories();
            Response::success($categories, 'Categories fetched successfully');
            break;
            
        case 'best-sellers':
            if ($method !== 'GET') {
                Response::error('Method not allowed', 405);
            }
            
            $auth->requireAdmin();
            $limit = getInput('limit', 10);
            
            $sellers = $product->getBestSellers($limit);
            Response::success($sellers, 'Best sellers fetched');
            break;
            
        default:
            Response::error('Action not found', 404);
    }
    
} catch (Exception $e) {
    logError('Product controller error', ['error' => $e->getMessage()]);
    
    if (DEBUG_MODE) {
        Response::internalError($e->getMessage());
    } else {
        Response::internalError();
    }
}

?>
