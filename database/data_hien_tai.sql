-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 05, 2026 at 07:07 PM
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
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('fixed','percent','freeship') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `min_order_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `points_required` int(11) NOT NULL DEFAULT 0,
  `usage_limit` int(11) DEFAULT NULL,
  `redeemed_count` int(11) NOT NULL DEFAULT 0,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `per_user_limit` int(11) NOT NULL DEFAULT 1,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `title`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `points_required`, `usage_limit`, `redeemed_count`, `used_count`, `per_user_limit`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 'GIAM10K', 'Giảm 10.000đ', 'Đổi 100 điểm để nhận mã giảm 10.000đ cho đơn từ 100.000đ', 'fixed', 10000.00, 100000.00, NULL, 100, 1000, 1, 0, 1, '2026-05-28 11:46:16', '2027-05-28 11:46:16', 1, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(2, 'GIAM25K', 'Giảm 25.000đ', 'Đổi 200 điểm để nhận mã giảm 25.000đ cho đơn từ 180.000đ', 'fixed', 25000.00, 180000.00, NULL, 200, 1000, 0, 0, 1, '2026-05-28 11:46:16', '2027-05-28 11:46:16', 1, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(3, 'GIAM10PT', 'Giảm 10%', 'Đổi 300 điểm để nhận mã giảm 10%, tối đa 50.000đ', 'percent', 10.00, 200000.00, 50000.00, 300, 500, 0, 0, 1, '2026-05-28 11:46:16', '2027-05-28 11:46:16', 1, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(4, 'FREESHIP', 'Miễn phí giao hàng', 'Đổi 150 điểm để miễn phí giao hàng cho đơn từ 120.000đ', 'freeship', 0.00, 120000.00, 30000.00, 150, 1000, 0, 0, 1, '2026-05-28 11:46:16', '2027-05-28 11:46:16', 1, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(5, 'WELCOME50K', 'Giảm 50.000đ cho tài khoản mới', 'Mã giảm giá chào mừng, mỗi tài khoản khách hàng nhận 1 lần.', 'fixed', 50000.00, 0.00, NULL, 0, NULL, 0, 1, 1, NULL, NULL, 1, '2026-05-28 08:36:36', '2026-06-05 17:05:14');

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

--
-- Dumping data for table `favorite_products`
--

INSERT INTO `favorite_products` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(9, 7, 1, '2026-06-04 14:31:13'),
(10, 7, 3, '2026-06-04 14:36:50'),
(11, 7, 4, '2026-06-04 14:36:54'),
(12, 7, 7, '2026-06-04 14:36:57');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL CHECK (`total_amount` >= 0),
  `shipping_fee` decimal(10,2) DEFAULT 30000.00,
  `coupon_id` int(11) DEFAULT NULL,
  `coupon_code` varchar(50) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `points_earned` int(11) NOT NULL DEFAULT 0,
  `points_used` int(11) NOT NULL DEFAULT 0,
  `final_amount` decimal(10,2) DEFAULT NULL,
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

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `shipping_fee`, `coupon_id`, `coupon_code`, `discount_amount`, `points_earned`, `points_used`, `final_amount`, `delivery_type`, `delivery_date`, `delivery_time`, `customer_name`, `customer_phone`, `customer_address`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 500000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', NULL, NULL, 'Vương Vy', '0901234567', '123 Nguyễn Hữu Cầu, Q1, TPHCM', NULL, 'pending', '2026-05-06 19:42:11', '2026-05-06 19:42:11'),
(2, 19, 230000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-13', NULL, 'History Test', '0317273011', '123 Test Street', 'history flow test', 'cancelled', '2026-05-13 10:27:31', '2026-05-13 10:27:31'),
(3, 21, 610000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-13', 'asap', 'Checkout Test', '0917361133', '123 Checkout Street', 'checkout flow test', 'pending', '2026-05-13 10:36:12', '2026-05-13 10:36:12'),
(4, 22, 230000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-13', NULL, 'Phone Field Test', '0818024144', '123 Test', '', 'pending', '2026-05-13 11:02:41', '2026-05-13 11:02:41'),
(5, 22, 230000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-13', NULL, 'Alias Phone Test', '0818024144', '123 Test', '', 'pending', '2026-05-13 11:02:51', '2026-05-13 11:02:51'),
(6, 5, 90000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-13', NULL, 'vuong vii', '0327954569', '12132', '123243', 'pending', '2026-05-13 11:04:35', '2026-05-13 11:04:35'),
(7, 5, 230000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'dâd', '23132', 'cancelled', '2026-05-14 04:19:36', '2026-05-14 06:27:14'),
(8, 7, 180000.00, 0.00, NULL, NULL, 0.00, 0, 0, NULL, 'pickup', '2026-05-14', 'asap', 'toibingu', '0327954568', '123', '1321321', 'pending', '2026-05-14 07:18:09', '2026-05-14 07:18:09'),
(9, 5, 750000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', 'skjds0bfskdfkj', 'pending', '2026-05-14 07:39:38', '2026-05-14 07:39:38'),
(10, 5, 750000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '12123', 'ê324', 'pending', '2026-05-14 07:41:06', '2026-05-14 07:41:06'),
(11, 5, 750000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', '2113221', 'pending', '2026-05-14 07:46:32', '2026-05-14 07:46:32'),
(12, 5, 210000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', 'ffsdfsdf', 'pending', '2026-05-14 07:48:05', '2026-05-14 07:48:05'),
(13, 5, 210000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'ghghgghhgh', 'bbghhgg', 'pending', '2026-05-14 07:54:09', '2026-05-14 07:54:09'),
(14, 5, 390000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'fdsfdfd', 'sfdgfgfd', 'pending', '2026-05-14 07:55:50', '2026-05-14 07:55:50'),
(15, 5, 390000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', '1324324', 'xsdfsdfsd', 'pending', '2026-05-14 07:57:35', '2026-05-14 07:57:35'),
(16, 5, 210000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'ưeqưewqe', 'sdfsdfds', 'delivered', '2026-05-14 08:00:58', '2026-05-14 08:09:57'),
(17, 5, 210000.00, 30000.00, NULL, NULL, 0.00, 0, 0, NULL, 'delivery', '2026-05-14', 'asap', 'vi fd', '0327954564', 'csdfdfsd', 'fdfsdfsd', 'shipping', '2026-05-14 08:01:23', '2026-05-14 08:09:51'),
(18, 7, 130000.00, 0.00, 5, 'WELCOME50K-U7', 50000.00, 13, 0, 130000.00, 'pickup', '2026-05-28', 'pickup', 'toibingu', '0327954568', 'u8-i82, khu đô thị đô nghĩa, phường yên nghĩa, thành phố hà nội', '', 'pending', '2026-05-28 10:35:18', '2026-05-28 10:35:18'),
(19, 7, 180000.00, 0.00, NULL, NULL, 0.00, 18, 0, 180000.00, 'pickup', '2026-05-28', 'pickup', 'toibingu', '0327954568', 'U8-I82, khu đô thị Đô Nghĩa, Phường Yên Nghĩa, thành phố Hà Nội', '', 'pending', '2026-05-28 10:50:24', '2026-05-28 10:50:24'),
(20, 7, 180000.00, 0.00, NULL, NULL, 0.00, 18, 0, 180000.00, 'pickup', '2026-05-28', 'pickup', 'toibingu', '0327954568', 'U8-I82, khu đô thị Đô Nghĩa, Phường Yên Nghĩa, thành phố Hà Nội', '', 'pending', '2026-05-28 10:58:53', '2026-05-28 10:58:53'),
(21, 7, 225000.00, 25000.00, NULL, NULL, 0.00, 22, 0, 225000.00, 'delivery', '2026-05-28', 'asap', 'toibingu', '0327954568', '123, Yên Nghĩa, Hà Nội', '', 'delivered', '2026-05-28 11:00:51', '2026-06-04 20:39:40'),
(22, 7, 405000.00, 25000.00, NULL, NULL, 0.00, 40, 0, 405000.00, 'delivery', '2026-05-28', 'asap', 'toibingu', '0327954568', '123, Yên Nghĩa, Hà Nội', '', 'delivered', '2026-05-28 11:02:14', '2026-06-04 18:18:52');

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
(22, 17, 3, 1, 180000.00, '', '2026-05-14 08:01:23'),
(23, 18, 3, 1, 180000.00, '', '2026-05-28 10:35:18'),
(24, 19, 2, 1, 180000.00, '', '2026-05-28 10:50:24'),
(25, 20, 3, 1, 180000.00, '', '2026-05-28 10:58:53'),
(26, 21, 1, 1, 200000.00, '', '2026-05-28 11:00:51'),
(27, 22, 1, 1, 200000.00, '', '2026-05-28 11:02:14'),
(28, 22, 2, 1, 180000.00, '', '2026-05-28 11:02:14');

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
(14, 17, 210000.00, 'COD', 'pending', NULL, '2026-05-14 08:01:23', '2026-05-14 08:01:23'),
(15, 18, 130000.00, 'COD', 'pending', NULL, '2026-05-28 10:35:18', '2026-05-28 10:35:18'),
(16, 19, 180000.00, 'COD', 'pending', NULL, '2026-05-28 10:50:24', '2026-05-28 10:50:24'),
(17, 20, 180000.00, 'COD', 'pending', NULL, '2026-05-28 10:58:53', '2026-05-28 10:58:53'),
(18, 21, 225000.00, 'COD', 'pending', NULL, '2026-05-28 11:00:51', '2026-05-28 11:00:51'),
(19, 22, 405000.00, 'COD', 'pending', NULL, '2026-05-28 11:02:14', '2026-05-28 11:02:14');

-- --------------------------------------------------------

--
-- Table structure for table `point_transactions`
--

CREATE TABLE `point_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `points` int(11) NOT NULL,
  `type` enum('earn','redeem','refund','adjust') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `point_transactions`
--

INSERT INTO `point_transactions` (`id`, `user_id`, `order_id`, `points`, `type`, `description`, `created_at`) VALUES
(1, 7, 18, 13, 'earn', 'Cộng điểm từ đơn hàng #18', '2026-05-28 10:35:18'),
(2, 7, 19, 18, 'earn', 'Cộng điểm từ đơn hàng #19', '2026-05-28 10:50:24'),
(3, 7, 20, 18, 'earn', 'Cộng điểm từ đơn hàng #20', '2026-05-28 10:58:53'),
(4, 7, 21, 22, 'earn', 'Cộng điểm từ đơn hàng #21', '2026-05-28 11:00:51'),
(5, 7, 22, 40, 'earn', 'Cộng điểm từ đơn hàng #22', '2026-05-28 11:02:14'),
(6, 5, NULL, -100, 'redeem', 'Đổi điểm lấy mã giảm giá GIAM10K', '2026-05-29 02:30:16');

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
  `meal_tags` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `title`, `description`, `price`, `image_url`, `stock`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Nấm đùi gà xào cháy tỏi', 'Nấm đùi gà giòn ngọt được xào cùng tỏi thơm lừng, tạo hương vị đậm đà hấp dẫn.', 75000.00, './assets/img/products/nam-dui-ga-chay-toi.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(2, 1, 'Rau xào ngũ sắc', 'Món rau xào tổng hợp với nhiều loại rau củ tươi ngon, giữ nguyên vị ngọt tự nhiên và màu sắc bắt mắt.', 65000.00, './assets/img/products/rau-xao-ngu-sac.png', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(3, 1, 'Bánh lava phô mai nướng', 'Bánh nướng giòn tan bên ngoài, nhân phô mai chảy mềm mịn, béo ngậy và thơm lừng khi cắn vào.', 55000.00, './assets/img/products/banh_lava_pho_mai_nuong.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(4, 3, 'Set lẩu thái Tomyum', 'Lẩu Thái Tomyum chua cay đặc trưng, kết hợp hải sản tươi sống và rau củ phong phú, chuẩn vị Thái Lan.', 329000.00, './assets/img/products/lau_thai.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(5, 1, 'Cơm chiên cua', 'Cơm chiên vàng óng, hạt tơi đều, hòa quyện cùng thịt cua tươi và trứng thơm béo hấp dẫn.', 95000.00, './assets/img/products/com_chien_cua.png', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(6, 1, 'Súp bào ngư hải sâm (1 phần)', 'Súp cao cấp kết hợp bào ngư, hải sâm và nấm đông cô, bổ dưỡng và sang trọng, rất tốt cho sức khỏe.', 180000.00, './assets/img/products/sup-bao-ngu-hai-sam.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(7, 1, 'Tai cuộn lưỡi', 'Tai heo và lưỡi heo được luộc chín, thái mỏng cuộn lại cùng gia vị, tạo nên món ăn giòn sần sật, đậm vị.', 120000.00, './assets/img/products/tai-cuon-luoi.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(8, 1, 'Xíu mại tôm thịt 10 viên', 'Món dimsum truyền thống với nhân tôm thịt tươi, gói trong lớp bột mỏng và hấp chín mềm, thơm phức.', 95000.00, './assets/img/products/xiu_mai_tom_thit_10_vien.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(9, 6, 'Trà phô mai kem sữa', 'Trà đậm đà kết hợp lớp kem phô mai béo mịn, ngọt nhẹ và mặn mà, tạo cảm giác khó quên.', 39000.00, './assets/img/products/tra-pho-mai-kem-sua.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(10, 6, 'Trà đào chanh sả', 'Trà đào thanh mát kết hợp chanh và sả thơm dịu, mang đến cảm giác sảng khoái tức thì.', 35000.00, './assets/img/products/tra-dao-chanh-sa.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(11, 5, 'Bánh chuối nướng', 'Bánh chuối thơm lừng, nướng vàng mặt, bên trong mềm mịn và ngọt dịu tự nhiên của chuối chín.', 35000.00, './assets/img/products/banh-chuoi-nuong.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(12, 1, 'Há cảo sò điệp (10 viên)', 'Há cảo hấp nhân sò điệp tươi ngon, vỏ bánh trong suốt, dai nhẹ, vị ngọt thanh hấp dẫn.', 110000.00, './assets/img/products/ha_cao.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(13, 1, 'Nạc nọng heo nướng kèm xôi trắng (500gr)', 'Nọng heo - phần thịt ngon nhất trên thủ heo, với những dải thịt nạc mỡ đan xen, mỗi thủ chỉ có được 1-2kg thịt nọng ngon mềm như vậy.', 230000.00, './assets/img/products/nac-nong-heo-nuong-kem-xoi-trang.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(14, 1, 'Nộm gà Hội An (1 phần)', 'Gà xé trộn cùng bắp cải, hành tây, rau răm và nước mắm chua ngọt, tạo nên hương vị thanh nhẹ và hấp dẫn.', 69000.00, './assets/img/products/nom_ga_hoi_an.png', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(15, 1, 'Set bún cá (1 set 5 bát)', 'Bún cá tươi ngon, nước dùng thanh ngọt, ăn kèm rau sống và ớt tươi đúng chuẩn hương vị truyền thống.', 175000.00, './assets/img/products/set_bun_ca.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(16, 5, 'Chè hương cốm lá dứa', 'Chè cốm hương lá dứa dẻo thơm, ngọt dịu, từng hạt cốm thoảng thoảng đâu đó hương lá dứa mát lành', 30000.00, './assets/img/products/che-com-la-dua.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(17, 5, 'Bánh bông lan chanh dây', 'Bánh bông lan chanh dây với vị chua nhẹ, không bị ngọt gắt hẳn sẽ là sự lựa chọn hoàn hảo', 45000.00, './assets/img/products/banh-bong-lan-chanh-day.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(18, 5, 'Chè bưởi', 'Chè bưởi rất dễ ăn bởi hương vị ngọt mát, thơm ngon, vị bùi bùi của đậu xanh, giòn sần sật của cùi bưởi mà không hề bị đắng', 30000.00, './assets/img/products/che-buoi.jpeg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(19, 6, 'Nước ép dâu tây', 'Dâu tây ăn nguyên quả ngon ngọt, có cả quả dôn dốt chua, màu đỏ mọng trông cực yêu.', 45000.00, './assets/img/products/nuoc-ep-dau-tay.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(20, 6, 'Nước lọc', 'Nước lọc', 8000.00, './assets/img/products/lavie-500ml-chai-moi-2.jpg', 999, 1, '2026-05-06 19:42:11', '2026-06-05 15:41:24'),
(21, 1, 'Test Product Updated 170653', 'temp', 12000.00, './assets/img/products/lau_thai.jpg', 999, 0, '2026-05-13 10:06:53', '2026-05-13 10:06:53'),
(22, 1, 'Phở Gà Truyền Thống', 'Phở gà tẩm vị truyền thống với nước dùng ngọt thanh hầm từ xương, thịt gà dai ngon ăn kèm với quẩy và rau thơm, vô cùng hấp dẫn.', 50000.00, './assets/img/products/pho-ga.jpg', 999, 1, '2026-06-05 14:49:08', '2026-06-05 14:49:08'),
(23, 1, 'Phở Bò Đậm Đà', 'Phở bò nổi tiếng với nước cốt bò hầm hương gừng quế hồi, thịt bò mềm dai đậm đà hòa quyện cùng bánh phở mềm. Tuyệt hảo cho mọi bữa ăn.', 55000.00, './assets/img/products/nau-pho-bo-voi-gia-vi-bot-huong-bo-01.jpg', 999, 1, '2026-06-05 14:49:08', '2026-06-05 14:49:08'),
(24, 4, 'Phở cuốn tôm', 'Phở cuốn tôm tươi rực rỡ, rau sống thanh mát cuộn trong lớp bánh phở dai dai, chấm mắm chua cay mặn ngọt cực kỳ bắt miệng. Đây là sự lựa chọn tuyệt vời cho các tín đồ ăn vặt.', 65000.00, './assets/img/products/pho-cuon-tom-2-17124707160002002501368.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:34:13'),
(25, 2, 'Canh bông cải chay', 'Canh bông cải xanh và bông cải trắng được nấu chay thanh mát, bổ dưỡng, kết hợp nước dùng rau củ ngọt nhẹ tự nhiên, đem đến bữa ăn lành mạnh.', 40000.00, './assets/img/products/canh-bong-cai-chay-cac-mon-chay-ngon-de-nau.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:34:13'),
(26, 4, 'Hạt dinh dưỡng tổng hợp', 'Mix các loại hạt dinh dưỡng (óc chó, hạnh nhân, macca,...) giòn tan bùi bùi vô cùng tốt cho sức khoẻ, là món ăn vặt hoặc nhâm nhi khi làm việc lý tưởng.', 85000.00, './assets/img/products/AN141-Nuts-In-Wooden.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:00:23'),
(27, 2, 'Canh nấm hạt sen', 'Hương vị thanh tịnh từ nấm tươi và sự bùi béo từ hạt sen mang tới bát canh chay không chỉ ngon miệng mà còn giúp bồi bổ khí huyết, an thần rất tốt.', 55000.00, './assets/img/products/canh-nam-hat-sen-mon-chay-ngon-de-lam.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:34:13'),
(28, 3, 'Lẩu Thái hải sản chua cay', 'Nồi lẩu Thái chua cay đậm vị, dào dạt hương sả và lá chanh. Nước dùng chua cay tuyệt hảo nhúng kèm hải sản và rau nấm tươi mát cho một bữa tiệc ấm cúng.', 280000.00, './assets/img/products/gan-1-000-nam-truoc-nguoi-mong-co-da-nghi-ra-cach-an-lau-3.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:34:13'),
(29, 4, 'Bánh tráng trộn', 'Món ăn vặt số 1 đường phố! Bánh tráng dai dẻo trộn xoài chua, bò khô, tép mỡ và sốt me đậm đà cay tê hấp dẫn.', 25000.00, './assets/img/products/hq720.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:34:13'),
(30, 2, 'Hủ tiếu chay', 'Tô hủ tiếu chay hấp dẫn với nước ngọt từ nấm và củ quả gọt tươi, thưởng thức cùng đậu hũ non và chả chay siêu nhẹ bụng thanh lọc cơ thể.', 35000.00, './assets/img/products/hu-tieu-chay-cac-mon-chay-ngon-de-lam.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:00:23'),
(31, 3, 'Lẩu sườn sụn nấm thập cẩm', 'Hương vị nước lẩu riêu cua sườn sụn cực đậm đà. Topping phong phú đa dạng hòa quyện tạo nên nồi lẩu hoàn hảo cho cả nhà cùng quây quần bên nhau.', 250000.00, './assets/img/products/mon-lau-ngon-1_9d76bf86981f4c20919bb28c46b42657_grande.jpg', 999, 1, '2026-06-05 15:00:23', '2026-06-05 15:34:13'),
(32, 7, 'Sushi Nhật Bản', 'Sushi thập cẩm tươi ngon, chế biến từ các nguyên liệu tươi sống chọn lọc, cơm dẻo kết hợp và rong biển mang lại chất lượng và hương vị chuẩn Nhật.', 145000.00, './assets/img/products/sushi.jpg', 999, 1, '2026-06-05 15:22:28', '2026-06-05 15:34:13'),
(33, 7, 'Bít tết (Beefsteak)', 'Bít tết bò cao cấp, thịt mềm mọng nước hòa quyện cùng xốt tiêu đen đầm đà, ăn kèm salad và khoai tây múi cau siêu hấp dẫn.', 195000.00, './assets/img/products/bit-tet.webp', 999, 1, '2026-06-05 15:22:28', '2026-06-05 15:34:13');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `is_visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `order_id`, `user_id`, `rating`, `comment`, `images`, `is_visible`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 7, 5, NULL, NULL, 1, '2026-06-04 19:18:25', NULL),
(2, 2, NULL, 7, 5, 'ngon', NULL, 1, '2026-06-04 20:10:41', NULL);

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
(5, 'vi fd', '0327954564', '$2y$12$jrn9BWCUuqFMLUPCADPRjelY5WuWU2akjP2jKJbPtnOX.m990w1Ji', 'vi@gmail.com', NULL, NULL, 'customer', 1, '2026-05-07 09:36:26', '2026-05-29 02:27:24'),
(7, 'toibingu', '0327954568', '$2y$12$Mb1btIu.ix3lZoCFXDQ/1OVHmGw8KbcGGlkeEC.OnAJxNLRBRoyoy', 'toibingu@gmail.com', '123, Yên Nghĩa, Hà Nội', 'uploads/avatars/user_7_1779894636_1da65070.jpg', 'customer', 1, '2026-05-07 09:59:50', '2026-05-28 11:02:14'),
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
-- Table structure for table `user_coupons`
--

CREATE TABLE `user_coupons` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `coupon_code` varchar(80) NOT NULL,
  `source` enum('points_exchange','admin_gift','campaign') NOT NULL DEFAULT 'points_exchange',
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_order_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expired_at` datetime DEFAULT NULL,
  `used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_coupons`
--

INSERT INTO `user_coupons` (`id`, `user_id`, `coupon_id`, `coupon_code`, `source`, `is_used`, `used_order_id`, `created_at`, `expired_at`, `used_at`) VALUES
(1, 7, 5, 'WELCOME50K-U7', 'campaign', 1, 18, '2026-05-28 08:36:36', NULL, '2026-05-28 17:35:18'),
(2, 5, 5, 'WELCOME50K-U5', 'campaign', 0, NULL, '2026-05-29 02:27:16', NULL, NULL),
(3, 5, 1, 'GIAM10K-U5-9071', 'points_exchange', 0, NULL, '2026-05-29 02:30:16', '2027-05-28 11:46:16', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_points`
--

CREATE TABLE `user_points` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `lifetime_points` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_points`
--

INSERT INTO `user_points` (`id`, `user_id`, `points`, `lifetime_points`, `created_at`, `updated_at`) VALUES
(1, 2, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(2, 3, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(3, 5, 100, 200, '2026-05-28 04:46:16', '2026-05-29 02:30:16'),
(4, 7, 311, 311, '2026-05-28 04:46:16', '2026-05-28 11:02:14'),
(5, 8, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(6, 10, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(7, 11, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(8, 12, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(9, 13, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(10, 14, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(11, 16, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(12, 18, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(13, 19, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(14, 20, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(15, 21, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(16, 22, 200, 200, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(17, 1, 0, 0, '2026-05-28 04:46:16', '2026-05-28 04:46:16'),
(18, 17, 0, 0, '2026-05-28 04:46:16', '2026-05-28 04:46:16');

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
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_coupons_code` (`code`);

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
-- Indexes for table `point_transactions`
--
ALTER TABLE `point_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_point_transactions_user` (`user_id`),
  ADD KEY `idx_point_transactions_order` (`order_id`);

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
  ADD UNIQUE KEY `uk_reviews_user_product_order` (`user_id`,`product_id`,`order_id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_reviews_product_visible` (`product_id`,`is_visible`),
  ADD KEY `idx_reviews_order` (`order_id`);

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
-- Indexes for table `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_coupons_code` (`coupon_code`),
  ADD KEY `idx_user_coupons_user` (`user_id`),
  ADD KEY `idx_user_coupons_coupon` (`coupon_id`),
  ADD KEY `fk_user_coupons_order` (`used_order_id`);

--
-- Indexes for table `user_points`
--
ALTER TABLE `user_points`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_points_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `favorite_products`
--
ALTER TABLE `favorite_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `point_transactions`
--
ALTER TABLE `point_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT for table `user_coupons`
--
ALTER TABLE `user_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_points`
--
ALTER TABLE `user_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

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
-- Constraints for table `point_transactions`
--
ALTER TABLE `point_transactions`
  ADD CONSTRAINT `fk_point_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_point_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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

--
-- Constraints for table `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD CONSTRAINT `fk_user_coupons_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_coupons_order` FOREIGN KEY (`used_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_user_coupons_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_points`
--
ALTER TABLE `user_points`
  ADD CONSTRAINT `fk_user_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
