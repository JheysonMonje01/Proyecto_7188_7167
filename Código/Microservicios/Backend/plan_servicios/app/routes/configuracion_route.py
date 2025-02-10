from flask import Blueprint, request, jsonify
from app.services.configuracion_service import ConfiguracionService
import logging

configuracion_bp = Blueprint('configuracion_bp', __name__)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@configuracion_bp.route('/configuracion', methods=['GET'])
def get_configuracion():
    """ Obtiene la configuración global del sistema. """
    try:
        configuracion = ConfiguracionService.get_configuracion()
        return jsonify(configuracion.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error inesperado en GET /configuracion: {str(e)}")
        return jsonify({"error": "Ocurrió un error interno al recuperar la configuración."}), 500

@configuracion_bp.route('/configuracion', methods=['PUT'])
def update_configuracion():
    """ Actualiza la configuración global con validaciones estrictas. """
    data = request.get_json()

    # Validar existencia de todos los datos
    required_fields = ["porcentaje_iva", "intentos_login", "tiempo_bloqueo_login", "intervalo_monitoreo", "actualizado_por"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return jsonify({"error": f"Faltan los siguientes campos: {', '.join(missing_fields)}"}), 400

    try:
        ConfiguracionService.update_configuracion(
            data['porcentaje_iva'],
            data['intentos_login'],
            data['tiempo_bloqueo_login'],
            data['intervalo_monitoreo'],
            data['actualizado_por']
        )
        return jsonify({"message": "Configuración actualizada correctamente"}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error inesperado en PUT /configuracion: {str(e)}")
        return jsonify({"error": "Ocurrió un error interno al actualizar la configuración."}), 500
