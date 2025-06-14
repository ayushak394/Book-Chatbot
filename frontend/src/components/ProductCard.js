/**
 * ProductCard.js
 
 * This component displays individual product details including title, author, genre, price,
 * stock availability, and a quantity selector. It includes a button to add the selected quantity
 * of the product to the user's cart via a provided callback.
 
 */

import React, { useState } from 'react';
import './CSS/ProductCard.css';

function ProductCard({ product, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);

    const handleAddToCartClick = () => {
        if (onAddToCart && product.id) {
            onAddToCart(product.id, quantity);
            setQuantity(1);
        }
    };

    return (
        <div className="product-card">
            <h3>{product.title}</h3>
            <p><strong>Author:</strong> {product.author}</p>
            <p><strong>Genre:</strong> {product.genre}</p>
            <p><strong>Price:</strong> ${product.price ? product.price.toFixed(2) : 'N/A'}</p>
            <p className="product-id">ID: {product.id}</p>
            {product.stock !== undefined && <p><strong>Stock:</strong> {product.stock}</p>}
            <div className="add-to-cart-controls">
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="quantity-input"
                />
                <button onClick={handleAddToCartClick} className="add-to-cart-button">
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

export default ProductCard;