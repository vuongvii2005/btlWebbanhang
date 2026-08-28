🍜 Vy Food – Website Bán Hàng Đồ Ăn

Website thương mại điện tử bán đồ ăn, xây dựng theo mô hình Frontend (HTML/CSS/JS thuần) giao tiếp với Backend API (PHP thuần + PDO), dữ liệu lưu trên MySQL/MariaDB.

📁 Cấu trúc thư mục
btlWebbanhang/
├── api/                     # Backend API (PHP)
│   ├── index.php            # Router chính: /api/index.php?controller=...&action=...
│   ├── config/               # Cấu hình app & database
│   ├── controllers/          # Auth, Product, Order, Admin, Review, Favorite...
│   ├── models/                # User, Product, Order
│   ├── middleware/            # Auth (JWT), Validator
│   ├── checkout/, coupons/, orders/, user/   # Các script nghiệp vụ riêng
│   └── utils/                 # Helper, Response
├── assets/                  # CSS, ảnh, font
├── js/                       # Toàn bộ JS phía client (api.js, auth.js, cart.js, checkout.js, ...)
├── database/
│   ├── data_hien_tai.sql     # File dump database đầy đủ (cấu trúc + dữ liệu mẫu)
│   └── migrations/           # Các migration bổ sung, chạy sau khi import file dump gốc
├── uploads/                  # Ảnh sản phẩm & avatar do người dùng/admin tải lên
├── index.html                # Trang chủ (khách hàng)
├── admin.html                 # Trang quản trị (admin)
├── checkout.html               # Trang thanh toán
├── history.html                # Lịch sử đơn hàng
├── profile.html                # Trang tài khoản cá nhân
└── reviews.html                 # Trang đánh giá sản phẩm
🛠️ Yêu cầu hệ thống
PHP ≥ 8.0 (đã kích hoạt extension pdo_mysql)
MySQL hoặc MariaDB (khuyến nghị dùng qua XAMPP/Laragon/WAMP)
Trình duyệt web hiện đại (Chrome, Edge, Firefox...)
Không cần Node.js/Composer – dự án không dùng build tool hay package quản lý phụ thuộc nào
🚀 Hướng dẫn cài đặt
1. Tải mã nguồn về thư mục web server

Giải nén/copy toàn bộ thư mục dự án vào thư mục gốc web server, ví dụ với XAMPP:

C:\xampp\htdocs\btlWebbanhang\

⚠️ Lưu ý: tên thư mục nên giữ nguyên là btlWebbanhang vì URL API mặc định trong js/api.js đang trỏ tới http://localhost/btlWebbanhang/api/index.php. Nếu đổi tên thư mục, cần sửa lại biến API_URL trong file này.

2. Khởi động Apache & MySQL

Mở XAMPP Control Panel (hoặc công cụ tương đương) và bật Apache và MySQL.

3. Tạo database
Truy cập phpMyAdmin: http://localhost/phpmyadmin
Tạo một database mới tên vy_food (charset utf8mb4_unicode_ci)
Chọn database vừa tạo → tab Import → chọn file database/data_hien_tai.sql → nhấn Go để import cấu trúc bảng và dữ liệu mẫu
Sau đó import tiếp các file trong database/migrations/ (theo đúng thứ tự tên file) nếu có, để cập nhật các thay đổi mới nhất:
20260606_add_product_meal_tags.sql
20260606_add_coupon_redeemed_count.sql
4. Cấu hình kết nối database

Mở file api/config/config.php và kiểm tra/chỉnh lại các thông số cho khớp với môi trường của bạn:

php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'vy_food');
define('DB_PORT', 3306);

Mặc định phù hợp với XAMPP (user root, không mật khẩu). Nếu MySQL của bạn có mật khẩu, hãy điền vào DB_PASS.

Có thể cấu hình thêm qua biến môi trường (không bắt buộc):

APP_ENV = development | production
JWT_SECRET – khóa bí mật để ký JWT (nên đổi trước khi triển khai thật)
CORS_ALLOWED_ORIGINS – danh sách origin được phép gọi API, phân tách bằng dấu phẩy
5. Cấp quyền ghi cho thư mục upload & log

Đảm bảo các thư mục sau có quyền ghi (web server cần ghi file vào đây):

uploads/avatars/
uploads/products/
logs/
6. Truy cập website
Trang khách hàng: http://localhost/btlWebbanhang/index.html
Trang quản trị: http://localhost/btlWebbanhang/admin.html

Tài khoản admin mặc định có thể được khởi tạo qua endpoint api/index.php?controller=auth&action=seed-admin (xem chi tiết trong AuthController.php), hoặc kiểm tra dữ liệu mẫu có sẵn trong bảng users sau khi import SQL.

✨ Các tính năng chính
👤 Dành cho khách hàng
Đăng ký / Đăng nhập / Đăng xuất – xác thực bằng JWT, đổi mật khẩu
Trang chủ & danh mục sản phẩm – duyệt món ăn theo danh mục (món mặn, món chay, lẩu, ăn vặt, tráng miệng, nước uống...), tìm kiếm sản phẩm
Chi tiết sản phẩm – xem thông tin, hình ảnh, đánh giá của sản phẩm
Giỏ hàng – thêm/xóa/cập nhật số lượng sản phẩm trong giỏ
Yêu thích (Wishlist) – đánh dấu/bỏ đánh dấu sản phẩm yêu thích
Thanh toán (Checkout) – đặt hàng, áp dụng mã giảm giá/coupon
Lịch sử đơn hàng – xem danh sách đơn hàng đã đặt, chi tiết đơn, hủy đơn
Đánh giá sản phẩm (Reviews) – viết đánh giá kèm ảnh cho sản phẩm đã mua, xem thống kê đánh giá
Trang tài khoản cá nhân – cập nhật thông tin, đổi ảnh đại diện, quản lý địa chỉ giao hàng
Điểm thưởng & mã giảm giá – tích điểm, đổi/nhận coupon, coupon chào mừng cho tài khoản mới
🛡️ Dành cho quản trị viên (Admin Dashboard)
Tổng quan (Dashboard) – thống kê doanh thu, đơn hàng
Quản lý danh mục sản phẩm – thêm/sửa/xóa danh mục
Quản lý sản phẩm – thêm/sửa/xóa sản phẩm, tải ảnh, xem sản phẩm bán chạy nhất
Quản lý đơn hàng – xem toàn bộ đơn hàng, xem chi tiết, cập nhật trạng thái đơn hàng
Quản lý khách hàng – xem danh sách, chi tiết, khóa/mở tài khoản khách hàng
Quản lý mã giảm giá (Coupon) – tạo/sửa/xóa/bật-tắt coupon, tặng coupon cho khách hàng
Thống kê doanh thu – báo cáo doanh thu theo thời gian
🔧 Kỹ thuật
Backend API dạng REST đơn giản: api/index.php?controller=<tên>&action=<hành động>
Xác thực & phân quyền qua JWT (api/middleware/Auth.php)
Kiểm tra dữ liệu đầu vào qua api/middleware/Validator.php
Hỗ trợ CORS có thể cấu hình
Cấu trúc phản hồi JSON thống nhất qua api/utils/Response.php
📝 Ghi chú
Đây là đồ án học tập (BTL – Bài tập lớn), phù hợp để chạy trên môi trường local (XAMPP/Laragon).
Trước khi triển khai lên môi trường thật (production), cần:
Đổi JWT_SECRET sang giá trị bí mật riêng
Đặt APP_ENV=production để tắt debug mode
Cấu hình CORS_ALLOWED_ORIGINS đúng với domain thật
Đổi mật khẩu database, không dùng tài khoản root không mật khẩu
