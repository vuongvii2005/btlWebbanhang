<?php
/**
 * 📤 CLASS RESPONSE - Chuẩn hóa JSON Response
 */

class Response {
    
    /**
     * Gửi response thành công
     * @param mixed $data - Dữ liệu trả về
     * @param string $message - Thông báo
     * @param int $code - HTTP status code
     */
    public static function success($data = null, $message = 'Success', $code = 200) {
        http_response_code($code);
        self::sendJson([
            'success' => true,
            'code' => $code,
            'message' => $message,
            'data' => $data,
            'timestamp' => time()
        ]);
    }
    
    /**
     * Gửi response lỗi
     * @param string $message - Thông báo lỗi
     * @param int $code - HTTP status code
     * @param array $errors - Chi tiết lỗi (nếu có)
     */
    public static function error($message = 'Error', $code = 400, $errors = []) {
        http_response_code($code);
        self::sendJson([
            'success' => false,
            'code' => $code,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => time()
        ]);
    }
    
    /**
     * Gửi response paginated
     * @param array $items - Danh sách items
     * @param int $currentPage - Trang hiện tại
     * @param int $perPage - Items trên mỗi trang
     * @param int $total - Tổng số items
     * @param string $message - Thông báo
     */
    public static function paginated($items, $currentPage, $perPage, $total, $message = 'Success') {
        $totalPages = ceil($total / $perPage);
        
        http_response_code(200);
        self::sendJson([
            'success' => true,
            'code' => 200,
            'message' => $message,
            'data' => $items,
            'pagination' => [
                'current_page' => (int)$currentPage,
                'per_page' => (int)$perPage,
                'total' => (int)$total,
                'total_pages' => (int)$totalPages,
                'has_next' => $currentPage < $totalPages,
                'has_prev' => $currentPage > 1
            ],
            'timestamp' => time()
        ]);
    }
    
    /**
     * Gửi JSON response
     * @param array $data - Dữ liệu JSON
     */
    private static function sendJson($data) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Gửi 404 Not Found
     * @param string $resource - Tên resource không tìm thấy
     */
    public static function notFound($resource = 'Resource') {
        self::error("$resource not found", 404);
    }
    
    /**
     * Gửi 401 Unauthorized
     */
    public static function unauthorized() {
        self::error('Unauthorized - Please login first', 401);
    }
    
    /**
     * Gửi 403 Forbidden
     */
    public static function forbidden() {
        self::error('Forbidden - You do not have permission', 403);
    }
    
    /**
     * Gửi 400 Bad Request
     * @param array $errors - Chi tiết lỗi validation
     */
    public static function badRequest($errors = []) {
        self::error('Bad Request - Invalid input', 400, $errors);
    }
    
    /**
     * Gửi 409 Conflict
     * @param string $message - Thông báo
     */
    public static function conflict($message = 'Conflict') {
        self::error($message, 409);
    }
    
    /**
     * Gửi 500 Internal Server Error
     * @param string $message - Thông báo lỗi
     */
    public static function internalError($message = 'Internal Server Error') {
        self::error($message, 500);
    }
}

?>
