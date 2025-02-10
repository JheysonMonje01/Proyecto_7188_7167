from flask import Blueprint, request, jsonify
from app.models.usuario import Usuario
from app.models.codigo_verificacion import CodigoVerificacion
from app import db, mail, bcrypt
from flask_mail import Message
from datetime import datetime, timedelta
import random
from twilio.rest import Client
import os
from app.services.recuperacion_service import validar_contrasenia  # Importar la función de validación

recuperacion_routes = Blueprint('recuperacion_routes', __name__)

@recuperacion_routes.route('/solicitar', methods=['POST'])
def solicitar_recuperacion():
    data = request.get_json()
    contacto = data.get('contacto')  # Puede ser correo o número de WhatsApp
    if not contacto:
        return jsonify({'message': 'Debe proporcionar un correo o número de WhatsApp'}), 400

    usuario = Usuario.query.filter((Usuario.correo == contacto) | (Usuario.telefono == contacto)).first()
    if not usuario:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    # Generar código OTP
    codigo = str(random.randint(100000, 999999))
    expira_en = datetime.utcnow() + timedelta(minutes=10)

    # Guardar el código en la base de datos
    nuevo_codigo = CodigoVerificacion(
        id_usuario=usuario.id_usuario,
        codigo=codigo,
        expira_en=expira_en
    )
    db.session.add(nuevo_codigo)
    db.session.commit()

    # Enviar código de verificación
    if '@' in contacto:  # Enviar por correo
        try:
            msg = Message("Recuperación de contraseña", recipients=[contacto])
            msg.body = f"Tu código de verificación es: {codigo}. Este código expira en 10 minutos."
            mail.send(msg)
        except Exception as e:
            return jsonify({'message': f'Error enviando correo: {e}'}), 500
    else:  # Enviar por WhatsApp
        try:
            client = Client(os.getenv('TWILIO_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
            client.messages.create(
                body=f"Tu código de verificación es: {codigo}. Este código expira en 10 minutos.",
                from_=os.getenv('TWILIO_WHATSAPP_NUMBER'),
                to=f"whatsapp:{contacto}"
            )
        except Exception as e:
            return jsonify({'message': f'Error enviando mensaje por WhatsApp: {e}'}), 500

    return jsonify({'message': 'Código de verificación enviado'}), 200


@recuperacion_routes.route('/validar', methods=['POST'])
def validar_codigo():
    data = request.get_json()
    contacto = data.get('contacto')
    codigo = data.get('codigo')

    if not contacto or not codigo:
        return jsonify({'message': 'Debe proporcionar un contacto y un código'}), 400

    usuario = Usuario.query.filter((Usuario.correo == contacto) | (Usuario.telefono == contacto)).first()
    if not usuario:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    # Validar el código
    codigo_verificacion = CodigoVerificacion.query.filter_by(
        id_usuario=usuario.id_usuario,
        codigo=codigo
    ).first()

    if not codigo_verificacion or codigo_verificacion.expira_en < datetime.utcnow():
        return jsonify({'message': 'Código inválido o expirado'}), 400

    return jsonify({'message': 'Código válido'}), 200


@recuperacion_routes.route('/actualizar', methods=['POST'])
def actualizar_contrasenia():
    data = request.get_json()
    contacto = data.get('contacto')  # Obtener el correo o número de teléfono del cliente
    codigo = data.get('codigo')  # Código de verificación ingresado por el cliente
    nueva_contrasenia = data.get('nueva_contrasenia')
    confirmacion_contrasenia = data.get('confirmacion_contrasenia')

    if not contacto or not codigo or not nueva_contrasenia or not confirmacion_contrasenia:
        return jsonify({'message': 'Debe proporcionar el contacto, código, nueva contraseña y su confirmación'}), 400

    if nueva_contrasenia != confirmacion_contrasenia:
        return jsonify({'message': 'Las contraseñas no coinciden'}), 400

    if not validar_contrasenia(nueva_contrasenia):
        return jsonify({'message': 'La contraseña no cumple con los requisitos de seguridad'}), 400

    # Buscar usuario por contacto
    usuario = Usuario.query.filter((Usuario.correo == contacto) | (Usuario.telefono == contacto)).first()
    if not usuario:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    # Validar el código de verificación
    codigo_verificacion = CodigoVerificacion.query.filter_by(
        id_usuario=usuario.id_usuario,
        codigo=codigo
    ).first()

    if not codigo_verificacion or codigo_verificacion.expira_en < datetime.utcnow():
        return jsonify({'message': 'Código inválido o expirado'}), 400

    # Actualizar la contraseña
    usuario.contrasenia = bcrypt.generate_password_hash(nueva_contrasenia).decode('utf-8')
    db.session.commit()

    return jsonify({'message': 'Contraseña actualizada correctamente'}), 200
