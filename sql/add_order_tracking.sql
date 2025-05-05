-- SQL migration to add order tracking and prevent duplicate paused transactions

-- Add order_id column to paused_transactions table
ALTER TABLE paused_transactions
ADD COLUMN order_id VARCHAR(36) UNIQUE;

-- Create orders table to track all orders
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active'
);

-- Add order_id column to bills table
ALTER TABLE bills
ADD COLUMN order_id VARCHAR(36) UNIQUE,
ADD FOREIGN KEY (order_id) REFERENCES orders(order_id);

-- Add foreign key constraint to paused_transactions
ALTER TABLE paused_transactions
ADD FOREIGN KEY (order_id) REFERENCES orders(order_id);

-- Add unique constraint to prevent duplicate paused transactions
ALTER TABLE paused_transactions
ADD CONSTRAINT unique_active_transaction UNIQUE (buyer_mobile, buyer_name, cashier);