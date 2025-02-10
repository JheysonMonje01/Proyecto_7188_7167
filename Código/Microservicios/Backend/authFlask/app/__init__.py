import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from flask_mail import Mail
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Inicializar extensiones
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()

def create_app():
    app = Flask(__name__)

    # Configuración de la aplicación
    app.config.from_object('app.config.Config')

    # Inicializar extensiones
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Registrar Blueprints
    from app.routes.auth_routes import auth_routes
    from app.routes.get_routes import get_routes
    from app.routes.recuperacion_routes import recuperacion_routes

    app.register_blueprint(auth_routes, url_prefix='/auth')
    app.register_blueprint(get_routes, url_prefix='/api')
    app.register_blueprint(recuperacion_routes, url_prefix='/recuperacion')

    return app
