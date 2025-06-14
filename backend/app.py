"""
app.py

This is the main backend application file for the Uplyft Book Chatbot system.
It uses Flask to define RESTful API endpoints that support user registration, authentication,
product search, cart management, order processing, and chat message logging.

The API serves as the communication bridge between the React frontend and the backend database.

"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from database import init_db, get_db_connection
from routes import api_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def home():
    return "Uplyft E-commerce Chatbot Backend is running!"

if __name__ == '__main__':
    app.run(debug=True)