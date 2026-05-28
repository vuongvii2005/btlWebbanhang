-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 27, 2026 at 04:12 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vy_food`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Món mặn', 'Các món ăn mặn ngon miệng', NULL, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(2, 'Món chay', 'Các món ăn chay lành mạnh', NULL, 2, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(3, 'Món lẩu', 'Lẩu các loại', NULL, 3, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(4, 'Món ăn vặt', 'Các món ăn vặt', NULL, 4, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(5, 'Món tráng miệng', 'Tráng miệng và không khí', NULL, 5, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(6, 'Nước uống', 'Các loại nước uống', NULL, 6, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(7, 'Món khác', 'Các món khác', NULL, 7, '2026-05-06 19:42:11', '2026-05-06 19:42:11');

-- --------------------------------------------------------

--
-- Table structure for table `favorite_products`
--

CREATE TABLE `favorite_products` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL CHECK (`total_amount` >= 0),
  `shipping_fee` decimal(10,2) DEFAULT 30000.00,
  `delivery_type` enum('delivery','pickup') DEFAULT 'delivery',
  `delivery_date` date DEFAULT NULL,
  `delivery_time` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_address` text NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','confirmed','shipping','delivered','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `shipping_fee`, `delivery_type`, `delivery_date`, `delivery_time`, `customer_name`, `customer_phone`, `customer_address`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 500000.00, 30000.00, 'delivery', NULL, NULL, 'Vương Vy', '0901234567', '123 Nguyễn Hữu Cầu, Q1, TPHCM', NULL, 'pending', '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(2, 19, 230000.00, 30000.00, 'delivery', '2026-05-13', NULL, 'History Test', '0317273011', '123 Test Street', 'history flow test', 'cancelled', '2026-05-13 10:27:31', '2026-05-13 10:27:31'),
(3, 21, 610000.00, 30000.00, 'delivery', '2026-05-13', 'asap', 'Checkout Test', '0917361133', '123 Checkout Street', 'checkout flow test', 'pending', '2026-05-13 10:36:12', '2026-05-13 10:36:12'),
(4, 22, 230000.00, 30000.00, 'delivery', '2026-05-13', NULL, 'Phone Field Test', '0818024144', '123 Test', '', 'pending', '2026-05-13 11:02:41', '2026-05-13 11:02:41'),
(5, 22, 230000.00, 30000.00, 'delivery', '2026-05-13', NULL, 'Alias Phone Test', '0818024144', '123 Test', '', 'pending', '2026-05-13 11:02:51', '2026-05-13 11:02:51'),
(6, 5, 90000.00, 30000.00, 'delivery', '2026-05-13', NULL, 'vuong vii', '0327954569', '12132', '123243', 'pending', '2026-05-13 11:04:35', '2026-05-13 11:04:35'),
(7, 5, 230000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'dâd', '23132', 'cancelled', '2026-05-14 04:19:36', '2026-05-14 06:27:14'),
(8, 7, 180000.00, 0.00, 'pickup', '2026-05-14', 'asap', 'toibingu', '0327954568', '123', '1321321', 'pending', '2026-05-14 07:18:09', '2026-05-14 07:18:09'),
(9, 5, 750000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', 'skjds0bfskdfkj', 'pending', '2026-05-14 07:39:38', '2026-05-14 07:39:38'),
(10, 5, 750000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '12123', 'ê324', 'pending', '2026-05-14 07:41:06', '2026-05-14 07:41:06'),
(11, 5, 750000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', '2113221', 'pending', '2026-05-14 07:46:32', '2026-05-14 07:46:32'),
(12, 5, 210000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', 'ffsdfsdf', 'pending', '2026-05-14 07:48:05', '2026-05-14 07:48:05'),
(13, 5, 210000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'ghghgghhgh', 'bbghhgg', 'pending', '2026-05-14 07:54:09', '2026-05-14 07:54:09'),
(14, 5, 390000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'fdsfdfd', 'sfdgfgfd', 'pending', '2026-05-14 07:55:50', '2026-05-14 07:55:50'),
(15, 5, 390000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', 'xsdfsdfsd', 'pending', '2026-05-14 07:57:35', '2026-05-14 07:57:35'),
(16, 5, 210000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'ưeqưewqe', 'sdfsdfds', 'delivered', '2026-05-14 08:00:58', '2026-05-14 08:09:57'),
(17, 5, 210000.00, 30000.00, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'csdfdfsd', 'fdfsdfsd', 'shipping', '2026-05-14 08:01:23', '2026-05-14 08:09:51');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `price` decimal(10,2) NOT NULL CHECK (`price` > 0),
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `note`, `created_at`) VALUES
(1, 1, 1, 2, 200000.00, NULL, '2026-05-06 19:42:11'),
(2, 1, 5, 1, 280000.00, 'Ít ớt', '2026-05-06 19:42:11'),
(3, 2, 1, 1, 200000.00, '', '2026-05-13 10:27:31'),
(4, 3, 1, 2, 200000.00, '', '2026-05-13 10:36:12'),
(5, 3, 2, 1, 180000.00, 'less oil', '2026-05-13 10:36:12'),
(6, 4, 1, 1, 200000.00, '', '2026-05-13 11:02:41'),
(7, 5, 1, 1, 200000.00, '', '2026-05-13 11:02:51'),
(8, 6, 11, 1, 60000.00, '', '2026-05-13 11:04:35'),
(9, 7, 1, 1, 200000.00, '', '2026-05-14 04:19:36'),
(10, 8, 2, 1, 180000.00, '', '2026-05-14 07:18:09'),
(11, 9, 2, 1, 180000.00, '', '2026-05-14 07:39:38'),
(12, 9, 3, 3, 180000.00, '', '2026-05-14 07:39:38'),
(13, 10, 2, 1, 180000.00, '', '2026-05-14 07:41:06'),
(14, 10, 3, 3, 180000.00, '', '2026-05-14 07:41:06'),
(15, 11, 2, 1, 180000.00, '', '2026-05-14 07:46:32'),
(16, 11, 3, 3, 180000.00, '', '2026-05-14 07:46:32'),
(17, 12, 3, 1, 180000.00, '', '2026-05-14 07:48:05'),
(18, 13, 3, 1, 180000.00, '', '2026-05-14 07:54:09'),
(19, 14, 3, 2, 180000.00, '', '2026-05-14 07:55:50'),
(20, 15, 3, 2, 180000.00, '', '2026-05-14 07:57:35'),
(21, 16, 3, 1, 180000.00, '', '2026-05-14 08:00:58'),
(22, 17, 3, 1, 180000.00, '', '2026-05-14 08:01:23');

-- --------------------------------------------------------

--
-- Stand-in structure for view `order_stats`
-- (See below for the actual view)
--
CREATE TABLE `order_stats` (
`order_date` date
,`total_orders` bigint(21)
,`daily_revenue` decimal(32,2)
,`avg_order_value` decimal(14,6)
);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `transaction_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `amount`, `payment_method`, `payment_status`, `transaction_id`, `created_at`, `updated_at`) VALUES
(1, 3, 610000.00, 'COD', 'pending', NULL, '2026-05-13 10:36:12', '2026-05-13 10:36:12'),
(2, 4, 230000.00, 'COD', 'pending', NULL, '2026-05-13 11:02:41', '2026-05-13 11:02:41'),
(3, 5, 230000.00, 'COD', 'pending', NULL, '2026-05-13 11:02:51', '2026-05-13 11:02:51'),
(4, 7, 230000.00, 'COD', 'pending', NULL, '2026-05-14 04:19:36', '2026-05-14 04:19:36'),
(5, 8, 180000.00, 'COD', 'pending', NULL, '2026-05-14 07:18:09', '2026-05-14 07:18:09'),
(6, 9, 750000.00, 'COD', 'pending', NULL, '2026-05-14 07:39:38', '2026-05-14 07:39:38'),
(7, 10, 750000.00, 'COD', 'pending', NULL, '2026-05-14 07:41:06', '2026-05-14 07:41:06'),
(8, 11, 750000.00, 'COD', 'pending', NULL, '2026-05-14 07:46:32', '2026-05-14 07:46:32'),
(9, 12, 210000.00, 'COD', 'pending', NULL, '2026-05-14 07:48:05', '2026-05-14 07:48:05'),
(10, 13, 210000.00, 'COD', 'pending', NULL, '2026-05-14 07:54:09', '2026-05-14 07:54:09'),
(11, 14, 390000.00, 'COD', 'pending', NULL, '2026-05-14 07:55:50', '2026-05-14 07:55:50'),
(12, 15, 390000.00, 'COD', 'pending', NULL, '2026-05-14 07:57:35', '2026-05-14 07:57:35'),
(13, 16, 210000.00, 'COD', 'pending', NULL, '2026-05-14 08:00:58', '2026-05-14 08:00:58'),
(14, 17, 210000.00, 'COD', 'pending', NULL, '2026-05-14 08:01:23', '2026-05-14 08:01:23');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `price` decimal(10,2) NOT NULL CHECK (`price` > 0),
  `image_url` varchar(255) DEFAULT NULL,
  `stock` int(11) DEFAULT 999,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `title`, `description`, `price`, `image_url`, `stock`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Nấm đùi gà xào cháy tỏi', 'Nấm đùi gà giòn ngọt được xào cùng tỏi thơm lừng, tạo hương vị đậm đà hấp dẫn.', 200000.00, './assets/img/products/nam-dui-ga-chay-toi.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(2, 1, 'Rau xào ngũ sắc', 'Món rau xào tổng hợp với nhiều loại rau củ tươi ngon, giữ nguyên vị ngọt tự nhiên và màu sắc bắt mắt.', 180000.00, './assets/img/products/rau-xao-ngu-sac.png', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(3, 1, 'Bánh lava phô mai nướng', 'Bánh nướng giòn tan bên ngoài, nhân phô mai chảy mềm mịn, béo ngậy và thơm lừng khi cắn vào.', 180000.00, './assets/img/products/banh_lava_pho_mai_nuong.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(4, 3, 'Set lẩu thái Tomyum', 'Lẩu Thái Tomyum chua cay đặc trưng, kết hợp hải sản tươi sống và rau củ phong phú, chuẩn vị Thái Lan.', 699000.00, './assets/img/products/lau_thai.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(5, 1, 'Cơm chiên cua', 'Cơm chiên vàng óng, hạt tơi đều, hòa quyện cùng thịt cua tươi và trứng thơm béo hấp dẫn.', 280000.00, './assets/img/products/com_chien_cua.png', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(6, 1, 'Súp bào ngư hải sâm (1 phần)', 'Súp cao cấp kết hợp bào ngư, hải sâm và nấm đông cô, bổ dưỡng và sang trọng, rất tốt cho sức khỏe.', 540000.00, './assets/img/products/sup-bao-ngu-hai-sam.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(7, 1, 'Tai cuộn lưỡi', 'Tai heo và lưỡi heo được luộc chín, thái mỏng cuộn lại cùng gia vị, tạo nên món ăn giòn sần sật, đậm vị.', 340000.00, './assets/img/products/tai-cuon-luoi.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(8, 1, 'Xíu mại tôm thịt 10 viên', 'Món dimsum truyền thống với nhân tôm thịt tươi, gói trong lớp bột mỏng và hấp chín mềm, thơm phức.', 140000.00, './assets/img/products/xiu_mai_tom_thit_10_vien.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(9, 6, 'Trà phô mai kem sữa', 'Trà đậm đà kết hợp lớp kem phô mai béo mịn, ngọt nhẹ và mặn mà, tạo cảm giác khó quên.', 34000.00, './assets/img/products/tra-pho-mai-kem-sua.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(10, 6, 'Trà đào chanh sả', 'Trà đào thanh mát kết hợp chanh và sả thơm dịu, mang đến cảm giác sảng khoái tức thì.', 25000.00, './assets/img/products/tra-dao-chanh-sa.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(11, 5, 'Bánh chuối nướng', 'Bánh chuối thơm lừng, nướng vàng mặt, bên trong mềm mịn và ngọt dịu tự nhiên của chuối chín.', 60000.00, './assets/img/products/banh-chuoi-nuong.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(12, 1, 'Há cảo sò điệp (10 viên)', 'Há cảo hấp nhân sò điệp tươi ngon, vỏ bánh trong suốt, dai nhẹ, vị ngọt thanh hấp dẫn.', 140000.00, './assets/img/products/ha_cao.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(13, 1, 'Nạc nọng heo nướng kèm xôi trắng (500gr)', 'Nọng heo - phần thịt ngon nhất trên thủ heo, với những dải thịt nạc mỡ đan xen, mỗi thủ chỉ có được 1-2kg thịt nọng ngon mềm như vậy.', 300000.00, './assets/img/products/nac-nong-heo-nuong-kem-xoi-trang.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(14, 1, 'Nộm gà Hội An (1 phần)', 'Gà xé trộn cùng bắp cải, hành tây, rau răm và nước mắm chua ngọt, tạo nên hương vị thanh nhẹ và hấp dẫn.', 60000.00, './assets/img/products/nom_ga_hoi_an.png', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(15, 1, 'Set bún cá (1 set 5 bát)', 'Bún cá tươi ngon, nước dùng thanh ngọt, ăn kèm rau sống và ớt tươi đúng chuẩn hương vị truyền thống.', 60000.00, './assets/img/products/set_bun_ca.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(16, 5, 'Chè hương cốm lá dứa', 'Chè cốm hương lá dứa dẻo thơm, ngọt dịu, từng hạt cốm thoảng thoảng đâu đó hương lá dứa mát lành', 60000.00, './assets/img/products/che-com-la-dua.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(17, 5, 'Bánh bông lan chanh dây', 'Bánh bông lan chanh dây với vị chua nhẹ, không bị ngọt gắt hẳn sẽ là sự lựa chọn hoàn hảo', 50000.00, './assets/img/products/banh-bong-lan-chanh-day.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(18, 5, 'Chè bưởi', 'Chè bưởi rất dễ ăn bởi hương vị ngọt mát, thơm ngon, vị bùi bùi của đậu xanh, giòn sần sật của cùi bưởi mà không hề bị đắng', 50000.00, './assets/img/products/che-buoi.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(19, 6, 'Nước ép dâu tây', 'Dâu tây ăn nguyên quả ngon ngọt, có cả quả dôn dốt chua, màu đỏ mọng trông cực yêu.', 100000.00, './assets/img/products/nuoc-ep-dau-tay.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(20, 6, 'Nước lọc', 'Nước lọc', 5000.00, './assets/img/products/lavie-500ml-chai-moi-2.jpg', 999, 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(21, 1, 'Test Product Updated 170653', 'temp', 12000.00, './assets/img/products/lau_thai.jpg', 999, 0, '2026-05-13 10:06:53', '2026-05-13 10:06:53');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `role` enum('customer','admin') DEFAULT 'customer',
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullname`, `phone`, `password`, `email`, `address`, `avatar_url`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Admin Vy Food', '0901000000', '$2y$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86.qS96dJQm', 'admin@vyfood.com', NULL, NULL, 'admin', 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(2, 'Vương Vy', '0901234567', '$2y$12$mKZ5LHKT89DKGJM4.CrESeXvGPNHhOW.TtTGmK9Hk7rKOFZ2kIk9a', 'vy@example.com', NULL, NULL, 'customer', 1, '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(3, 'vi huùng vương', '0327954569', '$2y$12$CpeQU/GCGTitmX07h6kWxu1.JFRb2DRikTWJmNr0na/n0BVf.JxHK', 'vuongvidlls@gmail.com', NULL, NULL, 'customer', 1, '2026-05-07 09:33:09', '2026-05-07 09:33:09'),
(5, 'vi fd', '0327954564', '$2y$12$jrn9BWCUuqFMLUPCADPRjelY5WuWU2akjP2jKJbPtnOX.m990w1Ji', 'vi@1234', NULL, NULL, 'customer', 1, '2026-05-07 09:36:26', '2026-05-07 09:36:26'),
(7, 'toibingu', '0327954568', '$2y$12$Mb1btIu.ix3lZoCFXDQ/1OVHmGw8KbcGGlkeEC.OnAJxNLRBRoyoy', 'toibingu@1213', NULL, NULL, 'customer', 1, '2026-05-07 09:59:50', '2026-05-07 09:59:50'),
(8, 'hahahah', '0327954561', '$2y$12$wiV.KatdTc8EX0ch6jy65eg8ExzECgt0Y6jtYaBSCzAZzh71QEB.C', 'haha@123', NULL, NULL, 'customer', 1, '2026-05-07 10:06:53', '2026-05-07 10:06:53'),
(10, 'hahahah', '0327954560', '$2y$12$PsyKY8WrXvRD3xvj.iC14u5grRcAHhp1XWvHJAmXHiAde2394HZfS', 'haha@1234', NULL, NULL, 'customer', 1, '2026-05-07 10:09:27', '2026-05-07 10:09:27'),
(11, 'hahahah', '0327954581', '$2y$12$2Dcj6SLesMm7li4YiTTUu.oTnNISmLj657ppWXMS9qlL3ZBYLIOxe', 'haha@12345', NULL, NULL, 'customer', 1, '2026-05-07 10:11:42', '2026-05-07 10:11:42'),
(12, 'daewqewe', '0327954345', '$2y$12$ZZv9kWCMx2HKFEjt2eIpBuB/pcPvo9nnNq.EporRZYf.6luLHDJmW', '123@123', NULL, NULL, 'customer', 1, '2026-05-07 10:14:35', '2026-05-07 10:14:35'),
(13, 'khiem cl', '0327945678', '$2y$12$lxmCQ7JrTCyMl3qtx5L./u4pyUuoE/oSJ.K/qzzb.MIUMSQtGl/rK', 'khiem@12345', NULL, NULL, 'customer', 1, '2026-05-12 04:17:08', '2026-05-12 04:17:08'),
(14, 'Codex Auth Test', '0305131616', '$2y$12$Nckgk8JG3PLLLquDIyp8AuDUgGGM6DBbL1zE2QykczXqvsxD.U6oq', 'codex_auth_0513161615@test.local', NULL, NULL, 'customer', 1, '2026-05-13 09:16:15', '2026-05-13 09:16:15'),
(16, 'Codex Auth Fix', '0805131618', '$2y$12$KMrijPlnRrk/UrEui1MGNOJR.Bz6aLjLP24My4.tqmZH8nAdnImYm', 'codex_auth_fix_0513161823@test.local', NULL, NULL, 'customer', 1, '2026-05-13 09:18:23', '2026-05-13 09:18:23'),
(17, 'Admin Test', 'admin', '$2y$12$TSyBmh3ybpng4sLF6Jx1d.M9hYpSnjTPA8k63s51pUOA/lXJJtyRK', 'admin@test.local', NULL, NULL, 'admin', 1, '2026-05-13 09:20:00', '2026-05-13 10:10:28'),
(18, 'Non Admin', '0517061912', '$2y$12$zcjEFRukxHPzoWbvWCxmh.RbqDmG.Vz9pi85i3LQhyF4aXvyUkhv.', 'nonadmin_170619@test.local', NULL, NULL, 'customer', 1, '2026-05-13 10:06:19', '2026-05-13 10:07:05'),
(19, 'History Test', '0317273011', '$2y$12$ehh48NsyMmjHHwgGzqX70OoXf87WwtjFDACMYlu0aCO8VzcvoIYca', 'history_172730@test.local', NULL, NULL, 'customer', 1, '2026-05-13 10:27:30', '2026-05-13 10:27:30'),
(20, 'History Other', '0317273022', '$2y$12$fIZ8lClAxP4pNCi3WKonUuAihP2rwcymJEgeYOkETskT15ZuLFQIK', 'history_other_172730@test.local', NULL, NULL, 'customer', 1, '2026-05-13 10:27:31', '2026-05-13 10:27:31'),
(21, 'Checkout Test', '0917361133', '$2y$12$jCnnjeqY3M/oOo8xwupfbubfFgYEWMqmVrFHU0MU6prkCf1kxfq4W', 'checkout_173611@test.local', NULL, NULL, 'customer', 1, '2026-05-13 10:36:12', '2026-05-13 10:36:12'),
(22, 'Phone Field Test', '0818024144', '$2y$12$lOemeHD77HNEqs5w2eRC1O3c.7Dc.s00AnhEVMwDjAY3mrmp2iJwi', 'phone_field_180241@test.local', NULL, NULL, 'customer', 1, '2026-05-13 11:02:41', '2026-05-18 03:47:37');

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `receiver_name` varchar(100) NOT NULL,
  `receiver_phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `note` text DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure for view `order_stats`
--
DROP TABLE IF EXISTS `order_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `order_stats`  AS SELECT cast(`orders`.`created_at` as date) AS `order_date`, count(0) AS `total_orders`, sum(`orders`.`total_amount`) AS `daily_revenue`, avg(`orders`.`total_amount`) AS `avg_order_value` FROM `orders` GROUP BY cast(`orders`.`created_at` as date) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indexes for table `favorite_products`
--
ALTER TABLE `favorite_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_status` (`payment_status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);
ALTER TABLE `products` ADD FULLTEXT KEY `ft_title` (`title`,`description`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_default` (`is_default`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `favorite_products`
--
ALTER TABLE `favorite_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `favorite_products`
--
ALTER TABLE `favorite_products`
  ADD CONSTRAINT `fk_favorite_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_favorite_products_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
