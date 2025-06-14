"""
auth.py

This module provides a decorator function `token_required` used to protect Flask routes
with JWT-based authentication. It checks for a valid token in the `Authorization` or
`x-access-token` headers, decodes it using a secret key, and extracts the `user_id` for
downstream route use.

It handles common token errors such as missing, expired, or invalid tokens and returns
appropriate HTTP 401 responses.

"""

from flask import request, jsonify
from functools import wraps
import jwt
import os

SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
JWT_ALGORITHM = 'HS256'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        elif 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
        except Exception as e:
            return jsonify({"message": f"Token error: {str(e)}"}), 401

        return f(current_user_id, *args, **kwargs)

    return decorated