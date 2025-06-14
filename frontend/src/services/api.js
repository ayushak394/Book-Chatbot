/**
 * api.js
 
 * This file defines the client-side API service layer for the Uplyft Book Chatbot application.
 * It uses Axios to handle HTTP requests to the backend Flask API server. The file includes
 * helper functions for user authentication, product search, cart operations, order management,
 * and message persistence.
 
 */

import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export const registerUser = async (username, password) => {
    const response = await api.post('/register', { username, password });
    return response.data;
};

export const loginUser = async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post('/logout');
    return response.data;
};

export const searchProducts = async (query = '', genre = '', minPrice = '', maxPrice = '') => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (Array.isArray(genre) && genre.length > 0) {
        params.append('genre', genre.join(','));
    } else if (genre) {
        params.append('genre', genre);
    }
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);

    const response = await api.get(`/search?${params.toString()}`);
    return response.data;
};

export const fetchProducts = async (page = 1, limit = 10) => {
    const response = await api.get(`/products?page=${page}&limit=${limit}`);
    return response.data;
};

export const getAllProducts = async () => {
    try {
        const response = await api.get('/products');
        return response.data;
    } catch (error) {
        console.error("Error fetching all products:", error);
        throw error; 
    }
};

export const addToCart = async (productId, quantity) => {
    const response = await api.post('/cart', { product_id: productId, quantity });
    return response.data;
};

export const fetchCartItems = async () => {
    const response = await api.get('/cart');
    return response.data.items;
};

export const updateCartItem = async (productId, quantity) => {
    const response = await api.put(`/cart/${productId}`, { quantity });
    return response.data;
};

export const removeFromCart = async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    return response.data;
};

export const clearCart = async () => {
    const response = await api.delete('/cart');
    return response.data;
};

export const placeOrder = async () => {
    const response = await api.post('/orders');
    return response.data;
};

export const fetchOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

export const saveMessage = async (sender, text, timestamp) => {
  const response = await api.post("/messages", { sender, text, timestamp });
  return response.data;
};

export const fetchMessages = async () => {
  const response = await api.get("/messages");
  return response.data;
};

export default api;