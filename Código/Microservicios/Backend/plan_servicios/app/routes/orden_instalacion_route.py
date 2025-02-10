from flask import Blueprint, request, jsonify, send_file
from app.services.orden_instalacion import OrdenInstalacionService
import io

orden_instalacion_bp = Blueprint('orden_instalacion_bp', __name__)

@orden_instalacion_bp.route('/', methods=['POST'])
def create_orden_instalacion():
    data = request.json
    try:
        new_orden = OrdenInstalacionService.create_orden_instalacion(data)
        return jsonify(new_orden.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/<int:id_orden>', methods=['GET'])
def get_orden_instalacion(id_orden):
    try:
        orden = OrdenInstalacionService.get_orden_instalacion(id_orden)
        return jsonify(orden.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/cliente/nombre/<string:nombre>', methods=['GET'])
def get_orden_instalacion_by_client_name(nombre):
    try:
        orden = OrdenInstalacionService.get_orden_instalacion_by_client_name(nombre)
        return jsonify(orden.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/cliente/cedula/<string:cedula>', methods=['GET'])
def get_orden_instalacion_by_client_cedula(cedula):
    try:
        orden = OrdenInstalacionService.get_orden_instalacion_by_client_cedula(cedula)
        return jsonify(orden.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/<int:id_orden>/pdf', methods=['GET'])
def get_orden_instalacion_pdf(id_orden):
    try:
        pdf_data = OrdenInstalacionService.get_pdf(id_orden)
        return send_file(io.BytesIO(pdf_data), mimetype='application/pdf', as_attachment=True, download_name='orden_instalacion.pdf')
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/', methods=['GET'])
def list_ordenes_instalacion():
    try:
        ordenes = OrdenInstalacionService.list_ordenes_instalacion()
        return jsonify(ordenes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/<int:id_orden>', methods=['PUT'])
def update_orden_instalacion(id_orden):
    data = request.json
    try:
        updated_orden = OrdenInstalacionService.update_orden_instalacion(id_orden, data)
        return jsonify(updated_orden.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orden_instalacion_bp.route('/<int:id_orden>', methods=['DELETE'])
def delete_orden_instalacion(id_orden):
    try:
        OrdenInstalacionService.delete_orden_instalacion(id_orden)
        return jsonify({"message": "Orden de instalación eliminada exitosamente"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
