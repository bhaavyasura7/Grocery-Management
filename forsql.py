import mysql.connector

def get_db_connection():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",  
        password="050506",
        database="grocery_db"
    )
    return conn

conn = get_db_connection()
cursor = conn.cursor()

# --- Existing Tables ---
cursor.execute('''
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
)''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS grocery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    threshold INT NOT NULL,
    UNIQUE KEY unique_name (name),
    UNIQUE KEY unique_name (name)
)''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    quantity INT,
    total_price DECIMAL(10,2),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES grocery(id)
)''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL
)''')

# --- New Tables for Multi-Item Billing ---
cursor.execute('''
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_mobile VARCHAR(20) NOT NULL,
    cashier VARCHAR(50) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL
)''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT,
    item_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES grocery(id)
)''')

conn.commit()
conn.close()

print("MySQL Database initialized successfully!")
