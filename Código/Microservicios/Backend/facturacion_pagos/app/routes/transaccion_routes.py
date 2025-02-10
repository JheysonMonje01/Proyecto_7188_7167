from flask import Blueprint, request, jsonify
from app.services.transaccion_service import TransaccionService

bp = Blueprint('transaccion', __name__)

@bp.route('/transacciones', methods=['POST'])
def crear_transaccion_route():
    data = request.json
    id_pago = data['id_pago']
    metodo_pago = data['metodo_pago']
    referencia_transaccion = data['referencia_transaccion']
    transaccion = TransaccionService.create_transaccion(id_pago, metodo_pago, referencia_transaccion)
    if transaccion:
        return jsonify(transaccion), 201
    return jsonify({'error': 'No se pudo crear la transacción'}), 400
