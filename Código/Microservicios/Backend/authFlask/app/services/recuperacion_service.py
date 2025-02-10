import random
import string
from datetime import datetime, timedelta
from app import db
from app.models.codigo_verificacion import CodigoVerificacion
from twilio.rest import Client
import os

# Configuración de Twilio
TWILIO_SID = os.getenv('TWILIO_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')

if not all([TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER]):
    raise ValueError("Las credenciales de Twilio no están configuradas correctamente en el entorno.")

client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

def generar_codigo_verificacion():
    """Genera un código aleatorio de 6 dígitos."""
    return ''.join(random.choices(string.digits, k=6))

def enviar_codigo_verificacion(contacto, codigo):
    """Envía el código de verificación por WhatsApp."""
    try:
        client.messages.create(
            body=f"Tu código de verificación es: {codigo}. Este código expira en 15 minutos.",
            from_=TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{contacto}"
        )
        return True
    except Exception as e:
        # Registrar el error en los logs para depuración
        print(f"Error al enviar el mensaje con Twilio: {e}")
        return False

def guardar_codigo_verificacion(id_usuario, codigo):
    """Guarda el código de verificación en la base de datos."""
    expira_en = datetime.utcnow() + timedelta(minutes=15)
    nuevo_codigo = CodigoVerificacion(
        id_usuario=id_usuario,
        codigo=codigo,
        expira_en=expira_en
    )
    db.session.add(nuevo_codigo)
    db.session.commit()

def validar_contrasenia(password):
    """Valida que la contraseña cumpla con los requisitos de seguridad."""
    import re
    regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':\"\\|,.<>\/?]{8,}$"
    return re.match(regex, password) is not None
