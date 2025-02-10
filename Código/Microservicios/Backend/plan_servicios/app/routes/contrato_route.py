from flask import Blueprint, jsonify, send_file, request
from app.services.contrato_service import ContratoService
from io import BytesIO

contrato_bp = Blueprint('contrato_bp', __name__)

@contrato_bp.route('/', methods=['GET'])
def list_contratos():
    """
    Lista todos los contratos.
    """
    try:
        contratos = ContratoService.list_contratos()
        return jsonify([contrato.to_dict() for contrato in contratos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from flask import send_file, jsonify
from io import BytesIO

@contrato_bp.route('/download/<int:contrato_id>', methods=['GET'])
def download_contrato(contrato_id):
    """
    Descarga el contrato en formato PDF basado en el ID del contrato.
    """
    try:
        # ✅ Simplemente retorna la respuesta de download_contrato
        return ContratoService.download_contrato(contrato_id)

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@contrato_bp.route('/buscar', methods=['GET'])
def buscar_contrato():
    """
    Busca un contrato por id_cliente, nombre o cédula.
    """
    try:
        cliente_id = request.args.get('id_cliente', type=int)
        nombre = request.args.get('nombre', type=str)
        cedula = request.args.get('cedula', type=str)

        if cliente_id:
            contrato = ContratoService.get_contrato_by_cliente_id(cliente_id)
        elif nombre:
            contrato = ContratoService.get_contrato_by_nombre(nombre)
        elif cedula:
            contrato = ContratoService.get_contrato_by_cedula(cedula)
        else:
            return jsonify({"error": "Debe proporcionar al menos un parámetro de búsqueda (id_cliente, nombre o cedula)"}), 400

        if not contrato:
            return jsonify({"error": "Contrato no encontrado"}), 404

        return jsonify(contrato.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@contrato_bp.route('/<int:id_contrato>', methods=['PUT'])
def update_contrato(id_contrato):
    """
    Actualiza un contrato existente basado en su ID con un nuevo archivo PDF.
    """
    try:
        print("📥 Recibiendo solicitud para actualizar contrato...")

        # ✅ Verificar qué está llegando en request.files
        print("🔍 Archivos recibidos:", request.files)
        print("🔍 request.form:", request.form)

        if 'archivo' not in request.files:
            return jsonify({"error": "No se envió un archivo."}), 400

        archivo = request.files['archivo']  # Obtener el archivo del request
        print("📄 Archivo recibido:", archivo.filename)

        ContratoService.update_contrato(id_contrato, archivo)

        return jsonify({"message": "Contrato actualizado exitosamente."}), 200

    except Exception as e:
        print("❌ Error en update_contrato:", str(e))
        return jsonify({"error": str(e)}), 400



@contrato_bp.route('/<int:cliente_id>', methods=['DELETE'])
def delete_contrato(cliente_id):
    """
    Elimina un contrato.
    """
    try:
        ContratoService.delete_contrato(cliente_id)
        return jsonify({"message": "Contrato eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@contrato_bp.route('/', methods=['POST'])
def create_contrato():
    """
    Crea un nuevo contrato para un cliente y genera automáticamente una factura.
    """
    try:
        data = request.json
        id_cliente = data.get("id_cliente")
        direccion_ingresada = data.get("direccion")
        id_plan_servicio = data.get("id_plan_servicio")  # ✅ Se recibe el plan

        if not id_cliente or not direccion_ingresada or not id_plan_servicio:
            return jsonify({"error": "El id_cliente, id_plan_servicio y direccion son obligatorios"}), 400

        nuevo_contrato = ContratoService.create_contrato(id_cliente, direccion_ingresada, id_plan_servicio)

        return jsonify(nuevo_contrato.to_dict()), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500





#RUTA PARA LA API DE FACTURACION

@contrato_bp.route('/contrato/<int:id_contrato>', methods=['GET'])
def get_contrato_by_id(id_contrato):
    """
    Obtiene los datos de un contrato por su ID.
    """
    try:
        contrato = ContratoService.get_contrato_by_id(id_contrato)
        return jsonify(contrato), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contrato_bp.route('/cliente/<int:id_cliente>', methods=['GET'])
def get_contrato_by_id_cliente(id_cliente):
    """
    Obtiene los datos de un contrato por su ID cliente.
    """
    try:
        contrato = ContratoService.get_contratos_by_id_cliente(id_cliente)
        return jsonify(contrato), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500