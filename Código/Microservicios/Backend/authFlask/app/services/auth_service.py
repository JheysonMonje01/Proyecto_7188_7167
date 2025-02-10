
from app import db, bcrypt
from app.models.usuario import Usuario
from app.models.rol import Rol
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
def registrar_usuario(datos):
    try:
        # Validaciones
        if not datos.get('correo') or not datos.get('contrasenia'):
            return {"error": "El correo y la contraseña son obligatorios."}, 400

        if len(datos['contrasenia']) < 8:
            return {"error": "La contraseña debe tener al menos 8 caracteres."}, 400

        if not any(char.isdigit() for char in datos['contrasenia']):
            return {"error": "La contraseña debe contener al menos un número."}, 400

        if not any(char.isupper() for char in datos['contrasenia']):
            return {"error": "La contraseña debe contener al menos una letra mayúscula."}, 400

        if not any(char.islower() for char in datos['contrasenia']):
            return {"error": "La contraseña debe contener al menos una letra minúscula."}, 400

        if not any(char in "!@#$%^&*()-_=+[]{}|;:,.<>?/" for char in datos['contrasenia']):
            return {"error": "La contraseña debe contener al menos un carácter especial."}, 400

        # Asignar el id_rol 4 por defecto si no se proporciona
        id_rol = datos.get('id_rol', 3)

        # Crear el usuario
        nuevo_usuario = Usuario(
            correo=datos['correo'],
            contrasenia=bcrypt.generate_password_hash(datos['contrasenia']).decode('utf-8'),
            id_rol=id_rol,  # Asignar el rol especificado o el valor por defecto
            telefono=datos.get('telefono')  # Guardar el número de teléfono si se proporciona
        )
        db.session.add(nuevo_usuario)
        db.session.commit()
        return {"message": "Usuario registrado exitosamente"}, 201

    except IntegrityError as e:
        db.session.rollback()  # Deshacer cambios en caso de error
        if 'usuarios_correo_key' in str(e.orig):
            return {"error": "El usuario con este correo ya está registrado."}, 400
        if 'usuarios_telefono_key' in str(e.orig):
            return {"error": "El usuario con este número de teléfono ya está registrado."}, 400
        return {"error": "Error de integridad en la base de datos."}, 500

    except Exception as e:
        db.session.rollback()
        return {"error": f"Error inesperado: {str(e)}"}, 500







"""

from flask import jsonify
def verificar_credenciales(correo, contrasena):
    
    # Obtener la configuración desde el microservicio de clientes
    config = obtener_configuracion_login()
    
    if "error" in config:
        return None, config["error"]  # Si hay un error al obtener la configuración, devolverlo
    
    intentos_maximos = config["intentos_login"]
    tiempo_bloqueo = config["tiempo_bloqueo_login"]

    usuario = Usuario.query.filter_by(correo=correo).first()

    if not usuario:
        return None, "Credenciales inválidas."

    # Verificar si el usuario ha superado el número de intentos
    if usuario.intentos_fallidos >= intentos_maximos:
        return None, f"Cuenta bloqueada. Inténtelo nuevamente en {tiempo_bloqueo} minuto(s)."

    # Verificar si la contraseña es correcta
    if usuario and bcrypt.check_password_hash(usuario.contrasenia, contrasena):
        usuario.intentos_fallidos = 0  # Reiniciar intentos fallidos
        db.session.commit()
        return usuario, None

    # Incrementar intentos fallidos en caso de error
    usuario.intentos_fallidos += 1
    db.session.commit()

    return None, "Credenciales inválidas."
"""





from flask import jsonify

def verificar_credenciales(correo, contrasena):
    """
    Verifica las credenciales de un usuario SIN manejar intentos fallidos en el backend.
    """
    # Obtener la configuración desde el microservicio de clientes
    config = obtener_configuracion_login()

    if "error" in config:
        return None, config["error"]  # Si hay un error al obtener la configuración, devolverlo
    
    intentos_maximos = config["intentos_login"]
    tiempo_bloqueo = config["tiempo_bloqueo_login"]

    usuario = Usuario.query.filter_by(correo=correo).first()

    if not usuario:
        return None, "Credenciales inválidas."

    # 🚀 No se maneja intentos fallidos en el backend, solo verificamos la contraseña
    if bcrypt.check_password_hash(usuario.contrasenia, contrasena):
        return usuario, None

    return None, "Credenciales inválidas."







def tiene_permiso(usuario, tabla, permiso_nombre):
    for permiso in usuario.rol.permisos:
        if permiso.tabla == tabla and getattr(permiso, permiso_nombre):
            return True
    return False


#-------------------------------------------------------------------------


import requests

def obtener_configuracion_login():
    """
    Obtiene los valores de intentos_login y tiempo_bloqueo_login del microservicio de clientes.
    """
    url = "http://127.0.0.1:5001/configuracion/configuracion"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            datos = response.json()
            return {
                "intentos_login": datos.get("intentos_login", 5),  # Valor por defecto: 5 intentos
                "tiempo_bloqueo_login": datos.get("tiempo_bloqueo_login", 1)  # Valor por defecto: 1 minuto
            }
        else:
            return {"error": f"Error al obtener configuración: {response.text}"}
    except requests.RequestException as e:
        return {"error": f"No se pudo conectar con el microservicio de clientes: {str(e)}"}




#PARA OBTENER USUARIOS POR ROL PARA LA TABLA DE TECNICOS

def obtener_usuarios_por_rol(id_rol):
    """
    Busca usuarios que tengan el id_rol especificado.
    """
    try:
        usuarios = Usuario.query.filter_by(id_rol=id_rol).all()
        if not usuarios:
            return {"error": "No se encontraron usuarios con este rol."}, 404

        return [
            {
                "id_usuario": usuario.id_usuario,
                "correo": usuario.correo,
                "id_rol": usuario.id_rol,
                "estado": usuario.estado,
                "creado_en": str(usuario.creado_en),
                "actualizado_en": str(usuario.actualizado_en),
                "telefono":str(usuario.telefono)
            }
            for usuario in usuarios
        ], 200

    except SQLAlchemyError as e:
        return {"error": f"Error al obtener usuarios: {str(e)}"}, 500

def listar_usuarios_por_rol(id_rol=4):
    """
    Lista todos los usuarios que tengan el id_rol específico (por defecto 3).
    """
    return obtener_usuarios_por_rol(id_rol)

#funcion para actualizar estado del usuario
def actualizar_estado_usuario(id_usuario, estado):
    """
    Actualiza el estado de un usuario (técnico) en la base de datos.
    """
    try:
        usuario = Usuario.query.get(id_usuario)
        if not usuario:
            return {"error": "Usuario no encontrado."}, 404

        usuario.estado = estado
        db.session.commit()
        
        return {"message": f"Estado del usuario {id_usuario} actualizado a {'Disponible' if estado else 'Ocupado'}."}, 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return {"error": f"Error al actualizar estado: {str(e)}"}, 500