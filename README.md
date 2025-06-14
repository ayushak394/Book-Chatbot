[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON%20web%20tokens)](https://jwt.io/)


# 📚 Booksy: Conversational E-Commerce Platform

Booksy Chatbot is a full-stack conversational e-commerce web application that lets users browse, search, and shop for books via a natural language chatbot. Users can register, interact with the bot to discover books, manage their cart, and place orders—completely through chat.

## 🚀 Features

- 🧠 Conversational search & recommendations (genre, price, title)

- 🔍 Natural language filters (e.g. "Books under ₹500", "thrillers between 300 and 600")

- 🛒 Cart operations: add, remove, update quantity

- 🧾 View past orders

- 🔐 JWT-based authentication
  
- 🖼️ Interactive UI built in React

## 🧠 Supported Chatbot Commands

### 💬 Greetings
- `hello`  
- `hi`  
- `how are you`  

---

### 📚 Show All Books
- `show me all books`  
---

### 🔎 Browse & Filter Books
**By Genre:**
- `I am looking for fantasy`  
- `I am looking for horror`  
- `I am looking for thriller`  
- *(and other genres)*

**By Genre + Price Range:**
- `I want books in fantasy between 10 and 30 dollars`

**Clear Filters:**
- `clear filters`  
- `reset`  
- `forget about that`

---

### 🛒 Add or Update Cart
**Add to Cart:**
- `(add|buy) [product name] with quantity [number]`  
  - Example: `add Versatile interactive project Thing with quantity 2`

**Update Cart:**
- `update [product name] quantity to [number]`  
  - Example: `update User-friendly 6thgeneration flexibility Whose quantity to 2`

---

### 👁️ View Cart
- `show cart`  
- `view cart`

**Remove from Cart:**
- `remove 1 of [product name] from cart`  
- `remove [product name] from cart`

---

### 📦 View Orders
- `view my orders`

---

### ✅ Place Order
- `place order`  
- `confirm my order`

> ⚠️ **Note:** Since regular expressions are used for command matching, many other similar phrases and variations may also work.


## 📦 Installation

Follow these steps to set up and run the project locally:

### ✅ Prerequisites
- Node.js (LTS recommended)

- Python (3.9+)

- Virtualenv (pip install virtualenv)

## 🛠 Setup Guide

### Clone the Repository
```bash
git clone https://github.com/yourusername/Booksy.git
```

### 🔙 Backend Setup (Flask + Python)

### 1️⃣ Navigate to Backend :
```bash
cd backend
```
### 2️⃣ Create and Activate Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
```
### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt

```

### 4️⃣ Load Mock Data (optional but recommended for testing):

```bash
python database.py
python mock_data.py
```

### 5️⃣ Run the Flask Server

```bash
python app.py
```

## 🖥️ Frontend Setup (React)

### 1️⃣ Navigate to Frontend (In a new terminal) :

```bash
cd frontend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the Frontend Server
```bash
npm start
```

## 🛠 Tech Stack
- Frontend:	React.js
- Backend: 	Flask (Python)
- Auth:	JWT
- Database:	MongoDB or Mock Data
- Styling: CSS

## 🧪 Development Notes
Ensure the backend runs on http://localhost:5000 and frontend is configured to use this base URL.

Use MongoDB Atlas or run a local Mongo instance if not using mock data.

Extend mock data with more books and genres by editing mock_data.py.

## 📜 License
This project is created for learning and educational purposes. Contributions and improvements are welcome!
