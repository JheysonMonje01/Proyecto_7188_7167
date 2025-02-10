from flask import Flask
from config import Config
from app.models import db
from app.routes.factura_routes import bp as factura_bp
from app.routes.pago_routes import pago_bp as pagos_bp  # Cambiado el nombre del import
from app.routes.transaccion_routes import bp as transaccion_bp
from flask_cors import CORS
import threading
from app.services.factura_service import ejecutar_scheduler  # ✅ Importación después de inicializar `app`

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.register_blueprint(factura_bp, url_prefix='/facturacion')
    app.register_blueprint(pagos_bp, url_prefix='/facturacion')  # Usar el nombre correcto
    app.register_blueprint(transaccion_bp, url_prefix='/facturacion')
    
    # ✅ Iniciar el hilo de monitoreo PASANDO LA APP
    with app.app_context():
        thread = threading.Thread(target=ejecutar_scheduler, args=(app,), daemon=True)  # ✅ Se pasa `app` correctamente
        thread.start()
        print("✅ Hilo de monitoreo de facturas iniciado.")


    return app


