-- Migration: admin_users table for authentication
-- Run this AFTER schema.sql

USE kliktemplate;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account (password: admin123)
-- IMPORTANT: Change the password after first login
INSERT INTO admin_users (username, password_hash, display_name)
SELECT 'admin', '$2a$10$8K1p/a0dL1LXMw0GV/sCgeP0XmJnWLHXa7pEKsahBO.CO8cZj8yWi', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');
