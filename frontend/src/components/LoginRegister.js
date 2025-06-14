/**
 * LoginRegister.js
 
 * This component handles user authentication, providing both login and registration modes.
 * It captures user credentials, calls the appropriate backend API, and handles success or error messages.
 * Upon successful login, it invokes a callback to update the session state in the parent.

 */

import React, { useState } from 'react';
import "./CSS/LoginRegister.css"
import { registerUser, loginUser } from '../services/api';

const LoginRegister = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        try {
            if (isLogin) {
                const data = await loginUser(username, password);
                onLoginSuccess(data.token, data.username);
                setMessage('Login successful!', 'success');
            } else {
                const data = await registerUser(username, password);
                setMessage(data.message, 'success');
                setIsLogin(true);
            }
        } catch (error) {
            console.error('Auth error:', error.response?.data || error);
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
            setMessage(errorMessage, 'error');
        }
    };

    return (
        <div className="auth-container">
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            </form>
            <p className={`message ${messageType}`}>{message}</p>
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth-mode">
                {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
        </div>
    );
};

export default LoginRegister;