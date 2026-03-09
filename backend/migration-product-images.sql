-- Migration: product_images table for multiple product images
-- Run this AFTER schema.sql has been applied.

USE kliktemplate;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Migrate existing single image_path from products into product_images
INSERT INTO product_images (product_id, image_path, sort_order)
SELECT id, image_path, 0
FROM products
WHERE image_path IS NOT NULL AND image_path != ''
AND id NOT IN (SELECT product_id FROM product_images);

-- Settings table (if not yet created)
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT
);
