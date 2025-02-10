from app import db
from app.models.configuracion_model import Configuracion
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfiguracionService:
    @staticmethod
    def get_configuracion():
        """ Obtiene la configuración global con manejo de errores. """
        try:
            configuracion = Configuracion.query.first()
            if not configuracion:
                raise ValueError("No se encontró ninguna configuración en la base de datos.")
            return configuracion
        except Exception as e:
            logger.error(f"Error al recuperar la configuración: {str(e)}")
            raise ValueError("Error interno al obtener la configuración.")

    @staticmethod
    def update_configuracion(porcentaje_iva, intentos_login, tiempo_bloqueo_login, intervalo_monitoreo, actualizado_por):
        """ Actualiza la configuración global con validaciones estrictas. """
        configuracion = Configuracion.query.first()
        if not configuracion:
            raise ValueError("No se encontró ninguna configuración para actualizar.")

        # Validaciones de los valores ingresados
        if not (0 <= porcentaje_iva <= 100):
            raise ValueError("El porcentaje de IVA debe estar entre 0 y 100.")

        if not (1 <= intentos_login <= 10):
            raise ValueError("Los intentos de login deben estar entre 1 y 10.")

        if tiempo_bloqueo_login < 1:
            raise ValueError("El tiempo de bloqueo de login debe ser de al menos 1 minuto.")

        if intervalo_monitoreo < 1:
            raise ValueError("El intervalo de monitoreo debe ser de al menos 1 minuto.")

        try:
            # Asignar valores actualizados
            configuracion.porcentaje_iva = porcentaje_iva
            configuracion.intentos_login = intentos_login
            configuracion.tiempo_bloqueo_login = tiempo_bloqueo_login
            configuracion.intervalo_monitoreo = intervalo_monitoreo
            configuracion.actualizado_por = actualizado_por
            configuracion.actualizado_en = datetime.utcnow()

            # Guardar cambios
            db.session.commit()
            logger.info(f"Configuración actualizada exitosamente por el usuario {actualizado_por}")

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error al actualizar la configuración: {str(e)}")
            raise ValueError("Ocurrió un error interno al actualizar la configuración.")
