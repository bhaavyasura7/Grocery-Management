-- SQL migration to fix transaction ID handling in paused_transactions table

-- Ensure id column is properly set as auto-increment primary key
ALTER TABLE paused_transactions MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- Add index on id for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_id ON paused_transactions(id);

-- Add constraint to ensure transaction IDs are unique
ALTER TABLE paused_transactions
ADD CONSTRAINT unique_transaction_id UNIQUE (id);

-- Add status column to track transaction state
ALTER TABLE paused_transactions
ADD COLUMN IF NOT EXISTS status ENUM('active', 'resumed', 'expired') DEFAULT 'active';

-- Add validation trigger to prevent invalid transaction IDs
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_paused_transaction_insert
BEFORE INSERT ON paused_transactions
FOR EACH ROW
BEGIN
    IF NEW.id < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid transaction ID';
    END IF;
END //
DELIMITER ;

PRINT 'Transaction ID handling improvements applied successfully!';