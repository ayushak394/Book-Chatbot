"""
routes.py

This module defines all RESTful API endpoints for the Uplyft Book Chatbot backend using Flask Blueprints.
It includes functionality for:

- User registration, login, and logout (with JWT-based authentication)
- Product search and retrieval
- Shopping cart management (add/update/remove/clear items)
- Order placement and order history
- Chat message saving and retrieval

All routes that require user context are protected with the `@token_required` decorator,
which validates JWT tokens and extracts the user ID.

"""

from flask import Blueprint, request, jsonify, g
from database import get_db_connection
from auth import token_required
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
import sqlite3

api_bp = Blueprint('api', __name__)

SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
JWT_ALGORITHM = 'HS256'

@api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    try:
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already exists."}), 409
    finally:
        conn.close()

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"message": "Invalid username or password."}), 401

    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm=JWT_ALGORITHM)

    return jsonify({"message": "Login successful!", "token": token, "username": user['username']}), 200

@api_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user_id):
    return jsonify({"message": "Logged out successfully!"}), 200

@api_bp.route('/search', methods=['GET'])
@token_required
def search_products(current_user_id):
    query_text = request.args.get('q', '').lower()
    genre_param = request.args.get('genre', '')
    genres = [g.strip().lower() for g in genre_param.split(',') if g.strip()] if genre_param else []
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    limit = request.args.get('limit', None, type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    sql_query = 'SELECT * FROM products WHERE 1=1'
    params = []

    if query_text:
        keywords = query_text.split()
        if keywords:
            keyword_conditions = []
            for keyword in keywords:
                keyword_conditions.append('(LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(description) LIKE ?)')
                params.extend([f'%{keyword}%', f'%{keyword}%', f'%{keyword}%'])
            sql_query += ' AND (' + ' OR '.join(keyword_conditions) + ')'

    if genres:
        genre_conditions = []
        for g in genres:
            genre_conditions.append('LOWER(genre) LIKE ?')
            params.append(f'%{g}%')
        sql_query += ' AND (' + ' OR '.join(genre_conditions) + ')'

    try:
        if min_price:
            min_price_float = float(min_price)
            sql_query += ' AND price >= ?'
            params.append(min_price_float)

        if max_price:
            max_price_float = float(max_price)
            sql_query += ' AND price <= ?'
            params.append(max_price_float)
    except ValueError:
        conn.close()
        return jsonify({"message": "Invalid price format"}), 400

    sql_query += ' ORDER BY title'

    if limit is not None:
        sql_query += ' LIMIT ?'
        params.append(limit)

    products = cursor.execute(sql_query, tuple(params)).fetchall()
    conn.close()

    if not products:
        return jsonify([]), 200

    return jsonify([dict(row) for row in products]), 200

@api_bp.route('/products', methods=['GET'])
@token_required
def get_products(current_user_id):
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 150, type=int)
    offset = (page - 1) * limit

    conn = get_db_connection()
    products = conn.execute("SELECT * FROM products LIMIT ? OFFSET ?", (limit, offset)).fetchall()
    conn.close()

    return jsonify([dict(row) for row in products]), 200

@api_bp.route('/products/<int:product_id>', methods=['GET'])
@token_required
def get_product_by_id(current_user_id, product_id):
    conn = get_db_connection()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()

    if product:
        return jsonify(dict(product)), 200
    return jsonify({"message": "Product not found"}), 404

@api_bp.route('/cart', methods=['POST'])
@token_required
def add_to_cart(current_user_id):
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    if not product_id or not isinstance(quantity, int) or quantity <= 0:
        return jsonify({"message": "Invalid product ID or quantity."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        product = cursor.execute("SELECT stock FROM products WHERE id = ?", (product_id,)).fetchone()
        if not product:
            return jsonify({"message": "Product not found."}), 404
        
        current_stock = product['stock']

        cart_item = cursor.execute("SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
                                   (current_user_id, product_id)).fetchone()

        if cart_item:
            new_quantity = cart_item['quantity'] + quantity
            if new_quantity > current_stock:
                return jsonify({"message": f"Not enough stock. Available: {current_stock}"}), 400
            cursor.execute("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?",
                           (new_quantity, current_user_id, product_id))
            conn.commit()
            return jsonify({"message": "Product quantity updated in cart."}), 200
        else:
            if quantity > current_stock:
                return jsonify({"message": f"Not enough stock. Available: {current_stock}"}), 400
            cursor.execute("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
                           (current_user_id, product_id, quantity))
            conn.commit()
            return jsonify({"message": "Product added to cart successfully!"}), 201
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@api_bp.route('/cart', methods=['GET'])
@token_required
def view_cart(current_user_id):
    conn = get_db_connection()
    cart_items = conn.execute(
        """
        SELECT ci.product_id, ci.quantity, p.title, p.price, p.image_url, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
        """, (current_user_id,)).fetchall()
    conn.close()

    return jsonify({"items": [dict(item) for item in cart_items]}), 200

@api_bp.route('/cart/<int:product_id>', methods=['PUT'])
@token_required
def update_cart_item(current_user_id, product_id):
    data = request.get_json()
    quantity = data.get('quantity')

    if not isinstance(quantity, int) or quantity < 0:
        return jsonify({"message": "Quantity must be a non-negative integer."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        product = cursor.execute("SELECT stock FROM products WHERE id = ?", (product_id,)).fetchone()
        if not product:
            return jsonify({"message": "Product not found."}), 404
        
        current_stock = product['stock']

        if quantity == 0:
            cursor.execute("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
                           (current_user_id, product_id))
            conn.commit()
            return jsonify({"message": "Product removed from cart."}), 200
        else:
            if quantity > current_stock:
                return jsonify({"message": f"Not enough stock. Available: {current_stock}"}), 400
            
            cursor.execute("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?",
                           (quantity, current_user_id, product_id))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"message": "Item not found in cart for this user."}), 404
            return jsonify({"message": "Cart item quantity updated."}), 200
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@api_bp.route('/cart/<int:product_id>', methods=['DELETE'])
@token_required
def remove_from_cart(current_user_id, product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
                       (current_user_id, product_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"message": "Item not found in cart for this user."}), 404
        return jsonify({"message": "Product removed from cart."}), 200
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@api_bp.route('/cart', methods=['DELETE'])
@token_required
def clear_cart(current_user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM cart_items WHERE user_id = ?", (current_user_id,))
        conn.commit()
        return jsonify({"message": "Cart cleared successfully!"}), 200
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@api_bp.route('/orders', methods=['POST'])
@token_required
def place_order(current_user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    total_amount = 0

    try:
        cart_items = cursor.execute(
            """
            SELECT ci.product_id, ci.quantity, p.price, p.stock
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
            """, (current_user_id,)
        ).fetchall()

        if not cart_items:
            return jsonify({"message": "Your cart is empty. Nothing to order."}), 400

        for item in cart_items:
            if item['quantity'] > item['stock']:
                conn.rollback()
                return jsonify({"message": f"Not enough stock for product ID {item['product_id']}. Available: {item['stock']}"}), 400
            total_amount += item['quantity'] * item['price']

        cursor.execute(
            "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)",
            (current_user_id, total_amount, 'pending')
        )
        order_id = cursor.lastrowid

        for item in cart_items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
                (order_id, item['product_id'], item['quantity'], item['price'])
            )
            cursor.execute(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                (item['quantity'], item['product_id'])
            )

        cursor.execute("DELETE FROM cart_items WHERE user_id = ?", (current_user_id,))

        conn.commit()
        return jsonify({"message": "Order placed successfully!", "order_id": order_id, "total_amount": total_amount}), 201

    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"message": f"Failed to place order due to database error: {str(e)}"}), 500
    finally:
        conn.close()


@api_bp.route('/orders', methods=['GET'])
@token_required
def get_user_orders(current_user_id):
    conn = get_db_connection()
    try:
        orders = conn.execute(
            """
            SELECT id, order_date, total_amount, status
            FROM orders
            WHERE user_id = ?
            ORDER BY order_date DESC
            """, (current_user_id,)
        ).fetchall()

        orders_list = []
        for order in orders:
            order_details = dict(order)
            items = conn.execute(
                """
                SELECT oi.quantity, oi.price_at_purchase, p.title, p.author, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
                """, (order['id'],)
            ).fetchall()
            order_details['items'] = [dict(item) for item in items]
            orders_list.append(order_details)

        return jsonify(orders_list), 200
    except sqlite3.Error as e:
        return jsonify({"message": f"Database error fetching orders: {str(e)}"}), 500
    finally:
        conn.close()

@api_bp.route('/messages', methods=['GET', 'POST'])
@token_required
def handle_messages(current_user_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.get_json()
        sender = data.get('sender')
        text = data.get('text')
        timestamp_str = data.get('timestamp')

        if not sender or not text or not timestamp_str:
            conn.close()
            return jsonify({"message": "Missing sender, text, or timestamp"}), 400

        try:
            cursor.execute(
                "INSERT INTO messages (user_id, sender, text, timestamp) VALUES (?, ?, ?, ?)",
                (current_user_id, sender, text, timestamp_str)
            )
            conn.commit()
            return jsonify({"message": "Message saved successfully"}), 201
        except Exception as e:
            conn.rollback()
            print(f"Error saving message: {str(e)}")
            return jsonify({"message": f"Error saving message: {str(e)}"}), 500
        finally:
            conn.close()

    elif request.method == 'GET':
        try:
            messages = conn.execute(
                "SELECT sender, text, timestamp FROM messages WHERE user_id = ? ORDER BY timestamp ASC",
                (current_user_id,)
            ).fetchall()
            conn.close()
            messages_list = [dict(row) for row in messages]
            return jsonify(messages_list), 200
        except Exception as e:
            conn.close()
            print(f"Error fetching messages: {str(e)}")
            return jsonify({"message": f"Error fetching messages: {str(e)}"}), 500