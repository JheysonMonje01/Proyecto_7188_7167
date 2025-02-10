from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import decode_token
import os

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')  # Leer el token del encabezado
        if not token:
            return jsonify({'error': 'Token no proporcionado'}), 401

        try:
            # Eliminar el prefijo "Bearer " si está presente
            token = token.split(" ")[1] if "Bearer" in token else token
            secret_key = os.getenv('JWT_SECRET_KEY', 'superclaveultrasecreta')
            algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
            
            # Decodificar el token
            decoded_token = decode_token(token, secret_key=secret_key, algorithms=[algorithm])
            request.user = decoded_token['sub']  # Agregar la identidad del usuario al request
        except Exception as e:
            return jsonify({'error': 'Token inválido o expirado'}), 401

        return f(*args, **kwargs)
    return decorated
