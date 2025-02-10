from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.services.auth_service import registrar_usuario, verificar_credenciales, actualizar_estado_usuario
import requests

auth_routes = Blueprint('auth_routes', __name__)

# Ruta para registrar usuarios
@auth_routes.route('/register', methods=['POST'])
def register():
    datos = request.get_json()
    return registrar_usuario(datos)

# Ruta para iniciar sesión
@auth_routes.route('/login', methods=['POST'])
def login():
    datos = request.get_json()
    usuario, error = verificar_credenciales(datos['correo'], datos['contrasenia'])

    if error:  # Si hay un error en las credenciales
        return jsonify({"message": error}), 401

    # Convertir el ID del usuario a string al generar el token
    access_token = create_access_token(identity=str(usuario.id_usuario))

    return jsonify({"access_token": access_token}), 200

# Nueva ruta para enviar un mensaje a otro microservicio mediante HTTP
@auth_routes.route('/enviar-mensaje', methods=['POST'])
def enviar_mensaje():
    datos = request.get_json()
    microservicio_url = "http://localhost:5001/api/mensaje"  # URL del microservicio receptor
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.post(microservicio_url, json=datos, headers=headers)
        if response.status_code == 200:
            return jsonify({"message": "Mensaje enviado correctamente al microservicio"}), 200
        else:
            return jsonify({"error": f"Error al enviar mensaje: {response.text}"}), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": f"No se pudo conectar con el microservicio: {e}"}), 500

from app.services.auth_service import obtener_configuracion_login
@auth_routes.route('/configuracion-login', methods=['GET'])
def configuracion_login():
    """
    Obtiene la configuración de intentos de login y tiempo de bloqueo desde el microservicio de clientes.
    """
    config = obtener_configuracion_login()
    return jsonify(config), 200

#ruta para ACTUALIZAR estado 
@auth_routes.route('/usuarios/actualizar_estado/<int:id_usuario>', methods=['PUT'])
def actualizar_estado(id_usuario):
    """
    Ruta para actualizar el estado de un usuario.
    """
    datos = request.get_json()
    nuevo_estado = datos.get("estado")

    if nuevo_estado is None:
        return jsonify({"error": "El campo 'estado' es obligatorio (true/false)."}), 400

    return actualizar_estado_usuario(id_usuario, nuevo_estado)

