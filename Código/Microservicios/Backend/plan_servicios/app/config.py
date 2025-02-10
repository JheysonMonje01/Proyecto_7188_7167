import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env
load_dotenv()

class Config:
    # Configuración básica de Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'otra_clave_secreta')
    DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    ENV = os.getenv('FLASK_ENV', 'production')
    
    #Configurar las variables de entorno de 
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'tu_clave_secreta_123')  # Clave compartida
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')  # Algoritmo usado

    # Configuración de la base de datos
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configuración de MikroTik
    MIKROTIK_HOST = os.getenv('MIKROTIK_HOST')
    MIKROTIK_USERNAME = os.getenv('MIKROTIK_USERNAME')
    MIKROTIK_PASSWORD = os.getenv('MIKROTIK_PASSWORD')
    # Configuración de la API de Google Maps
    GOOGLE_GEOCODING_API_KEY = os.getenv('GOOGLE_GEOCODING_API_KEY')
    
    SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": 10,             # Límite de conexiones activas
    "pool_recycle": 280,         # Reciclado de conexiones inactivas
    "pool_timeout": 30,          # Tiempo de espera para obtener una conexión
    "max_overflow": 5            # Conexiones extra si el pool se llena
    }

    