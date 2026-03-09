-- Migration: orders system + template_file for products
-- Run this AFTER schema.sql and migration-product-images.sql

USE kliktemplate;

-- Add template_file column to products
ALTER TABLE products ADD COLUMN template_file VARCHAR(500) NULL AFTER image_path;

-- Orders table
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
