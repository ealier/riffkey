-- RiiFKey / YANKI — схема MySQL для XAMPP (phpMyAdmin → Импорт)
-- 1. Запустите Apache и MySQL в XAMPP
-- 2. Откройте http://localhost/phpmyadmin
-- 3. Вкладка «Импорт» → выберите этот файл → Выполнить

CREATE DATABASE IF NOT EXISTS `riffkey`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `riffkey`;

-- Пользователи
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL DEFAULT '',
  `login` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL DEFAULT '',
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `bonus_points` INT NOT NULL DEFAULT 0,
  `club_member` TINYINT(1) NOT NULL DEFAULT 0,
  `club_card_number` VARCHAR(32) NOT NULL DEFAULT '',
  `avatar` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_login` (`login`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Товары
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `brand` VARCHAR(100) NOT NULL DEFAULT 'YANKI',
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `old_price` DECIMAL(12, 2) NULL DEFAULT NULL,
  `discount` INT NULL DEFAULT NULL,
  `image` TEXT NOT NULL,
  `images` JSON NOT NULL,
  `badge` VARCHAR(20) NULL DEFAULT NULL,
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `colors` JSON NOT NULL,
  `sizes` JSON NOT NULL,
  `description` TEXT NOT NULL,
  `rating` DECIMAL(3, 1) NULL DEFAULT NULL,
  `reviews_count` INT NULL DEFAULT NULL,
  `in_stock` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Заказы
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL,
  `type` VARCHAR(32) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `user_email` VARCHAR(255) NOT NULL,
  `customer` JSON NOT NULL,
  `delivery` JSON NOT NULL,
  `totals` JSON NOT NULL,
  `payment` JSON NOT NULL,
  `items` JSON NOT NULL,
  `loyalty_applied` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_email` (`user_email`),
  KEY `idx_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Коды подтверждения email (регистрация, смена пароля)
CREATE TABLE IF NOT EXISTS `pending_email_verifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `flow` VARCHAR(50) NOT NULL DEFAULT 'register',
  `code_hash` VARCHAR(64) NOT NULL,
  `expires_at` BIGINT NOT NULL,
  `resend_available_at` BIGINT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `attempts_left` INT NOT NULL DEFAULT 5,
  `payload` JSON NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pending_email_flow` (`email`, `flow`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Демо-данные (если таблицы пустые)
INSERT INTO `users` (
  `id`, `full_name`, `login`, `email`, `password`, `phone`,
  `is_admin`, `bonus_points`, `club_member`, `club_card_number`, `avatar`
) VALUES (
  1, 'Администратор', 'admin', 'admin@yanki.ru', 'admin123', '',
  1, 0, 0, '', ''
) ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `products` (
  `id`, `name`, `brand`, `price`, `old_price`, `discount`, `image`, `images`,
  `badge`, `category`, `colors`, `sizes`, `description`, `rating`, `reviews_count`, `in_stock`
) VALUES (
  1,
  'Элегантное платье миди',
  'YANKI',
  8990.00,
  12990.00,
  31,
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
  JSON_ARRAY(),
  'sale',
  'Платья',
  JSON_ARRAY('#000000', '#ffffff', '#c4a77d'),
  JSON_ARRAY('XS', 'S', 'M', 'L', 'XL'),
  'Изысканное платье миди длины из премиального материала.',
  4.8,
  124,
  1
) ON DUPLICATE KEY UPDATE `id` = `id`;
