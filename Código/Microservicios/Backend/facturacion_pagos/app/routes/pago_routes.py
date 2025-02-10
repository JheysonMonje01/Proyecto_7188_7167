from flask import Blueprint, request, jsonify
from app.services.pago_service import PagoService
from datetime import datetime

pago_bp = Blueprint('pago_bp', __name__)

@pago_bp.route('/pagos', methods=['POST'])
def create_pago():
    """
    Crea un nuevo registro de pago.
    """
    data = request.json
    id_factura = data.get('id_factura')
    if not id_factura:
        return jsonify({"error": "El campo 'id_factura' es requerido."}), 400
    try:
        nuevo_pago = PagoService.create_pago(id_factura)
        return jsonify(nuevo_pago.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@pago_bp.route('/pagos/<int:id_pago>', methods=['GET'])
def get_pago(id_pago):
    """
    Obtiene un pago por su ID.
    """
    try:
        pago = PagoService.get_pago(id_pago)
        return jsonify(pago), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pago_bp.route('/pagos', methods=['GET'])
def list_pagos():
    """
    Lista todos los pagos registrados.
    """
    try:
        pagos = PagoService.list_pagos()
        return jsonify(pagos), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pago_bp.route('/facturas_pendientes/<int:id_cliente>', methods=['GET'])
def get_facturas_pendientes(id_cliente):
    """
    Obtiene todas las facturas en estado "Pendiente" o "Vencido" de un cliente.
    """
    try:
        facturas_pendientes = PagoService.get_facturas_pendientes(id_cliente)
        return jsonify(facturas_pendientes), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pago_bp.route('/facturas_pendientes/total/<int:id_cliente>', methods=['GET'])
def get_total_facturas_pendientes(id_cliente):
    """
    Obtiene el total a pagar por todas las facturas pendientes o vencidas de un cliente.
    """
    try:
        total_a_pagar = PagoService.get_total_facturas_pendientes(id_cliente)
        return jsonify(total_a_pagar), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@pago_bp.route('/facturas_vencidas/<int:id_cliente>', methods=['GET'])
def get_facturas_vencidas(id_cliente):
    """
    Obtiene todas las facturas vencidas de un cliente.
    """
    try:
        facturas = PagoService.get_facturas_vencidas(id_cliente)
        return jsonify([factura.to_dict() for factura in facturas]), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500








#-----------------------------------------------------------------
#Anular pago de ese cliente 

@pago_bp.route('/pagos/<int:id_pago>', methods=['PUT'])
def update_pago(id_pago):
    """
    Revierte un pago y devuelve la factura a su estado anterior.
    """
    try:
        pago_actualizado = PagoService.update_pago(id_pago)
        return jsonify(pago_actualizado.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
