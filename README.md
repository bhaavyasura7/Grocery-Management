# Grocery Management System

A comprehensive web-based grocery management system built with Python and MySQL, featuring inventory management, cashier operations, and transaction handling capabilities.

## Features

### Admin Dashboard
- Inventory Management
- Cashier Management
- Sales Analytics
- Transaction History

### Cashier Dashboard
- Point of Sale (POS) System
- Transaction Management
- Customer Information Handling
- Bill Generation
- Pause/Resume Transaction Feature

### Security
- User Authentication
- Role-based Access Control
- Session Management

## Tech Stack

- **Backend**: Python
- **Database**: MySQL
- **Frontend**: HTML, CSS, JavaScript
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome
- **Additional Libraries**:
  - jQuery
  - Animate.css
  - Google Fonts (Poppins)

## Prerequisites

- Python 3.x
- MySQL Server
- Web Browser (Chrome/Firefox/Safari)

## Installation

1. Clone or download the project files to your local directory.

2. Set up the MySQL database:
   - First, manually create a new database named `grocery_db` in your MySQL server:
     ```sql
     CREATE DATABASE grocery_db;
     ```
    - Replace `path/to/your/database_dump.sql` with the actual path to your downloaded SQL dump file, e.g., `C:\Downloads\schema.sql` or `./database/schema.sql` if it's in the project

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   Required packages include Flask, MySQL Connector, Werkzeug, and other dependencies listed in requirements.txt.

4. Configure the database connection:
   - Open `grocery_management/forsql.py`
   - Update the database connection parameters with your MySQL credentials:
     ```python
     host="localhost"
     user="root"  # Your MySQL username
     password="your_password"  # Your MySQL password
     database="grocery_db"
     ```

5. Create necessary directories:
   - Ensure the following directories exist in the project root:
     - `grocery_management/static/css`
     - `grocery_management/static/js`
     - `grocery_management/templates`

## Usage

1. Start the application:
   ```bash
   python grocery_management/groc.py
   ```

2. Access the application:
   - Open your web browser
   - Navigate to `http://localhost:5000` (the application runs on port 5000 by default)
   - If you cannot access the application:
     - Ensure the server is running (you should see "Running on http://0.0.0.0:5000" in the terminal)
     - Check if port 5000 is available on your system
     - Try accessing through `http://127.0.0.1:5000` if localhost doesn't work
   - Login with your credentials

### Admin Access
- Manage inventory
- Add/remove cashiers
- View sales reports
- Monitor transactions

### Cashier Access
- Process sales
- Manage transactions
- Generate bills
- Handle customer information

## Project Structure

```
WEBmainproj/
├── grocery_management/
│   ├── database/
│   │   └── schema.sql
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   ├── templates/
│   │   ├── mainp.html (Admin Dashboard)
│   │   ├── cashp.html (Cashier Dashboard)
│   │   └── other templates...
│   ├── sql/
│   │   └── migration scripts
│   └── Python modules...
└── README.md
```
## contributors(GitHub accounts)
- bhaavyasura7
- Sreeyatarimela58
- varshithachennamsetti19
- samhitha-b-code
