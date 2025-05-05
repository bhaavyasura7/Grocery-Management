-- SQL file to create user_sessions table for managing multiple device logins

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session (user_id, session_token)
);

-- Add session_token field to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255) DEFAULT NULL;

-- Add barcode field to users table for identification
ALTER TABLE users ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) DEFAULT NULL;

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

PRINT 'User sessions table created successfully!';