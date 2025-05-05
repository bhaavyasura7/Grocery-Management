-- Create and use the database
CREATE DATABASE IF NOT EXISTS grocery_db;
USE grocery_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role ENUM('admin', 'cashier') NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    mobile VARCHAR(20),
    worker_id VARCHAR(50),
    theme_preference ENUM('light', 'dark') DEFAULT 'light',
    theme_color VARCHAR(7) DEFAULT '#015551',
    profile_picture_path VARCHAR(255)
);

-- Insert initial users
INSERT INTO users (username, password, role, name)
VALUES 
    ('admin', 'admin123', 'admin', 'System Admin'),
    ('cashier1', 'cashier123', 'cashier', 'Cashier One'),
    ('cashier2', 'cashier123', 'cashier', 'Cashier Two')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Grocery Items Table
CREATE TABLE IF NOT EXISTS grocery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    threshold INT NOT NULL,
    category VARCHAR(50),
    description TEXT,
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_mobile VARCHAR(20) NOT NULL,
    cashier VARCHAR(50) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi') DEFAULT 'cash',
    status ENUM('completed', 'cancelled', 'refunded') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT,
    item_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES grocery(id)
);

-- Paused Transactions Table
CREATE TABLE IF NOT EXISTS paused_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_mobile VARCHAR(20) NOT NULL,
    cashier VARCHAR(50) NOT NULL,
    cart_data JSON NOT NULL,
    pause_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'resumed', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_buyer_mobile (buyer_mobile),
    INDEX idx_cashier (cashier),
    INDEX idx_status (status)
);

-- Insert sample grocery items
INSERT INTO grocery (name, quantity, price, threshold, category) 
VALUES 
('Apple', 100, 1.99, 10, 'Fruits'),
('Milk', 100, 2.50, 5, 'Dairy'),
('Bread', 30, 1.20, 8, 'Bakery'),
('Eggs', 40, 3.99, 10, 'Dairy'),
('Rice', 100, 5.50, 15, 'Grains'),
('Sugar', 60, 2.80, 10, 'Baking'),
('Salt', 70, 0.99, 5, 'Condiments'),
('Butter', 25, 4.20, 5, 'Dairy'),
('Cheese', 35, 3.75, 8, 'Dairy'),
('Yogurt', 50, 2.99, 6, 'Dairy'),
('Chicken', 20, 6.50, 5, 'Meat'),
('Beef', 15, 8.99, 5, 'Meat'),
('Fish', 25, 7.20, 5, 'Seafood'),
('Tomatoes', 80, 1.50, 10, 'Vegetables'),
('Onions', 90, 1.10, 12, 'Vegetables'),
('Potatoes', 100, 0.80, 15, 'Vegetables'),
('Carrots', 75, 1.30, 10, 'Vegetables'),
('Cabbage', 50, 2.00, 5, 'Vegetables'),
('Lettuce', 40, 1.75, 6, 'Vegetables'),
('Oranges', 60, 2.25, 10, 'Fruits'),
('Bananas', 70, 1.60, 8, 'Fruits'),
('Strawberries', 40, 4.99, 6, 'Fruits'),
('Pineapple', 30, 3.50, 5, 'Fruits'),
('Cucumber', 55, 1.40, 10, 'Vegetables'),
('Garlic', 50, 0.75, 5, 'Vegetables'),
('Ginger', 40, 2.20, 5, 'Vegetables'),
('Coffee', 25, 7.99, 5, 'Beverages'),
('Tea', 30, 4.50, 5, 'Beverages'),
('Biscuits', 60, 2.10, 10, 'Snacks'),
('Juice', 50, 3.00, 6, 'Beverages'),
('Honey', 20, 6.99, 4, 'Condiments'),
('Olive Oil', 15, 9.50, 3, 'Oils'),
('Vegetable Oil', 25, 5.99, 5, 'Oils'),
('Flour', 80, 2.40, 10, 'Baking'),
('Pasta', 70, 1.90, 8, 'Grains'),
('Noodles', 60, 2.30, 7, 'Grains'),
('Cereal', 45, 4.20, 6, 'Breakfast'),
('Peanut Butter', 30, 5.50, 5, 'Spreads'),
('Jam', 35, 3.99, 5, 'Spreads'),
('Ketchup', 25, 2.80, 5, 'Condiments'),
('Mayonnaise', 20, 3.60, 4, 'Condiments'),
('Soya Sauce', 30, 2.50, 5, 'Condiments'),
('Vinegar', 25, 1.99, 5, 'Condiments'),
('Cornflakes', 40, 3.75, 6, 'Breakfast'),
('Chips', 50, 1.50, 8, 'Snacks'),
('Cookies', 55, 2.90, 8, 'Snacks'),
('Ice Cream', 20, 5.25, 5, 'Dairy'),
('Soda', 60, 1.80, 10, 'Beverages'),
('Mineral Water', 100, 0.99, 15, 'Beverages'); 