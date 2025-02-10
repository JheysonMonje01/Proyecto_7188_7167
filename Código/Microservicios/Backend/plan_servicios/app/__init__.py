from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import time
import threading


# Configurar el logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Instancia global de SQLAlchemy y Scheduler
db = SQLAlchemy()
scheduler = BackgroundScheduler()

# Definir app como variable global
app = None

def obtener_intervalo_monitoreo():
    """Obtiene el valor de intervalo_monitoreo desde la base de datos."""
    from app.models.configuracion_model import Configuracion

    with app.app_context():  # Se añade el contexto de la aplicación
        configuracion = db.session.query(Configuracion).first()
        if configuracion and configuracion.intervalo_monitoreo:
            return configuracion.intervalo_monitoreo
        return 60  # Valor por defecto si no se encuentra en la BD

def actualizar_scheduler():
    """Monitorea cambios en la base de datos y actualiza el intervalo del scheduler dinámicamente."""
    global scheduler, app  # Asegurar acceso a la aplicación
    with app.app_context():  # Se asegura el contexto de la aplicación
        intervalo_actual = obtener_intervalo_monitoreo()
        logger.info(f"Intervalo inicial de monitoreo: {intervalo_actual} minutos")

    while True:
        time.sleep(30)  # Revisar la base de datos cada 30 segundos
        with app.app_context():  # Se asegura el contexto cada vez que se consulta la BD
            nuevo_intervalo = obtener_intervalo_monitoreo()

            if nuevo_intervalo != intervalo_actual:
                logger.info(f"Nuevo intervalo detectado: {nuevo_intervalo} minutos. Actualizando scheduler...")

                # Eliminar la tarea existente
                scheduler.remove_all_jobs()

                # Agregar la tarea con el nuevo intervalo
                scheduler.add_job(
                    func=verificar_servicios,
                    trigger=IntervalTrigger(minutes=nuevo_intervalo),
                    misfire_grace_time=54000
                )

                intervalo_actual = nuevo_intervalo

def verificar_servicios():
    """Función que ejecuta las verificaciones de servicios."""
    global app  # Ahora usamos la variable global 'app'
    with app.app_context():  # Asegurar contexto Flask
        from app.services.servicio_internet_service import ServicioInternetService
        ServicioInternetService.verificar_facturas_vencidas(db)
        ServicioInternetService.verificar_fechas_corte(db)

def create_app():
    global app  # Asignamos 'app' a la variable global
    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    # Inicializar db con la aplicación
    db.init_app(app)

    # Configurar CORS
    CORS(app, resources={r"/": {"origins": ""}})

    # Importar y registrar los blueprints
    from app.routes import (
        plan_route, mikrotik_route, client_route, contrato_route,
        orden_instalacion_route, configuracion_route, servicio_internet_route, historial_cambios_route, instalacion_route
    )

    app.register_blueprint(plan_route.plan_bp, url_prefix='/plan_servicios')
    app.register_blueprint(mikrotik_route.mikrotik_bp, url_prefix='/mikrotik')
    app.register_blueprint(client_route.client_bp, url_prefix='/clientes')
    app.register_blueprint(contrato_route.contrato_bp, url_prefix='/contratos')
    app.register_blueprint(orden_instalacion_route.orden_instalacion_bp, url_prefix='/ordenes_instalacion')
    app.register_blueprint(configuracion_route.configuracion_bp, url_prefix='/configuracion')
    app.register_blueprint(servicio_internet_route.servicio_internet_bp, url_prefix='/servicio_internet')
    app.register_blueprint(historial_cambios_route.historial_cambios_bp, url_prefix='/historial_cambios')
    app.register_blueprint(instalacion_route.instalacion_bp, url_prefix='/instalacion')

    # Obtener el intervalo inicial dentro del contexto de la aplicación
    with app.app_context():
        intervalo_monitoreo = obtener_intervalo_monitoreo()
        logger.info(f"Intervalo de monitoreo inicial: {intervalo_monitoreo} minutos")

    # Agregar la tarea de monitoreo al scheduler
    scheduler.add_job(
        func=verificar_servicios, 
        trigger=IntervalTrigger(minutes=intervalo_monitoreo),  
        misfire_grace_time=54000
    )

    scheduler.start()

    # Iniciar un hilo en segundo plano para monitorear cambios en la configuración
    thread = threading.Thread(target=actualizar_scheduler, daemon=True)
    thread.start()

    return app