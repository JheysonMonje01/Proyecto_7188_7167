from flask import Blueprint, request, jsonify
from app.services.client_service import ClientService
from app.models.client_model import Cliente
from app.models.contrato_model import Contrato
from app.services.contrato_service import ContratoService
client_bp = Blueprint('client_bp', __name__)

@client_bp.route('/', methods=['POST'])  # Sin barra final para evitar redirección
def create_client():
    """
    Crea un nuevo cliente.
    """
    data = request.json
    try:
        new_client = ClientService.create_client(data)
        return jsonify(new_client.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route('/<int:id_cliente>', methods=['GET'])
def get_client(id_cliente):
    """
    Obtiene un cliente por su ID.
    """
    try:
        client = ClientService.get_client(id_cliente)
        if not client:
            return jsonify({"error": "Cliente no encontrado"}), 404
        return jsonify(client.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route('/<int:id_cliente>', methods=['PUT'])
def update_cliente(id_cliente):
    """
    Actualiza un cliente en la base de datos y también actualiza sus contratos asociados.
    """
    try:
        data = request.get_json()
        cliente_actualizado = ClientService.update_client(id_cliente, data)

        # ✅ Actualizar todos los contratos del cliente con los nuevos datos
        contratos = Contrato.query.filter_by(id_cliente=id_cliente).all()
        for contrato in contratos:
            ContratoService.update_contrato(contrato.id_contrato)  

        return jsonify({"message": "Cliente y contratos actualizados correctamente."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@client_bp.route('/<int:id_cliente>', methods=['DELETE'])
def delete_client(id_cliente):
    """
    Elimina un cliente.
    """
    try:
        ClientService.delete_client(id_cliente)
        return jsonify({"message": "Cliente eliminado exitosamente"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route('/', methods=['GET'])
def list_clients():
    """
    Lista todos los clientes.
    """
    try:
        clients = ClientService.list_clients()
        return jsonify([client.to_dict() for client in clients]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route('/search/nombre', methods=['GET'])
def search_client_by_name():
    """
    Busca clientes por nombre.
    """
    nombre = request.args.get('nombre')
    if not nombre:
        return jsonify({"error": "El parámetro 'nombre' es requerido"}), 400
    try:
        clients = ClientService.search_client_by_name(nombre)
        return jsonify([client.to_dict() for client in clients]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route('/search/cedula', methods=['GET'])
def search_client_by_cedula():
    """
    Busca clientes por cédula.
    """
    cedula = request.args.get('cedula')
    if not cedula:
        return jsonify({"error": "El parámetro 'cedula' es requerido"}), 400
    try:
        clients = ClientService.search_client_by_cedula(cedula)
        return jsonify([client.to_dict() for client in clients]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route('/search/correo', methods=['GET'])
def search_client_by_correo():
    """
    Busca clientes por correo electrónico.
    """
    correo = request.args.get('correo')
    if not correo:
        return jsonify({"error": "El parámetro 'correo' es requerido"}), 400
    try:
        clients = ClientService.search_client_by_correo(correo)
        return jsonify([client.to_dict() for client in clients]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@client_bp.route("/verificar-cobertura", methods=["POST"])
def verificar_cobertura():
    """
    Verifica si la dirección ingresada tiene cobertura dentro de Riobamba.
    """
    try:
        data = request.json
        direccion = data.get("direccion")

        if not direccion:
            return jsonify({"error": "Debe proporcionar una dirección."}), 400

        # Obtener coordenadas de la dirección usando la API de Google Maps
        lat, lng = ClientService.get_geocode(direccion)

        # Verificar si la ubicación está dentro de Riobamba
        tiene_cobertura = ClientService.is_in_riobamba(lat, lng)

        return jsonify({
            "direccion": direccion,
            "lat": lat,
            "lng": lng,
            "tieneCobertura": tiene_cobertura
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Error en la verificación de cobertura"}), 500

@client_bp.route("/verificar-duplicado", methods=["GET"])
def verificar_cliente_duplicado():
    
    """
    Verifica si ya existe un cliente con la misma cédula, correo o teléfono.
    """
    cedula = request.args.get("cedula")
    correo = request.args.get("correo")
    telefono = request.args.get("telefono")

    cliente = Cliente.query.filter(
        (Cliente.cedula == cedula) | (Cliente.correo == correo) | (Cliente.telefono == telefono)
    ).first()

    if cliente:
        return jsonify({
            "cedula": cliente.cedula,
            "correo": cliente.correo,
            "telefono": cliente.telefono
        }), 200
    
    return jsonify({"message": "No hay coincidencias"}), 404

@client_bp.route('/<int:id_cliente>/contrato', methods=['POST'])
def add_contrato_to_cliente(id_cliente):
    """
    Permite a un cliente contratar un nuevo plan en una nueva dirección.
    """
    try:
        data = request.json
        direccion = data.get("direccion")
        id_plan_servicio = data.get("id_plan_servicio")

        if not direccion or not id_plan_servicio:
            return jsonify({"error": "La dirección y el id_plan_servicio son obligatorios"}), 400

        nuevo_contrato = ClientService.add_contrato_to_cliente(id_cliente, direccion, id_plan_servicio)

        return jsonify(nuevo_contrato.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
