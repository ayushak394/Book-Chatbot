/**
 * OrderHistory.js
 
 * This component fetches and displays the user's past orders, including order ID, date, items,
 * quantities, prices, and status. It uses API integration to fetch data and provides user feedback
 * in case of errors or empty history.

 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import './CSS/OrderHistory.css';

const OrderHistory = ({ showMessage }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedOrders = await api.fetchOrders();
                setOrders(fetchedOrders);
            } catch (err) {
                console.error('Error fetching orders:', err);
                const errorMessage = err.response?.data?.message || 'Failed to fetch order history.';
                setError(errorMessage);
                showMessage(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [showMessage]);

    if (loading) {
        return <div className="order-history-container">Loading orders...</div>;
    }

    if (error) {
        return <div className="order-history-container error-message">Error: {error}</div>;
    }

    return (
        <div className="order-history-container">
            <h2>My Orders</h2>
            <div className="order-history-actions">
                <Link to="/" className="back-to-chat-button">
                    ← Back to Chat
                </Link>
            </div>
            {orders.length === 0 ? (
                <p>You have no past orders.</p>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <h3>Order ID: {order.id}</h3>
                                <p>Date: {new Date(order.order_date).toLocaleDateString()} {new Date(order.order_date).toLocaleTimeString()}</p>
                            </div>
                            <div className="order-details">
                                <p>Total Amount: ${order.total_amount.toFixed(2)}</p>
                                <p>Status: <span className={`order-status ${order.status.toLowerCase()}`}>Out for Delivery</span></p>
                                <h4>Items:</h4>
                                <ul className="order-items-list">
                                    {order.items.map((item, index) => (
                                        <li key={index} className="order-item">
                                            <img src={item.image_url || 'https://via.placeholder.com/30'} alt={item.title} className="order-item-image" />
                                            <div>
                                                <p>{item.title} by {item.author}</p>
                                                <p>Quantity: {item.quantity} @ ${item.price_at_purchase.toFixed(2)} each</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;