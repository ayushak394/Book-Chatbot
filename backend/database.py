"""
database.py

This script initializes the SQLite database (`ecommerce.db`) for the Uplyft Book Chatbot project.
It drops the existing database if present, then creates all necessary tables including:
users, products, cart_items, orders, order_items, and messages.

The schema supports:
- User authentication and account storage
- Product catalog with metadata
- Cart and order management
- Message history logging between user and chatbot

"""

import sqlite3
import os

DATABASE_NAME = 'ecommerce.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if os.path.exists(DATABASE_NAME):
        os.remove(DATABASE_NAME)
        print(f"Removed existing database: {DATABASE_NAME}")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );
    ''')
    print("Table 'users' created or already exists.")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT,
            genre TEXT,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            description TEXT,
            image_url TEXT,
            year_published INTEGER,
            isbn TEXT UNIQUE
        );
    ''')
    print("Table 'products' created or already exists.")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id)
        );
    ''')
    print("Table 'cart_items' created or already exists.")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')
    print("Table 'orders' created or already exists.")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_purchase REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        );
    ''')
    print("Table 'order_items' created or already exists.")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("Table 'messages' created or already exists.")


    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialization script finished.")