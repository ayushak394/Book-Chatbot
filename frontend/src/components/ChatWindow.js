/**
 * ChatWindow.js
 
 * This component renders the chatbot conversation view, including user and bot messages.
 * It dynamically displays text messages and product cards when applicable.
 
 */

import React, { useEffect, useRef } from "react";
import "./CSS/ChatWindow.css";
import ProductCard from "./ProductCard";

function ChatWindow({ messages, onAddToCart }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <div key={index} className={`chat-message ${msg.sender}`}>
          {msg.text && <p>{msg.text}</p>}

          {msg.type === "products" && msg.data && (
            <div className="product-card-container">
              {msg.data.map((product, pIndex) => (
                <ProductCard key={pIndex} product={product} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
          <span className="timestamp">{msg.timestamp}</span>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatWindow;