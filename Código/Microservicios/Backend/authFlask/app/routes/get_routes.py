from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.usuario import Usuario
from flask import Blueprint, jsonify, request
from app.services.auth_service import obtener_usuarios_por_rol, listar_usuarios_por_rol, tiene_permiso
from app.models.rol import Rol
from app import db, bcrypt



get_routes = Blueprint('get_routes', __name__)

@get_routes.route('/protected', methods=['GET'])
#@jwt_required()
def protected_route():
    user_id = get_jwt_identity()
    usuario = Usuario.query.get(user_id)
    if not tiene_permiso(usuario, 'leer'):
        return jsonify({"message": "Permiso denegado"}), 403

    return jsonify({
        "message": "Acceso concedido a la ruta protegida.",
        "user": user_id
    }), 200

@get_routes.route('/usuario/<int:id_usuario>', methods=['GET'])
#@jwt_required()
def obtener_usuario_por_id_route(id_usuario):
    usuario = Usuario.query.filter_by(id_usuario=id_usuario).first()
    if usuario:
        return jsonify({
            "id_usuario": usuario.id_usuario,
            "correo": usuario.correo,
            "id_rol": usuario.id_rol,
            "estado": usuario.estado,
            "creado_en": str(usuario.creado_en),
            "actualizado_en": str(usuario.actualizado_en)
        }), 200
    return jsonify({"error": "El usuario especificado no existe."}), 404

@get_routes.route('/usuario', methods=['GET'])
#@jwt_required()
def obtener_usuario_por_correo_route():
    correo = request.args.get('correo')
    if not correo:
        return jsonify({"error": "El parámetro 'correo' es requerido"}), 400

    usuario = Usuario.query.filter_by(correo=correo).first()
    if usuario:
        return jsonify({
            "id_usuario": usuario.id_usuario,
            "correo": usuario.correo,
            "id_rol": usuario.id_rol,
            "estado": usuario.estado,
            "creado_en": str(usuario.creado_en),
            "actualizado_en": str(usuario.actualizado_en)
        }), 200
    return jsonify({"error": "El usuario especificado no existe."}), 404

@get_routes.route('/usuarios', methods=['GET'])
#@jwt_required()  # Puedes habilitar JWT si lo necesitas
def obtener_todos_los_usuarios():
    rol = Rol.query.all()
    usuarios = Usuario.query.all()  # Obtiene todos los registros de la tabla Usuario
    if usuarios:
        # Serializa los datos de cada usuario
        usuarios_serializados = [
            {
                "id_usuario": usuario.id_usuario,
                "correo": usuario.correo,
                "id_rol": usuario.id_rol,
                "estado": usuario.estado,
                "telefono": usuario.telefono,
                "creado_en": str(usuario.creado_en),
                "actualizado_en": str(usuario.actualizado_en)
            }
            for usuario in usuarios
        ]
        return jsonify(usuarios_serializados), 200
    return jsonify({"error": "No hay usuarios registrados."}), 404

#RUTAS PARA OBTENER EL ROL PARA TÉCNICOS 
#get_routes = Blueprint('get_routes', __name__)

#@get_routes.route('/usuarios/rol/<int:id_rol>', methods=['GET'])
#def obtener_usuarios_por_rol_route(id_rol):
    
    #Ruta para obtener usuarios con un id_rol específico.
    
   # usuarios, status_code = obtener_usuarios_por_rol(id_rol)
   # return jsonify(usuarios), status_code






@get_routes.route('/usuarios/rol', methods=['GET'])
def listar_usuarios_por_rol_route():

    #Ruta para listar todos los usuarios con id_rol=3 por defecto.
    
    usuarios, status_code = listar_usuarios_por_rol()
    return jsonify(usuarios), status_code


@get_routes.route('/rol/<int:id_rol>', methods=['GET'])
def obtener_rol_por_id(id_rol):
    # Busca el rol por el id_rol proporcionado
    rol = Rol.query.filter_by(id_rol=id_rol).first()
    if rol:
        return jsonify({
            "id_rol": rol.id_rol,
            "rol": rol.rol,
            "descripcion": rol.descripcion
        }), 200
    return jsonify({"error": "El rol especificado no existe."}), 404


@get_routes.route('/usuarios/activos', methods=['GET'])
def obtener_usuarios_activos():
    total_usuarios = Usuario.query.filter_by(estado=True).count()
    return jsonify({"total_usuarios": total_usuarios}), 200

# Función para actualizar un usuario
@get_routes.route('/usuario/<int:id_usuario>', methods=['PUT'])
def actualizar_usuario_service(id_usuario):
    usuario = Usuario.query.get(id_usuario)
    if not usuario:
        return {"error": "Usuario no encontrado"}, 404
    # Obtener los datos enviados en el request
    data = request.get_json()

    if not data:
        return jsonify({"error": "Datos inválidos o faltantes"}), 400
    
    if "correo" in data:
        usuario.correo = data["correo"]
    if "id_rol" in data:
        usuario.id_rol = data["id_rol"]
    if "estado" in data:
        usuario.estado = data["estado"]
    if "telefono" in data:
        usuario.telefono = data["telefono"]
    if "contrasenia" in data:
        usuario.contrasenia = bcrypt.generate_password_hash(data['contrasenia']).decode('utf-8')

    # Actualizar la fecha de actualización automáticamente
    usuario.actualizado_en = db.func.current_timestamp()

    try:
        db.session.commit()
        return jsonify({"mensaje": "Usuario actualizado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al actualizar el usuario", "detalle": str(e)}), 500

# Ruta para eliminar un usuario
@get_routes.route('/usuario/<int:id_usuario>', methods=['DELETE'])
#@jwt_required()
def eliminar_usuario(id_usuario):
    usuario = Usuario.query.get(id_usuario)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    db.session.delete(usuario)
    db.session.commit()
    return jsonify({"mensaje": "Usuario eliminado correctamente"}), 200

@get_routes.route('/rol', methods=['POST'])
#@jwt_required()
def crear_rol():
    data = request.get_json()
    if not data.get("rol") or not data.get("descripcion"):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    nuevo_rol = Rol(
        rol=data["rol"],
        descripcion=data["descripcion"]
    )

    db.session.add(nuevo_rol)
    db.session.commit()
    return jsonify({"mensaje": "Rol creado correctamente", "id_rol": nuevo_rol.id_rol}), 201
# Ruta para actualizar un rol
@get_routes.route('/rol/<int:id_rol>', methods=['PUT'])
#@jwt_required()
def actualizar_rol(id_rol):
    rol = Rol.query.get(id_rol)
    if not rol:
        return jsonify({"error": "Rol no encontrado"}), 404

    data = request.get_json()
    if "rol" in data:
        rol.rol = data["rol"]
    if "descripcion" in data:
        rol.descripcion = data["descripcion"]

    db.session.commit()
    return jsonify({"mensaje": "Rol actualizado correctamente"}), 200

# Ruta para eliminar un rol
@get_routes.route('/rol/<int:id_rol>', methods=['DELETE'])
#@jwt_required()
def eliminar_rol(id_rol):
    rol = Rol.query.get(id_rol)
    if not rol:
        return jsonify({"error": "Rol no encontrado"}), 404

    db.session.delete(rol)
    db.session.commit()
    return jsonify({"mensaje": "Rol eliminado correctamente"}), 200

@get_routes.route('/roles', methods=['GET'])
def obtener_roles():
    """
    Obtiene la lista de roles disponibles.
    """
    roles = Rol.query.all()

    if not roles:
        return jsonify({"error": "No hay roles disponibles"}), 404

    # Serializar la lista de roles
    roles_serializados = [
        {
            "id_rol": rol.id_rol,
            "rol": rol.rol,
            "descripcion": rol.descripcion
        } for rol in roles
    ]

    return jsonify(roles_serializados), 200