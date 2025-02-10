from flask import Blueprint, jsonify
from app.services.historial_cambios_service import HistorialCambiosService

historial_cambios_bp = Blueprint('historial_cambios_bp', __name__)

@historial_cambios_bp.route('/<int:id_servicio>', methods=['GET'])
def get_historial_by_servicio_id(id_servicio):
    try:
        historial = HistorialCambiosService.get_historial_by_servicio_id(id_servicio)
        return jsonify([cambio.to_dict() for cambio in historial]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
