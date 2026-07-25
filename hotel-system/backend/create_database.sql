-- Create MySQL database for Hotel Management System
CREATE DATABASE IF NOT EXISTS hotel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON hotel_management.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;

USE hotel_management;

-- Show database creation confirmation
SELECT 'Database hotel_management created successfully' AS status;
