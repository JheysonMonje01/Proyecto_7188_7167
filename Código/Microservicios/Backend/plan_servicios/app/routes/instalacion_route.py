from flask import Blueprint, request, jsonify
from app.services.instalacion_service import InstalacionService

instalacion_bp = Blueprint('instalacion_bp', __name__)

@instalacion_bp.route('/listar', methods=['GET'])
def listar_tecnicos():
    """Lista los técnicos desde el microservicio de usuarios."""
    try:
        tecnicos = InstalacionService.obtener_tecnicos()
        return jsonify(tecnicos), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500

@instalacion_bp.route('/listar_instalaciones', methods=['GET'])
def listar_instalaciones():
    """Lista todas las instalaciones registradas en el sistema."""
    try:
        instalaciones = InstalacionService.listar_instalaciones()
        return jsonify(instalaciones), 200
    except Exception as e:
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500



@instalacion_bp.route('/asignar', methods=['POST'])
def asignar_tecnico():
    """Asigna un técnico a una orden de instalación."""
    data = request.json
    id_orden = data.get("id_orden")
    id_tecnico = data.get("id_tecnico")

    if not id_orden or not id_tecnico:
        return jsonify({"error": "id_orden e id_tecnico son obligatorios"}), 400

    try:
        asignacion = InstalacionService.asignar_tecnico(id_orden, id_tecnico)
        return jsonify(asignacion.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@instalacion_bp.route('/finalizar/<int:id_orden>', methods=['PUT'])
def finalizar_instalacion(id_orden):
    """Finaliza la instalación de una orden."""
    try:
        instalacion_finalizada = InstalacionService.finalizar_instalacion(id_orden)
        return jsonify(instalacion_finalizada.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400