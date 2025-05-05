from flask import Flask, render_template, request, redirect, flash, session, jsonify, send_from_directory
import mysql.connector
import uuid
import hashlib
import random
import string
import json
from datetime import datetime, timedelta
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = "secret"
app.permanent_session_lifetime = timedelta(minutes=30)  # Set session timeout to 30 minutes
print("Templates path:", os.path.join(app.root_path, 'templates')) #help Flask locate the templates directory correctly.

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash('Please log in first.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ---------------------- MySQL Connection ----------------------
def get_db_connection():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="050506",
        database="grocery_db"
    )
    return conn

# ---------------------- SESSION MANAGEMENT HELPERS ----------------------
# def generate_barcode(user_id, worker_id):
#     """Generate a unique barcode for user identification."""
#     # Combine user_id and worker_id with a random string for uniqueness
#     random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
#     barcode_base = f"{user_id}-{worker_id}-{random_str}"
#     # Create a hash of the base string to ensure uniqueness
#     barcode_hash = hashlib.md5(barcode_base.encode()).hexdigest()[:10].upper()
#     return f"GMS-{barcode_hash}"

# ---------------------- LOGIN/LOGOUT ----------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect("/redirect_role")  # We'll create a route to redirect by role
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s", (username, password))
        user = cursor.fetchone()
        
        if user:
            # Store user info in session
            session["user"] = user["username"]
            session["role"] = user["role"]
            session["user_id"] = user["id"]
            
            conn.commit()
            
            flash("Login successful!", "success")
            return redirect("/redirect_role")
        else:
            flash("Invalid credentials. Try again.", "danger")
        
        conn.close()

    return render_template("log.html")


@app.route("/logout")
def logout():
    # Clear the session
    session.clear()
    flash("You have been logged out.", "info")
    return redirect("/login")


@app.route("/redirect_role")
def redirect_role():
    """Redirect the user to the correct dashboard based on role."""
    if "role" not in session:
        return redirect("/login")
    if session["role"] == "admin":
        return redirect("/admin")
    elif session["role"] == "cashier":
        return redirect("/cashier")
    else:
        return redirect("/login")

# ---------------------- SALES DATA API ENDPOINTS ----------------------
@app.route("/api/sales/daily")
def get_daily_sales():
    if "role" not in session or session["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get sales for the last 7 days
    cursor.execute("""
        SELECT DATE(date) as sale_date, SUM(total_amount) as total_sales
        FROM bills
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(date)
        ORDER BY sale_date
    """)
    
    results = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "labels": [result["sale_date"].strftime("%Y-%m-%d") for result in results],
        "data": [float(result["total_sales"]) for result in results]
    })

@app.route("/api/sales/weekly")
def get_weekly_sales():
    if "role" not in session or session["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get sales for the last 4 weeks
    cursor.execute("""
        SELECT 
            YEAR(date) as year,
            WEEK(date) as week,
            SUM(total_amount) as total_sales
        FROM bills
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
        GROUP BY YEAR(date), WEEK(date)
        ORDER BY year, week
    """)
    
    results = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "labels": [f"Week {result['week']}" for result in results],
        "data": [float(result["total_sales"]) for result in results]
    })

@app.route("/api/sales/monthly")
def get_monthly_sales():
    if "role" not in session or session["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get sales for the last 12 months
    cursor.execute("""
        SELECT 
            DATE_FORMAT(date, '%Y-%m') as month,
            SUM(total_amount) as total_sales
        FROM bills
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY month
    """)
    
    results = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "labels": [result["month"] for result in results],
        "data": [float(result["total_sales"]) for result in results]
    })

@app.route("/api/sales/yearly")
def get_yearly_sales():
    if "role" not in session or session["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get sales for all years
    cursor.execute("""
        SELECT 
            YEAR(date) as year,
            SUM(total_amount) as total_sales
        FROM bills
        GROUP BY YEAR(date)
        ORDER BY year
    """)
    
    results = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "labels": [str(result["year"]) for result in results],
        "data": [float(result["total_sales"]) for result in results]
    })

# ---------------------- ADMIN DASHBOARD ----------------------
@app.route("/admin/add_item", methods=["POST"])
def add_item():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    name = request.form.get("name")
    quantity = request.form.get("quantity")
    price = request.form.get("price")
    threshold = request.form.get("threshold")

    if not all([name, quantity, price, threshold]):
        flash("All fields are required", "danger")
        return redirect("/admin/inventory")

    try:
        # Convert to appropriate types and validate
        quantity = int(quantity)
        price = float(price)
        threshold = int(threshold)

        # Validate non-negative values
        if quantity < 0 or price < 0 or threshold < 0:
            flash("Quantity, price, and threshold cannot be negative", "danger")
            return redirect("/admin/inventory")

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if item with same name exists
        cursor.execute("SELECT id FROM grocery WHERE name = %s", (name,))
        existing_item = cursor.fetchone()
        
        if existing_item:
            flash(f"Item with name '{name}' already exists", "danger")
        else:
            cursor.execute("""
                INSERT INTO grocery (name, quantity, price, threshold)
                VALUES (%s, %s, %s, %s)
            """, (name, quantity, price, threshold))
            conn.commit()
            flash("Item added successfully!", "success")
            
        conn.close()
    except ValueError:
        flash("Invalid input: Please enter valid numbers for quantity, price, and threshold", "danger")
    except Exception as e:
        flash(f"Error adding item: {str(e)}", "danger")

    return redirect("/admin/inventory")

def cleanup_old_bill_items():
    """Delete bill_items from previous days to keep the database clean."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Delete bill_items from previous days
        cursor.execute("""
            DELETE bi FROM bill_items bi
            INNER JOIN bills b ON bi.bill_id = b.id
            WHERE DATE(b.date) < CURDATE()
        """)
        conn.commit()
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.route("/admin/add_cashier", methods=["POST"])
def add_cashier():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    username = request.form.get("username")
    password = request.form.get("password")
    worker_id = request.form.get("worker_id")

    if not all([username, password, worker_id]):
        flash("All fields are required", "danger")
        return redirect("/admin/cashiers")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if username already exists
        cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            flash("Username already exists", "danger")
            return redirect("/admin/cashiers")

        # Add new cashier to users table
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, 'cashier')",
            (username, password)
        )
        conn.commit()
        flash("Cashier added successfully", "success")

    except Exception as e:
        flash(f"Error adding cashier: {str(e)}", "danger")
    finally:
        conn.close()

    return redirect("/admin/cashiers")

@app.route("/admin/remove_cashier", methods=["POST"])
def remove_cashier():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    username = request.form.get("username")
    if not username:
        flash("Username is required", "danger")
        return redirect("/admin/cashiers")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Delete the cashier from users table
        cursor.execute("DELETE FROM users WHERE username = %s AND role = 'cashier'", (username,))
        if cursor.rowcount > 0:
            conn.commit()
            flash("Cashier removed successfully", "success")
        else:
            flash("Cashier not found", "danger")

    except Exception as e:
        flash(f"Error removing cashier: {str(e)}", "danger")
    finally:
        conn.close()

    return redirect("/admin/cashiers")

@app.route("/admin")
def admin_dashboard():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Total revenue today (from bills)
    cursor.execute("SELECT IFNULL(SUM(total_amount), 0) AS daily_sales FROM bills WHERE DATE(date) = CURDATE()")
    daily_sales = cursor.fetchone()["daily_sales"]

    # Get today's total transactions
    cursor.execute("SELECT COUNT(*) as total_transactions FROM bills WHERE DATE(date) = CURDATE()")
    total_transactions = cursor.fetchone()["total_transactions"]

    # Get low stock items count
    cursor.execute("SELECT COUNT(*) as low_stock FROM grocery WHERE quantity <= threshold")
    low_stock_count = cursor.fetchone()["low_stock"]

    conn.close()
    return render_template("mainp.html", daily_sales=daily_sales, total_transactions=total_transactions, low_stock_count=low_stock_count)

@app.route("/admin/inventory")
def admin_inventory():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    cleanup_old_bill_items()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    sort_param = request.args.get('sort')
    sort_query = "SELECT * FROM grocery"
    
    if sort_param == 'id_asc':
        sort_query += " ORDER BY id ASC"
    elif sort_param == 'id_desc':
        sort_query += " ORDER BY id DESC"
    elif sort_param == 'name_asc':
        sort_query += " ORDER BY name ASC"
    elif sort_param == 'name_desc':
        sort_query += " ORDER BY name DESC"
    elif sort_param == 'stock_asc':
        sort_query += " ORDER BY quantity ASC"
    elif sort_param == 'stock_desc':
        sort_query += " ORDER BY quantity DESC"
    
    cursor.execute(sort_query)
    inventory = cursor.fetchall()

    search_name = request.args.get('searchName', '').lower()
    if search_name:
        inventory = [item for item in inventory if search_name in item['name'].lower()]

    conn.close()
    return render_template("inventory.html", inventory=inventory)

@app.route("/admin/cashiers")
def admin_cashiers():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT username FROM users WHERE role = 'cashier'")
    cashiers = cursor.fetchall()
    conn.close()

    return render_template("cashiers.html", cashiers=cashiers)

@app.route("/admin/bills")
def admin_bills():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    sort_param = request.args.get('sort')
    query = """
        SELECT b.*, 
               COALESCE(SUM(bi.quantity), 0) as total_items
        FROM bills b
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        WHERE DATE(b.date) = CURDATE()
        GROUP BY b.id
    """
    if sort_param == 'date_asc':
        query += " ORDER BY b.date ASC"
    elif sort_param == 'date_desc':
        query += " ORDER BY b.date DESC"
    cursor.execute(query)
    bills = cursor.fetchall()

    search_bill = request.args.get('searchBill', '').lower()
    if search_bill:
        bills = [bill for bill in bills if search_bill in bill['buyer_name'].lower()]

    conn.close()
    return render_template("bills.html", bills=bills)

# ---------------------- CASHIER DASHBOARD & SALE LOGIC ----------------------
@app.route("/admin/delete_item", methods=["POST"])
def delete_item():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    item_id = request.form.get("item_id")
    if not item_id:
        flash("Item ID is required", "danger")
        return redirect("/admin")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First check if the item exists
        cursor.execute("SELECT name FROM grocery WHERE id = %s", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            flash("Item not found", "danger")
            return redirect("/admin")
        
        # Check if item has any associated bill records
        cursor.execute("SELECT COUNT(*) FROM bill_items WHERE item_id = %s", (item_id,))
        bill_count = cursor.fetchone()[0]
        
        if bill_count > 0:
            flash("Cannot delete item: It has associated bill records. Consider updating the stock to 0 instead.", "danger")
            return redirect("/admin")
            
        # If no associated bills, proceed with deletion
        cursor.execute("DELETE FROM grocery WHERE id = %s", (item_id,))
        conn.commit()
        flash("Item deleted successfully!", "success")
        
    except Exception as e:
        flash(f"Error deleting item: {str(e)}", "danger")
    finally:
        cursor.close()
        conn.close()

    return redirect("/admin")

@app.route("/admin/update_stock", methods=["POST"])
def update_stock():
    if "role" not in session or session["role"] != "admin":
        return redirect("/login")

    item_id = request.form.get("item_id")
    new_quantity = request.form.get("new_quantity")
    new_price = request.form.get("new_price")
    new_threshold = request.form.get("new_threshold")

    if not item_id or not any([new_quantity, new_price, new_threshold]):
        flash("Please enter at least one field to update", "danger")
        return redirect("/admin/inventory")

    try:
        # Convert to appropriate types and validate
        if new_quantity:
            new_quantity = int(new_quantity)
            if new_quantity < 0:
                flash("Quantity cannot be negative", "danger")
                return redirect("/admin/inventory")
        
        if new_price:
            new_price = float(new_price)
            if new_price < 0:
                flash("Price cannot be negative", "danger")
                return redirect("/admin/inventory")
        
        if new_threshold:
            new_threshold = int(new_threshold)
            if new_threshold < 0:
                flash("Threshold cannot be negative", "danger")
                return redirect("/admin/inventory")

        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_fields = []
        params = []
        
        if new_quantity:
            update_fields.append("quantity = %s")
            params.append(new_quantity)
        if new_price:
            update_fields.append("price = %s")
            params.append(new_price)
        if new_threshold:
            update_fields.append("threshold = %s")
            params.append(new_threshold)
            
        params.append(item_id)
        
        query = f"UPDATE grocery SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, tuple(params))

        conn.commit()
        conn.close()
        flash("Item updated successfully!", "success")
    except ValueError:
        flash("Invalid input: Please enter valid numbers for quantity, price, and threshold", "danger")
    except Exception as e:
        flash(f"Error updating item: {str(e)}", "danger")

    return redirect("/admin/inventory")

@app.route("/cashier")
def cashier_dashboard():
    if "role" not in session or session["role"] != "cashier":
        return redirect("/login")

    # Get all grocery items and paused transactions
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM grocery")
    groceries = cursor.fetchall()

    # Fetch paused transactions for the current cashier
    cursor.execute("SELECT * FROM paused_transactions WHERE cashier = %s ORDER BY pause_time DESC", 
                  (session["user"],))
    paused_transactions = cursor.fetchall()

    # Calculate total amount and format pause duration for each transaction
    for transaction in paused_transactions:
        cart_items = json.loads(transaction['cart_data'])
        transaction['total_amount'] = sum(item['quantity'] * item['price'] for item in cart_items)
        
        # Calculate pause duration
        pause_time = transaction['pause_time']
        current_time = datetime.now()
        duration = current_time - pause_time
        
        if duration.days > 0:
            transaction['pause_duration'] = f"{duration.days}d ago"
        elif duration.seconds >= 3600:
            hours = duration.seconds // 3600
            transaction['pause_duration'] = f"{hours}h ago"
        else:
            minutes = (duration.seconds // 60) % 60
            transaction['pause_duration'] = f"{minutes}m ago"

    # Fetch today's transactions for the current cashier
    cursor.execute("SELECT * FROM bills WHERE DATE(date) = CURDATE() AND cashier = %s ORDER BY date DESC", 
                  (session["user"],))
    transactions = cursor.fetchall()
    conn.close()

    # Current cart in session
    cart_items = session.get("cart_items", [])
    buyer_name = session.get("buyer_name", "")
    buyer_mobile = session.get("buyer_mobile", "")

    # Calculate cart total
    cart_total = sum(item["quantity"] * item["price"] for item in cart_items)
    
    # Get today's date for the date filter
    today_date = datetime.now().strftime('%Y-%m-%d')

    return render_template("cashp.html",
                           groceries=groceries,
                           cart_items=cart_items,
                           cart_total=cart_total,
                           buyer_name=buyer_name,
                           buyer_mobile=buyer_mobile,
                           transactions=transactions,
                           paused_transactions=paused_transactions,
                           today_date=today_date)

@app.route("/cashier/add", methods=["POST"])
def add_to_cart():
    if "role" not in session or session["role"] != "cashier":
        return redirect("/login")

    item_id = int(request.form["item_id"])
    quantity = int(request.form["quantity"])

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if item exists and has enough stock
        cursor.execute("SELECT * FROM grocery WHERE id=%s", (item_id,))
        item = cursor.fetchone()

        if not item:
            conn.close()
            flash("Item not found.", "danger")
            return redirect("/cashier")

        if quantity > item["quantity"]:
            conn.close()
            flash("Not enough stock available.", "danger")
            return redirect("/cashier")
        
        # Load cart from session
        cart_items = session.get("cart_items", [])

        # Check if item already in cart
        found = False
        for cart_item in cart_items:
            if cart_item["id"] == item_id:
                cart_item["quantity"] += quantity
                found = True
                break

        # If not in cart, add new entry
        if not found:
            try:
                price = float(item["price"])
            except (ValueError, TypeError):
                # Handle case where price cannot be converted to float
                price = 0.0
                flash("Warning: Item price could not be processed correctly.", "warning")
                
            cart_items.append({
                "id": item["id"],
                "name": item["name"],
                "price": price,
                "quantity": quantity
            })

        session["cart_items"] = cart_items
        flash(f"{item['name']} added to cart!", "success")
        
        # Check if this is an AJAX request
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # Return just the cart HTML for AJAX requests
            return render_template('cart_section.html', cart_items=cart_items, cart_total=sum(item["quantity"] * item["price"] for item in cart_items))
        
        return redirect("/cashier")
        
    except Exception as e:
        flash(f"Error adding item to cart: {str(e)}", "danger")
        return redirect("/cashier")
        
    finally:
        cursor.close()
        conn.close()

@app.route("/cashier/get_todays_transactions")
def get_todays_transactions():
    """API endpoint to get today's transactions for the current cashier."""
    if "role" not in session or session["role"] != "cashier":
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM bills WHERE DATE(date) = CURDATE() AND cashier = %s ORDER BY date DESC", 
                  (session["user"],))
    transactions = cursor.fetchall()
    conn.close()
    
    # Format transactions for JSON response
    formatted_transactions = []
    for transaction in transactions:
        formatted_transactions.append({
            "time": transaction["date"].strftime('%I:%M %p'),
            "buyer_name": transaction["buyer_name"],
            "buyer_mobile": transaction["buyer_mobile"],
            "total_amount": float(transaction["total_amount"])
        })
    
    return jsonify({"transactions": formatted_transactions})


@app.route("/cashier/remove/<int:item_id>", methods=["POST"])
def remove_from_cart(item_id):
    if "role" not in session or session["role"] != "cashier":
        return redirect("/login")

    try:
        cart_items = session.get("cart_items", [])
        # Find the item and remove it from cart
        for item in cart_items:
            if item.get("id") == item_id:
                cart_items.remove(item)
                break

        session["cart_items"] = cart_items
        flash("Item removed from cart.", "info")
        
        # Check if this is an AJAX request
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # Return just the cart HTML for AJAX requests
            return render_template('cart_section.html', cart_items=cart_items, cart_total=sum(item["quantity"] * item["price"] for item in cart_items))
    except Exception as e:
        flash(f"Error removing item from cart: {str(e)}", "danger")
    
    return redirect("/cashier")


@app.route("/cashier/save_customer", methods=["POST"])
def save_customer_info():
    """Save buyer name and mobile in session (before finalizing)."""
    if "role" not in session or session["role"] != "cashier":
        return redirect("/login")

    session["buyer_name"] = request.form["buyer_name"]
    session["buyer_mobile"] = request.form["buyer_mobile"]
    flash("Customer info saved!", "success")
    return redirect("/cashier")


@app.route("/cashier/finalize", methods=["POST"])
@login_required
def finalize_sale():
    if session.get('role') != 'cashier':
        flash('Access denied. Cashier privileges required.', 'danger')
        return redirect(url_for('index'))
    
    try:
        # Get cart data from form data
        cart_data = request.form.get('cart_data')
        if not cart_data:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Cart data is missing'}), 400
            flash('Cart data is missing', 'warning')
            return redirect(url_for('cashier_dashboard'))

        try:
            cart_items = json.loads(cart_data)
        except json.JSONDecodeError:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Invalid cart data format'}), 400
            flash('Invalid cart data format', 'warning')
            return redirect(url_for('cashier_dashboard'))

        if not cart_items:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Cart is empty'}), 400
            flash('Cart is empty', 'warning')
            return redirect(url_for('cashier_dashboard'))

        # Get customer details
        buyer_name = request.form.get('buyer_name')
        buyer_mobile = request.form.get('buyer_mobile')
        
        if not buyer_name or not buyer_mobile:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Please provide customer details'}), 400
            flash('Please provide customer details', 'warning')
            return redirect(url_for('cashier_dashboard'))

        # Calculate total amount
        total_amount = round(sum(item['quantity'] * item['price'] for item in cart_items), 2)

        # Start transaction
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Start transaction
            conn.start_transaction()
            
            # First update inventory for all items
            for item in cart_items:
                # Lock the row for update to prevent race conditions
                cursor.execute("SELECT quantity FROM grocery WHERE id = %s FOR UPDATE", (item['id'],))
                current_stock = cursor.fetchone()
                
                if not current_stock:
                    conn.rollback()
                    raise ValueError(f"Item with ID {item['id']} not found")
                
                if current_stock['quantity'] < item['quantity']:
                    conn.rollback()
                    raise ValueError(f"Insufficient stock for item ID {item['id']}")
                
                # Update inventory
                cursor.execute("UPDATE grocery SET quantity = quantity - %s WHERE id = %s", 
                             (item['quantity'], item['id']))

            # Insert into bills table
            cursor.execute('''
                INSERT INTO bills (buyer_name, buyer_mobile, total_amount, cashier)
                VALUES (%s, %s, %s, %s)
            ''', (buyer_name, buyer_mobile, total_amount, session['user']))
            
            bill_id = cursor.lastrowid

            # Insert bill items
            for item in cart_items:
                # Validate item data
                if not isinstance(item, dict) or 'id' not in item or 'quantity' not in item or 'price' not in item:
                    raise ValueError('Invalid item data format')
                
                item_id = int(item['id'])
                quantity = int(item['quantity'])
                price = float(item['price'])
                
                if item_id <= 0 or quantity <= 0 or price <= 0:
                    raise ValueError('Invalid item values')

                # Insert bill item
                cursor.execute('''
                    INSERT INTO bill_items (bill_id, item_id, quantity, unit_price)
                    VALUES (%s, %s, %s, %s)
                ''', (bill_id, item_id, quantity, price))

            conn.commit()
            
            # Clear cart and customer info from session
            session.pop('cart_items', None)
            session.pop('buyer_name', None)
            session.pop('buyer_mobile', None)

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({
                    'success': True,
                    'message': 'Bill generated successfully!'
                })
            
            flash('Bill generated successfully!', 'success')
            return redirect(url_for('cashier_dashboard'))
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': str(e)}), 500
        flash(f'Error generating bill: {str(e)}', 'danger')
        return redirect(url_for('cashier_dashboard'))

@app.route("/cashier/new_transaction", methods=["POST"])
def new_transaction():
    """Clear cart and customer data to start fresh."""
    if "role" not in session or session["role"] != "cashier":
        return redirect("/login")
    session["cart_items"] = []
    session["buyer_name"] = ""
    session["buyer_mobile"] = ""
    flash("New transaction started!", "info")
    return redirect("/cashier")

# ---------------------- RUN APP ----------------------
# ---------------------- PROFILE MANAGEMENT ----------------------
@app.route("/profile")
def profile():
    """Display user profile page."""
    if "user" not in session:
        return redirect("/login")
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s", (session["user"],))
    user_data = cursor.fetchone()
    conn.close()
    
    if not user_data:
        flash("User data not found", "danger")
        return redirect("/redirect_role")
    
    return render_template("profile.html", current_user=user_data)

@app.route("/update_profile", methods=["POST"])
def update_profile():
    """Update user profile information."""
    if "user" not in session:
        return redirect("/login")
    
    name = request.form.get("name")
    email = request.form.get("email")
    mobile = request.form.get("mobile")
    worker_id = request.form.get("worker_id")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET name = %s, email = %s, mobile = %s, worker_id = %s 
            WHERE username = %s
        """, (name, email, mobile, worker_id, session["user"]))
        
        conn.commit()
        conn.close()
        
        flash("Profile updated successfully", "success")
    except Exception as e:
        flash(f"Error updating profile: {str(e)}", "danger")
    
    return redirect("/profile")

@app.route("/change_password", methods=["POST"])
def change_password():
    """Change user password."""
    if "user" not in session:
        return redirect("/login")
    
    current_password = request.form.get("currentPassword")
    new_password = request.form.get("newPassword")
    confirm_password = request.form.get("confirmPassword")
    
    if not all([current_password, new_password, confirm_password]):
        flash("All password fields are required", "danger")
        return redirect("/profile")
    
    if new_password != confirm_password:
        flash("New password and confirmation do not match", "danger")
        return redirect("/profile")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify current password
        cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", 
                      (session["user"], current_password))
        user = cursor.fetchone()
        
        if not user:
            flash("Current password is incorrect", "danger")
            conn.close()
            return redirect("/profile")
        
        # Update password
        cursor.execute("UPDATE users SET password = %s WHERE username = %s", 
                      (new_password, session["user"]))
        
        conn.commit()
        conn.close()
        
        flash("Password changed successfully", "success")
    except Exception as e:
        flash(f"Error changing password: {str(e)}", "danger")
    
    return redirect("/profile")

@app.route("/cashier/pause_transaction", methods=["POST"])
def pause_transaction():
    """Pause the current transaction and save it for later."""
    if "role" not in session or session["role"] != "cashier":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    buyer_name = data.get("buyer_name")
    buyer_mobile = data.get("buyer_mobile")
    cart_items = data.get("cart_items")

    if not all([buyer_name, buyer_mobile, cart_items]):
        return jsonify({"success": False, "message": "Missing required data"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if transaction already exists for this buyer
        cursor.execute("""
            SELECT id FROM paused_transactions 
            WHERE buyer_mobile = %s AND buyer_name = %s AND status = 'active'
        """, (buyer_mobile, buyer_name))
        existing_transaction = cursor.fetchone()

        # Get item IDs for each cart item
        cart_items_with_ids = []
        for item in cart_items:
            cursor.execute("SELECT id FROM grocery WHERE name = %s", (item["name"],))
            result = cursor.fetchone()
            if result:
                item["id"] = result["id"]
                cart_items_with_ids.append(item)

        transaction_id = None
        if existing_transaction:
            # Update existing transaction
            cursor.execute("""
                UPDATE paused_transactions 
                SET cart_data = %s, pause_time = NOW()
                WHERE id = %s AND status = 'active'
            """, (json.dumps(cart_items_with_ids), existing_transaction['id']))
            transaction_id = existing_transaction['id']
        else:
            # Insert new transaction
            cursor.execute("""
                INSERT INTO paused_transactions 
                (buyer_name, buyer_mobile, cashier, cart_data, pause_time, status)
                VALUES (%s, %s, %s, %s, NOW(), 'active')
            """, (buyer_name, buyer_mobile, session["user"], json.dumps(cart_items_with_ids)))
            transaction_id = cursor.lastrowid

        # Clear current cart after successfully saving the paused transaction
        session["cart_items"] = []
        session["buyer_name"] = ""
        session["buyer_mobile"] = ""
        
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Transaction paused successfully",
            "transaction_id": transaction_id
        })

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.close()
        return jsonify({
            "success": False,
            "message": f"Failed to pause transaction: {str(e)}"
        }), 500

@app.route("/cashier/resume_transaction/<int:transaction_id>", methods=["POST"])
def resume_transaction(transaction_id):
    """Resume a previously paused transaction."""
    if "role" not in session or session["role"] != "cashier":
        return jsonify({"success": False, "message": "Unauthorized access"}), 401

    try:
        # Ensure session is active and valid
        session.permanent = True
        if not session.get("user"):
            return jsonify({"success": False, "message": "Session expired. Please login again."}), 401

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Validate transaction ID
        if not transaction_id or not str(transaction_id).isdigit():
            conn.close()
            return jsonify({"success": False, "message": "Invalid transaction ID"}), 400

        # Lock the transaction record for atomic operation
        cursor.execute("SELECT * FROM paused_transactions WHERE id = %s AND status = 'active' FOR UPDATE", (transaction_id,))
        transaction = cursor.fetchone()

        if not transaction:
            conn.close()
            return jsonify({"success": False, "message": "Transaction not found, already resumed, or expired"}), 404

        try:
            # Restore cart data
            cart_data = json.loads(transaction["cart_data"])
            
            # Update session atomically
            session["cart_items"] = cart_data
            session["buyer_name"] = transaction["buyer_name"]
            session["buyer_mobile"] = transaction["buyer_mobile"]
            session.modified = True

            # Delete paused transaction
            cursor.execute("DELETE FROM paused_transactions WHERE id = %s", (transaction_id,))
            conn.commit()

            return jsonify({
                "success": True, 
                "message": "Transaction resumed successfully",
                "redirect_url": "/cashier/transaction_management",
                "buyer_info": {
                    "name": transaction["buyer_name"],
                    "mobile": transaction["buyer_mobile"],
                    "cart_items": cart_data
                }
            })
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    except Exception as e:
        return jsonify({"success": False, "message": f"Error resuming transaction: {str(e)}"}), 500

@app.route("/logout_all_devices", methods=["POST"])
def logout_all_devices():
    """Logout from all devices by invalidating all sessions except the current one."""
    if "user" not in session or "user_id" not in session:
        return jsonify({"success": False, "message": "Not logged in"})
    
    user_id = session["user_id"]
    current_session_token = session.get("session_token")
    
    # Invalidate all other sessions in the database
    success = invalidate_all_sessions(user_id, current_session_token)
    
    if success:
        return jsonify({"success": True, "message": "Logged out from all other devices"})
    else:
        return jsonify({"success": False, "message": "Failed to logout from other devices"})

@app.route("/api/save-theme", methods=["POST"])
def save_theme():
    """Save user theme preferences."""
    if "user" not in session:
        return jsonify({"success": False, "message": "Not logged in"})
    
    data = request.json
    mode = data.get("mode")
    color = data.get("color")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET theme_preference = %s, theme_color = %s 
            WHERE username = %s
        """, (mode, color, session["user"]))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Theme preferences saved"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.route("/")
def index():
    return redirect("/login")

@app.route("/cashier/restore_inventory", methods=["POST"])
def restore_inventory():
    """Restore inventory when a transaction is canceled."""
    if "role" not in session or session["role"] != "cashier":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        data = request.get_json()
        if not data or 'items' not in data:
            return jsonify({"success": False, "message": "No items provided"}), 400

        items = data['items']
        if not items:
            return jsonify({"success": False, "message": "Empty items list"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        for item in items:
            # Validate item data
            if not item.get('id') or not item.get('quantity'):
                continue
                
            # Convert to appropriate types
            item_id = int(item['id'])
            quantity = int(item['quantity'])
            
            # Update grocery stock
            cursor.execute("UPDATE grocery SET quantity = quantity + %s WHERE id = %s", 
                          (quantity, item_id))

        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Inventory restored successfully"})
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.close()
        return jsonify({"success": False, "message": f"Error restoring inventory: {str(e)}"}), 500

@app.route("/cashier/paused_transactions")
def get_paused_transactions():
    """Get all paused transactions for the current cashier."""
    if "role" not in session or session["role"] != "cashier":
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get paused transactions for the current cashier
        cursor.execute("""
            SELECT * FROM paused_transactions 
            WHERE cashier = %s AND status = 'active'
            ORDER BY pause_time DESC
        """, (session["user"],))
        
        transactions = cursor.fetchall()
        
        # Format the transactions for JSON response
        formatted_transactions = []
        for transaction in transactions:
            formatted_transactions.append({
                "id": transaction["id"],
                "buyer_name": transaction["buyer_name"],
                "buyer_mobile": transaction["buyer_mobile"],
                "cart_data": json.loads(transaction["cart_data"]),
                "pause_time": transaction["pause_time"].strftime("%Y-%m-%d %H:%M:%S"),
                "total_amount": sum(item["quantity"] * item["price"] 
                                  for item in json.loads(transaction["cart_data"]))
            })
        
        conn.close()
        return jsonify({"transactions": formatted_transactions})
        
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)