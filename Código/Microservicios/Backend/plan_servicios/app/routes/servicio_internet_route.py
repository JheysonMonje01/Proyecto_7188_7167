from flask import Blueprint, request, jsonify
from app.services.servicio_internet_service import ServicioInternetService
from app import db
from datetime import datetime

servicio_internet_bp = Blueprint('servicio_internet_bp', __name__)

@servicio_internet_bp.route('/activar', methods=['POST'])
def activar_servicio():
    data = request.json
    id_cliente = data.get('id_cliente')
    if not id_cliente:
        return jsonify({"error": "El campo 'id_cliente' es requerido."}), 400

    try:
        servicio = ServicioInternetService.activar_servicio(db, id_cliente)
        return jsonify({"message": "Servicio activado exitosamente.", "servicio": servicio.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@servicio_internet_bp.route('/desactivar', methods=['POST'])
def desactivar_servicio():
    data = request.json
    id_cliente = data.get('id_cliente')
    if not id_cliente:
        return jsonify({"error": "El campo 'id_cliente' es requerido."}), 400

    try:
        servicio = ServicioInternetService.desactivar_servicio(db, id_cliente)
        return jsonify({"message": "Servicio desactivado exitosamente.", "servicio": servicio.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@servicio_internet_bp.route('/fecha_corte/<int:id_cliente>', methods=['PUT'])
def actualizar_fecha_corte(id_cliente):
    data = request.json
    fecha_corte = data.get('fecha_corte')
    if not fecha_corte:
        return jsonify({"error": "El campo 'fecha_corte' es requerido."}), 400

    try:
        fecha_corte = datetime.strptime(fecha_corte, '%Y-%m-%d %H:%M:%S')
        servicio = ServicioInternetService.actualizar_fecha_corte(db, id_cliente, fecha_corte)
        return jsonify({"message": "Fecha de corte actualizada exitosamente.", "servicio": servicio.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
