/**
 * CartDisplay.js
 
 * This component displays the current contents of the user's shopping cart.
 * It allows users to update item quantities, remove items, clear the entire cart,
 * and place orders. It interacts with backend APIs to maintain real-time cart state
 * and order placement.
 
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import './CSS/CartDisplay.css';

const CartDisplay = ({ fetchCartItems, cartItems, setCartItems, showMessage }) => {
    const [loading, setLoading] = useState(false);

    const updateQuantity = async (productId, currentQuantity, delta) => {
        const newQuantity = currentQuantity + delta;

        if (newQuantity < 0) return;

        setLoading(true);
        try {
            await api.updateCartItem(productId, newQuantity);
            const updatedCart = await api.fetchCartItems();
            setCartItems(updatedCart);
            showMessage('Cart updated!', 'success');
        } catch (error) {
            console.error('Error updating cart:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update cart.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (productId) => {
        if (!window.confirm("Are you sure you want to remove this item from your cart?")) {
            return;
        }
        setLoading(true);
        try {
            await api.removeFromCart(productId);
            const updatedCart = await api.fetchCartItems();
            setCartItems(updatedCart);
            showMessage('Item removed from cart.', 'success');
        } catch (error) {
            console.error('Error removing item:', error);
            const errorMessage = error.response?.data?.message || 'Failed to remove item.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        if (!window.confirm("Are you sure you want to clear your entire cart? This action cannot be undone.")) {
            return;
        }
        setLoading(true);
        try {
            await api.clearCart();
            const updatedCart = await api.fetchCartItems();
            setCartItems(updatedCart);
            showMessage('Cart cleared!', 'success');
        } catch (error) {
            console.error('Error clearing cart:', error);
            const errorMessage = error.response?.data?.message || 'Failed to clear cart.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) {
            showMessage("Your cart is empty. Please add items before checking out.", 'warning');
            return;
        }
        if (!window.confirm("Are you sure you want to place this order?")) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.placeOrder();
            showMessage(`Order placed successfully! Order ID: ${response.order_id}`, 'success');
            setCartItems([]);
            await fetchCartItems();
        } catch (error) {
            console.error('Error placing order:', error);
            const errorMessage = error.response?.data?.message || 'Failed to place order.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2);
    };

    useEffect(() => {
        if (typeof fetchCartItems === 'function') {
            fetchCartItems();
        }
    }, [fetchCartItems]);

    return (
        <div className="cart-display">
            <h2>Your Shopping Cart</h2>
            <div className="cart-navigation">
                <Link to="/" className="cart-back-button">
                    ← Back to Chat
                </Link>
            </div>
            {loading && <p>Loading...</p>}
            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <div key={item.product_id} className="cart-item">
                                <img src={item.image_url || 'https://via.placeholder.com/50'} alt={item.title} className="cart-item-image" />
                                <div className="cart-item-details">
                                    <h3>{item.title}</h3>
                                    <p>Price: ${item.price.toFixed(2)}</p>
                                    <p>Quantity: {item.quantity} (Stock: {item.stock})</p>
                                    <div className="cart-item-actions">
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.quantity, -1)}
                                            disabled={loading || item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.quantity, 1)}
                                            disabled={loading || item.quantity >= item.stock}
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.product_id)}
                                            disabled={loading}
                                            className="remove-button"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h3>Total: ${calculateTotal()}</h3>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || cartItems.length === 0}
                            className="checkout-button"
                        >
                            Proceed to Checkout
                        </button>
                        <button
                            onClick={clearCart}
                            disabled={loading || cartItems.length === 0}
                            className="clear-cart-button"
                        >
                            Clear Cart
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartDisplay;