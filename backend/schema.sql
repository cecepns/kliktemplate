-- Database: kliktemplate
-- Jalankan di MySQL untuk menggunakan database (opsional; tanpa DB app tetap jalan dengan data fallback).

CREATE DATABASE IF NOT EXISTS kliktemplate;
USE kliktemplate;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(12,0) NOT NULL DEFAULT 0,
  original_price DECIMAL(12,0) NOT NULL DEFAULT 0,
  image_path VARCHAR(500) NULL,
  template_file VARCHAR(500) NULL,
  sold_count INT NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

INSERT INTO categories (name, slug) VALUES
('Acc Game', 'acc-game'),
('Fitur Lainnya', 'fitur-lainnya'),
('Home', 'home'),
('Informasi', 'informasi'),
('Kategori Menu', 'kategori-menu'),
('Kostum Checkout', 'kostum-checkout'),
('Kostum Topup', 'kostum-topup'),
('Landing', 'landing')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products (category_id, name, slug, description, price, original_price, image_path, sold_count, is_new, is_featured) VALUES
(2, 'Inject Masal', 'inject-masal', 'Script Inject Voucher Masal Open Api', 50000, 75000, NULL, 8, 1, 0),
(3, 'Paket terbaik 1 Set OMNI BYU ONLY4U CUANKU & CUANMAX', 'paket-omni-byu-cuanku-cuanmax', 'Paket lengkap script premium.', 150000, 250000, NULL, 32, 0, 1),
(6, 'e-Wallet Bebas Nomial', 'e-wallet-bebas-nomial', 'Fitur e-Wallet dengan nominal bebas.', 80000, 100000, NULL, 15, 1, 0);

-- Product images (multiple per product)
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(200) NOT NULL,
  customer_whatsapp VARCHAR(30) NOT NULL,
  amount DECIMAL(12,0) NOT NULL DEFAULT 0,
  status ENUM('pending','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT
);

-- Testimonials (migration)
CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  rating TINYINT UNSIGNED NULL COMMENT '1-5',
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO testimonials (author_name, content, rating, is_visible) VALUES
('Budi', 'Pelayanan cepat dan script berkualitas. Recommended!', 5, 1),
('Ani', 'Template sangat membantu project saya. Terima kasih.', 5, 1);

-- Admin users (authentication)
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
