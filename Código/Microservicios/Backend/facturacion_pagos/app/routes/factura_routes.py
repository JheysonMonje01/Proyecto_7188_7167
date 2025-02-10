from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
from app.services.factura_service import create_factura, get_factura, update_factura, delete_factura, get_facturas_by_cliente, get_facturas_by_estado, create_new_factura_if_vencimiento, list_facturas, get_facturas_vencidas_by_cliente, descargar_factura, get_factura_id, calcular_proxima_fecha
from app.models.factura import Factura
from app.models import db
import calendar
from datetime import datetime, date, timezone, timedelta
ECUADOR_TIMEZONE = timezone(timedelta(hours=-5))  # UTC-5
import logging

logger = logging.getLogger(__name__)
bp = Blueprint('factura', __name__)

@bp.route('/facturas', methods=['POST'])
def crear_factura_route():
  
    try:
        data = request.json
        print(f"📥 Datos recibidos en facturación: {data}")  # 🔍 Depuración
        
        # Validar que el campo "direccion" está presente
        if "direccion" not in data:
            raise ValueError("Falta el campo 'direccion' en la solicitud.")

        id_cliente = data['id_cliente']
        id_contrato = data['id_contrato']  # ✅ Ahora es obligatori
        monto = data['monto']
        estado = data.get('estado', 'Pendiente')  # Por defecto, el estado es 'Pendiente'
        direccion = data["direccion"]
        # Obtener la fecha actual en el huso horario de Ecuador
        creado_en = datetime.now(ECUADOR_TIMEZONE)

        # Calcular la fecha de vencimiento
        fecha_vencimiento = calcular_proxima_fecha(creado_en.date())  # Convertimos a .date()

        # Crear la factura con la fecha de vencimiento ajustada
        factura = create_factura(id_cliente, id_contrato, monto, fecha_vencimiento.strftime('%Y-%m-%d'), estado, direccion)


        return jsonify(factura), 201

    except KeyError as e:
        return jsonify({'error': f"Falta el campo requerido: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/facturas/contrato/<int:id_contrato>', methods=['GET'])
def obtener_facturas_por_contrato(id_contrato):
    facturas = Factura.query.filter_by(id_contrato=id_contrato).all()
    return jsonify([factura.to_dict() for factura in facturas]), 200


@bp.route('/facturas/<int:id_factura>', methods=['GET'])
def obtener_factura_route(id_factura):
    try:
        archivo, nombre_archivo = descargar_factura(id_factura)
        pdf_buffer = BytesIO(archivo)
        return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name=nombre_archivo)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@bp.route('/facturas/client/<int:id_cliente>', methods=['GET'])
def get_factura_cliente(id_cliente):  # ✅ Asegurar que el nombre coincida con la ruta
    """
    Descarga el contrato en formato PDF basado en el ID del cliente.
    """
    try:
        archivo, nombre = descargar_factura(id_cliente)  # ✅ Pasar el ID correctamente
        if not archivo:
            return jsonify({"error": "Archivo no encontrado"}), 404

        return send_file(BytesIO(archivo), as_attachment=True, download_name=nombre, mimetype='application/pdf')
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/facturas/cliente/<int:id_cliente>', methods=['GET'])
def obtener_facturas_cliente_route(id_cliente):
    facturas = get_facturas_by_cliente(id_cliente)
    return jsonify(facturas), 200

@bp.route('/facturas/<int:id_factura>', methods=['PUT'])
def actualizar_factura_route(id_factura):
    data = request.json
    detalle_recargo = data.get('detalle_recargo')
    total_recargo = data.get('total_recargo')
    try:
        factura = update_factura(id_factura, detalle_recargo, total_recargo)
        return jsonify(factura), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
#####################################



######################################

@bp.route('/facturas/<int:id_factura>', methods=['DELETE'])
def eliminar_factura_route(id_factura):
    try:
        result = delete_factura(id_factura)
        if result:
            return jsonify({'message': 'Factura eliminada'}), 200
        return jsonify({'error': 'No se pudo eliminar la factura'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/facturas/estado', methods=['GET'])
def obtener_facturas_por_estado_route():
    estado = request.args.get('estado')
    if not estado:
        return jsonify({"error": "El parámetro 'estado' es requerido"}), 400
    facturas = get_facturas_by_estado(estado)
    return jsonify(facturas), 200

@bp.route('/facturas/vencimiento/<int:id_factura>', methods=['POST'])
def crear_nueva_factura_si_vencimiento_route(id_factura):
    try:
        nueva_factura = create_new_factura_if_vencimiento(id_factura)
        if nueva_factura:
            return jsonify(nueva_factura), 201
        return jsonify({'message': 'No se creó una nueva factura'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/facturas', methods=['GET'])
def listar_facturas_route():
    facturas = list_facturas()
    return jsonify(facturas), 200

@bp.route('/facturas/vencidas/cliente/<int:id_cliente>', methods=['GET'])
def obtener_facturas_vencidas_cliente_route(id_cliente):
    facturas = get_facturas_vencidas_by_cliente(id_cliente)
    if isinstance(facturas, dict) and "error" in facturas:
        return jsonify(facturas), 404
    return jsonify(facturas), 200

@bp.route('/facturas/pendiente', methods=['GET'])
def obtener_facturacion_pendiente():
    monto_pendiente = db.session.query(db.func.sum(Factura.monto)).filter_by(estado='Pendiente').scalar()
    return jsonify({"monto_pendiente": monto_pendiente}), 200

@bp.route('/facturas/cancelado', methods=['GET'])
def obtener_facturacion_cancelado():
    monto_cancelado = db.session.query(db.func.sum(Factura.monto)).filter_by(estado='Cancelado').scalar()
    return jsonify({"monto_cancelado": monto_cancelado}), 200

@bp.route('/facturas/vencido', methods=['GET'])
def obtener_facturacion_vencido():
    monto_vencido = db.session.query(db.func.sum(Factura.monto)).filter_by(estado='Vencido').scalar()
    return jsonify({"monto_vencido": monto_vencido}), 200

@bp.route('/factur/<int:id_factura>', methods=['GET'])
def get_pago(id_factura):
    """
    Obtiene un pago por su ID.
    """
    try:
        factura = get_factura_id(id_factura)
        return jsonify(factura), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500