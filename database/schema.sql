
CREATE DATABASE IF NOT EXISTS vy_food CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vy_food;

-- ===== USERS TABLE =====
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    address TEXT,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== CATEGORIES TABLE =====
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== PRODUCTS TABLE =====
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    price DECIMAL(10, 2) NOT NULL CHECK(price > 0),
    image_url VARCHAR(255),
    stock INT DEFAULT 999,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX ft_title (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ORDERS TABLE =====
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK(total_amount >= 0),
    shipping_fee DECIMAL(10, 2) DEFAULT 30000,
    delivery_type ENUM('delivery', 'pickup') DEFAULT 'delivery',
    delivery_date DATE,
    delivery_time VARCHAR(50),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    notes TEXT,
    status ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ORDER ITEMS TABLE =====
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK(quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK(price > 0),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== PAYMENTS TABLE (cho tương lai) =====
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_order_id (order_id),
    INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== REVIEWS TABLE (cho tương lai) =====
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 📌 INSERT SAMPLE DATA
-- ===============================================

-- Insert categories
INSERT INTO categories (name, description, display_order) VALUES
('Món mặn', 'Các món ăn mặn ngon miệng', 1),
('Món chay', 'Các món ăn chay lành mạnh', 2),
('Món lẩu', 'Lẩu các loại', 3),
('Món ăn vặt', 'Các món ăn vặt', 4),
('Món tráng miệng', 'Tráng miệng và không khí', 5),
('Nước uống', 'Các loại nước uống', 6),
('Món khác', 'Các món khác', 7);

-- Insert products (từ dữ liệu hard-code)
INSERT INTO products (category_id, title, description, price, image_url, status) VALUES
(1, 'Nấm đùi gà xào cháy tỏi', 'Nấm đùi gà giòn ngọt được xào cùng tỏi thơm lừng, tạo hương vị đậm đà hấp dẫn.', 200000, './assets/img/products/nam-dui-ga-chay-toi.jpeg', 1),
(1, 'Rau xào ngũ sắc', 'Món rau xào tổng hợp với nhiều loại rau củ tươi ngon, giữ nguyên vị ngọt tự nhiên và màu sắc bắt mắt.', 180000, './assets/img/products/rau-xao-ngu-sac.png', 1),
(1, 'Bánh lava phô mai nướng', 'Bánh nướng giòn tan bên ngoài, nhân phô mai chảy mềm mịn, béo ngậy và thơm lừng khi cắn vào.', 180000, './assets/img/products/banh_lava_pho_mai_nuong.jpeg', 1),
(3, 'Set lẩu thái Tomyum', 'Lẩu Thái Tomyum chua cay đặc trưng, kết hợp hải sản tươi sống và rau củ phong phú, chuẩn vị Thái Lan.', 699000, './assets/img/products/lau_thai.jpg', 1),
(1, 'Cơm chiên cua', 'Cơm chiên vàng óng, hạt tơi đều, hòa quyện cùng thịt cua tươi và trứng thơm béo hấp dẫn.', 280000, './assets/img/products/com_chien_cua.png', 1),
(1, 'Súp bào ngư hải sâm (1 phần)', 'Súp cao cấp kết hợp bào ngư, hải sâm và nấm đông cô, bổ dưỡng và sang trọng, rất tốt cho sức khỏe.', 540000, './assets/img/products/sup-bao-ngu-hai-sam.jpeg', 1),
(1, 'Tai cuộn lưỡi', 'Tai heo và lưỡi heo được luộc chín, thái mỏng cuộn lại cùng gia vị, tạo nên món ăn giòn sần sật, đậm vị.', 340000, './assets/img/products/tai-cuon-luoi.jpeg', 1),
(1, 'Xíu mại tôm thịt 10 viên', 'Món dimsum truyền thống với nhân tôm thịt tươi, gói trong lớp bột mỏng và hấp chín mềm, thơm phức.', 140000, './assets/img/products/xiu_mai_tom_thit_10_vien.jpg', 1),
(6, 'Trà phô mai kem sữa', 'Trà đậm đà kết hợp lớp kem phô mai béo mịn, ngọt nhẹ và mặn mà, tạo cảm giác khó quên.', 34000, './assets/img/products/tra-pho-mai-kem-sua.jpg', 1),
(6, 'Trà đào chanh sả', 'Trà đào thanh mát kết hợp chanh và sả thơm dịu, mang đến cảm giác sảng khoái tức thì.', 25000, './assets/img/products/tra-dao-chanh-sa.jpg', 1),
(5, 'Bánh chuối nướng', 'Bánh chuối thơm lừng, nướng vàng mặt, bên trong mềm mịn và ngọt dịu tự nhiên của chuối chín.', 60000, './assets/img/products/banh-chuoi-nuong.jpeg', 1),
(1, 'Há cảo sò điệp (10 viên)', 'Há cảo hấp nhân sò điệp tươi ngon, vỏ bánh trong suốt, dai nhẹ, vị ngọt thanh hấp dẫn.', 140000, './assets/img/products/ha_cao.jpg', 1),
(1, 'Nạc nọng heo nướng kèm xôi trắng (500gr)', 'Nọng heo - phần thịt ngon nhất trên thủ heo, với những dải thịt nạc mỡ đan xen, mỗi thủ chỉ có được 1-2kg thịt nọng ngon mềm như vậy.', 300000, './assets/img/products/nac-nong-heo-nuong-kem-xoi-trang.jpeg', 1),
(1, 'Nộm gà Hội An (1 phần)', 'Gà xé trộn cùng bắp cải, hành tây, rau răm và nước mắm chua ngọt, tạo nên hương vị thanh nhẹ và hấp dẫn.', 60000, './assets/img/products/nom_ga_hoi_an.png', 1),
(1, 'Set bún cá (1 set 5 bát)', 'Bún cá tươi ngon, nước dùng thanh ngọt, ăn kèm rau sống và ớt tươi đúng chuẩn hương vị truyền thống.', 60000, './assets/img/products/set_bun_ca.jpg', 1),
(5, 'Chè hương cốm lá dứa', 'Chè cốm hương lá dứa dẻo thơm, ngọt dịu, từng hạt cốm thoảng thoảng đâu đó hương lá dứa mát lành', 60000, './assets/img/products/che-com-la-dua.jpeg', 1),
(5, 'Bánh bông lan chanh dây', 'Bánh bông lan chanh dây với vị chua nhẹ, không bị ngọt gắt hẳn sẽ là sự lựa chọn hoàn hảo', 50000, './assets/img/products/banh-bong-lan-chanh-day.jpeg', 1),
(5, 'Chè bưởi', 'Chè bưởi rất dễ ăn bởi hương vị ngọt mát, thơm ngon, vị bùi bùi của đậu xanh, giòn sần sật của cùi bưởi mà không hề bị đắng', 50000, './assets/img/products/che-buoi.jpeg', 1),
(6, 'Nước ép dâu tây', 'Dâu tây ăn nguyên quả ngon ngọt, có cả quả dôn dốt chua, màu đỏ mọng trông cực yêu.', 100000, './assets/img/products/nuoc-ep-dau-tay.jpg', 1),
(6, 'Nước lọc', 'Nước lọc', 5000, './assets/img/products/lavie-500ml-chai-moi-2.jpg', 1);

-- Insert test users
INSERT INTO users (fullname, phone, password, email, role, created_at) VALUES
('Admin Vy Food', '0901000000', '$2y$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86.qS96dJQm', 'admin@vyfood.com', 'admin', NOW()),
('Vương Vy', '0901234567', '$2y$12$mKZ5LHKT89DKGJM4.CrESeXvGPNHhOW.TtTGmK9Hk7rKOFZ2kIk9a', 'vy@example.com', 'customer', NOW());

-- Insert sample order
INSERT INTO orders (user_id, total_amount, shipping_fee, delivery_type, customer_name, customer_phone, customer_address, status, created_at) VALUES
(2, 500000, 30000, 'delivery', 'Vương Vy', '0901234567', '123 Nguyễn Hữu Cầu, Q1, TPHCM', 'pending', NOW());

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price, note) VALUES
(1, 1, 2, 200000, null),
(1, 5, 1, 280000, 'Ít ớt');

-- ===============================================
-- 🔑 INDEXES & CONSTRAINTS
-- ===============================================

-- Create view for order statistics
CREATE VIEW order_stats AS
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as daily_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE(created_at);

-- ===============================================
-- ✅ DONE
-- ===============================================
