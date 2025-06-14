/**
 * MessageInput.js
 
 * This component renders the message input field and send button for the chatbot interface.
 * It allows users to type messages and submit them to the chatbot system.
 * It clears the input after submission and passes the message to the parent component.
 
 */

import React, { useState } from 'react';
import './CSS/MessageInput.css'; 

function MessageInput({ onSendMessage, authToken }) { 
    const [inputText, setInputText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSendMessage(inputText, authToken); 
        setInputText('');
    };
    
    return (
        <form className="message-input-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                required
            />
            <button type="submit">Send</button>
        </form>
    );
}

export default MessageInput;