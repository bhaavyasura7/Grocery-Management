-- SQL file to create paused_transactions table

CREATE TABLE IF NOT EXISTS paused_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_mobile VARCHAR(20) NOT NULL,
    cashier VARCHAR(50) NOT NULL,
    cart_data JSON NOT NULL,
    pause_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'resumed', 'expired') DEFAULT 'active',
    INDEX idx_buyer_mobile (buyer_mobile),
    INDEX idx_cashier (cashier),
    INDEX idx_status (status)
);

PRINT 'Paused transactions table created successfully!';