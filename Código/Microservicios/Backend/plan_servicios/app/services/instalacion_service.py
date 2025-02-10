import requests
from app import db
from app.models.instalacion_model import Instalacion
from app.models.orden_instalacion_model import OrdenInstalacion
from twilio.rest import Client
import os

# URL para obtener la lista de técnicos
MICROSERVICIO_USUARIOS_GET_URL = "http://127.0.0.1:5000/api/usuarios/rol"
# URL para actualizar el estado del técnico
MICROSERVICIO_USUARIOS_UPDATE_URL = "http://127.0.0.1:5000/auth/usuarios/actualizar_estado"

class InstalacionService:
    @staticmethod
    def obtener_tecnicos():
        """Obtiene la lista de técnicos desde el microservicio de usuarios."""
        try:
            response = requests.get(MICROSERVICIO_USUARIOS_GET_URL, timeout=5)
            response.raise_for_status()
            return [t for t in response.json() if t["id_rol"] == 4]  # Filtrar técnicos con id_rol = 3
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error al obtener técnicos: {str(e)}")

    @staticmethod
    def asignar_tecnico(id_orden, id_tecnico):
        """Asigna un técnico a una orden de instalación y actualiza su estado en el microservicio."""
        # Verificar si la orden ya tiene una instalación realizada
        instalacion_existente = Instalacion.query.filter_by(id_orden=id_orden, estado="Realizado").first()
        
        if instalacion_existente:
            raise ValueError("Esta orden de instalación ya ha sido realizada y no puede ser asignada nuevamente.")

        tecnicos = InstalacionService.obtener_tecnicos()
        tecnico_disponible = next((t for t in tecnicos if t["id_usuario"] == id_tecnico), None)

        if not tecnico_disponible:
            raise ValueError("El técnico no existe en el sistema.")

        if not tecnico_disponible["estado"]:
            raise ValueError("El técnico seleccionado está ocupado.")

        orden = OrdenInstalacion.query.get(id_orden)
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")

        # Crear un registro en la tabla Instalacion
        nueva_asignacion = Instalacion(
            id_orden=id_orden,
            id_tecnico=id_tecnico,
            estado="En Proceso"
        )
        db.session.add(nueva_asignacion)

        # Marcar el técnico como ocupado en el microservicio (estado = false)
        InstalacionService.actualizar_estado_tecnico(id_tecnico, False)

        db.session.commit()

        # Notificar al técnico por WhatsApp
        InstalacionService.enviar_notificacion(tecnico_disponible["telefono"], id_orden)

        return nueva_asignacion

    @staticmethod
    def listar_instalaciones():
        """Obtiene todas las instalaciones de la base de datos y las devuelve en formato JSON."""
        instalaciones = Instalacion.query.all()
        return [instalacion.to_dict() for instalacion in instalaciones]

    @staticmethod
    def finalizar_instalacion(id_orden):
        """Finaliza la instalación de una orden y actualiza el estado del técnico a disponible."""
        instalacion = Instalacion.query.filter_by(id_orden=id_orden, estado="En Proceso").first()
        if not instalacion:
            raise ValueError("No hay una instalación en proceso para esta orden.")

        instalacion.estado = "Realizado"
        instalacion.fecha_finalizacion = db.func.current_timestamp()

        # Marcar al técnico como disponible nuevamente (estado = true)
        InstalacionService.actualizar_estado_tecnico(instalacion.id_tecnico, True)

        # ✅ También actualizar el estado de la orden de instalación a "Realizado"
        orden = OrdenInstalacion.query.get(id_orden)
        if orden:
            orden.estado = "Realizado"

        db.session.commit()
        return instalacion

    @staticmethod
    def actualizar_estado_tecnico(id_tecnico, estado):
        """Actualiza el estado del técnico en el microservicio de usuarios."""
        url = f"{MICROSERVICIO_USUARIOS_UPDATE_URL}/{id_tecnico}"
        response = requests.put(url, json={"estado": estado})

        if response.status_code != 200:
            raise ValueError(f"Error al actualizar estado del técnico {id_tecnico}: {response.json().get('error')}")
        
    @staticmethod
    def enviar_notificacion(numero_telefono, id_orden):
        """Envía un mensaje de WhatsApp al técnico."""
        client = Client(os.getenv("TWILIO_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
        mensaje = f"🔧 Nueva orden de instalación asignada. ID: {id_orden}. Por favor, revisa el sistema."
        client.messages.create(
            body=mensaje,
            from_=os.getenv("TWILIO_WHATSAPP_NUMBER"),
            to=f"whatsapp:{numero_telefono}"
        )