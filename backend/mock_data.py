"""
mock_data.py

This script generates and inserts mock book data into the `products` table of the SQLite
ecommerce database used by the Uplyft Book Chatbot project.

It uses the Faker library to generate realistic-looking titles, authors, descriptions, and metadata.
The script guarantees that at least one book per major genre is included, in addition to a large
set of randomly generated books.

"""

import sqlite3
from faker import Faker
import random
from database import DATABASE_NAME, get_db_connection

fake = Faker()

def generate_mock_books(num_books=100):
    books = []
    genres = ['Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
              'Non-Fiction', 'Biography', 'History', 'Young Adult', 'Romance', 'Horror']
    for _ in range(num_books):
        title = fake.catch_phrase() + " " + fake.word().capitalize()
        author = fake.name()
        genre = random.choice(genres)
        price = round(random.uniform(9.99, 59.99), 2)
        stock = random.randint(0, 200)
        description = fake.paragraph(nb_sentences=3)
        image_url = f"https://via.placeholder.com/150/0000FF/FFFFFF?text={title.replace(' ', '+')[:10]}"
        year_published = random.randint(1950, 2023)
        isbn = fake.isbn13()

        books.append((title, author, genre, price, stock, description, image_url, year_published, isbn))
    return books

def populate_db_with_mock_data(num_books=100):
    conn = get_db_connection()
    cursor = conn.cursor()

    books = generate_mock_books(num_books)
    for book in books:
        try:
            cursor.execute('''
                INSERT INTO products (title, author, genre, price, stock, description, image_url, year_published, isbn)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            ''', book)
        except sqlite3.IntegrityError:
            print(f"Skipping duplicate ISBN for random book: {book[0]}")
            continue
    conn.commit()
    print(f"Populated database with {len(books)} random mock book entries.")

    genres_to_guarantee = ['Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
                          'Non-Fiction', 'Biography', 'History', 'Young Adult', 'Romance', 'Horror']
    
    added_guaranteed_count = 0
    for genre in genres_to_guarantee:
        try:
            title = f"The Essence of {genre} Book"
            author = f"Dr. {genre} Expert"
            description = f"An in-depth exploration of the {genre} genre."
            price = round(random.uniform(18.00, 45.00), 2)
            stock = random.randint(40, 150)
            image_url = f"https://via.placeholder.com/150/0000FF/FFFFFF?text={genre.replace(' ', '+')}Book"
            year_published = random.randint(2010, 2024)
            isbn = fake.isbn13()

            cursor.execute('''
                INSERT INTO products (title, author, genre, price, stock, description, image_url, year_published, isbn)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            ''', (title, author, genre, price, stock, description, image_url, year_published, isbn))
            conn.commit()
            added_guaranteed_count += 1
        except sqlite3.IntegrityError:
            print(f"Skipping guaranteed book for '{genre}' due to ISBN conflict.")
            conn.rollback()
            continue
    print(f"Added {added_guaranteed_count} guaranteed books (one for each major genre).")

    conn.close()
    print("Database population complete.")

if __name__ == '__main__':
    from database import init_db
    print("Initializing database schema...")
    init_db()
    print("Populating database with mock data...")
    populate_db_with_mock_data(num_books=150)