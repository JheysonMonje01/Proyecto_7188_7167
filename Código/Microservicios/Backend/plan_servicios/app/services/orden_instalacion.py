#añadido .......................--------------------------------------------------------------------
from sqlalchemy.exc import IntegrityError, DataError
import requests
from app.models.orden_instalacion_model import OrdenInstalacion
from app import db
from datetime import datetime
from sqlalchemy.exc import IntegrityError, DataError
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
from app.models.client_model import Cliente

MICROSERVICIO_USUARIOS_URL = "http://127.0.0.1:5000/api/usuarios/rol"

class OrdenInstalacionService:
    
    #añadido .......................--------------------------------------------------------------------
    @staticmethod
    def create_orden_instalacion(data):
        """
        Crea una nueva orden de instalación solo si no existe una para la misma dirección del cliente.
        """
        id_cliente = data["id_cliente"]
        direccion_instalacion = data["direccion_instalacion"]

        # Verificar si ya existe una orden de instalación para la dirección
        existing_orden = OrdenInstalacion.query.filter_by(id_cliente=id_cliente, direccion_instalacion=direccion_instalacion).first()
        if existing_orden:
            print(f"ℹ️ La orden de instalación ya existe para la dirección {direccion_instalacion}.")
            return existing_orden

        # Crear nueva orden de instalación
        nueva_orden = OrdenInstalacion(
            id_cliente=id_cliente,
            direccion_instalacion=direccion_instalacion,
            estado="Pendiente",
            fecha_creacion=datetime.utcnow(),
            pdf=OrdenInstalacionService.generate_pdf(data)
        )

        db.session.add(nueva_orden)
        db.session.commit()

        return nueva_orden

    
    @staticmethod
    def get_orden_instalacion_by_client_name(nombre):
        cliente = Cliente.query.filter(Cliente.nombre.ilike(f"%{nombre}%")).first()
        if not cliente:
            raise ValueError("Cliente no encontrado.")
        orden = OrdenInstalacion.query.filter_by(id_cliente=cliente.id_cliente).first()
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")
        return orden

    @staticmethod
    def get_orden_instalacion(id_orden):
        orden = OrdenInstalacion.query.get(id_orden)
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")
        return orden
    
    @staticmethod
    def get_orden_instalacion_by_client_cedula(cedula):
        cliente = Cliente.query.filter(Cliente.cedula.ilike(f"%{cedula}%")).first()
        if not cliente:
            raise ValueError("Cliente no encontrado.")
        orden = OrdenInstalacion.query.filter_by(id_cliente=cliente.id_cliente).first()
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")
        return orden

    @staticmethod
    def get_pdf(id_orden):
        orden = OrdenInstalacion.query.get(id_orden)
        if not orden or not orden.pdf:
            raise ValueError("PDF de la orden de instalación no encontrado.")
        return orden.pdf
    
    @staticmethod
    def list_ordenes_instalacion():
        ordenes = OrdenInstalacion.query.all()
        return [orden.to_dict() for orden in ordenes]

    @staticmethod
    def update_orden_instalacion(id_orden, data):
        orden = OrdenInstalacion.query.get(id_orden)
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")

        orden.direccion_instalacion = data.get('direccion_instalacion', orden.direccion_instalacion)
        orden.estado = data.get('estado', orden.estado)
        orden.pdf = data.get('pdf', orden.pdf)
        orden.actualizado_en = datetime.utcnow()

        try:
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            raise ValueError(f"Error al actualizar la orden de instalación: {e}")
        except DataError as e:
            db.session.rollback()
            raise ValueError(f"Error de datos al actualizar la orden de instalación: {e}")

        return orden
    
    @staticmethod
    def delete_orden_instalacion(id_orden):
        orden = OrdenInstalacion.query.get(id_orden)
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")

        db.session.delete(orden)
        db.session.commit()

    @staticmethod
    def generate_pdf(data):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Normal'], alignment=1, fontSize=16, spaceAfter=10)
        normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=12, spaceAfter=10)

        elements = []
        elements.append(Paragraph("Orden de Instalación", title_style))
        elements.append(Spacer(1, 12))

        

        cliente = Cliente.query.get(data['id_cliente'])
        elements.append(Paragraph(f"Cliente: {cliente.nombre} {cliente.apellido}", normal_style))
        elements.append(Paragraph(f"Cédula: {cliente.cedula}", normal_style))
        elements.append(Paragraph(f"Teléfono: {cliente.telefono}", normal_style))
        elements.append(Paragraph(f"Dirección: {data['direccion_instalacion']}", normal_style))
        elements.append(Paragraph(f"Fecha: {datetime.utcnow().strftime('%Y-%m-%d')}", normal_style))

        elements.append(Spacer(1, 24))
        elements.append(Paragraph("Detalles:", title_style))
        elements.append(Paragraph("Aquí se escribirán todos los materiales utilizados en la instalación.", normal_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def asignar_tecnico(id_orden, id_tecnico):
            """Asigna un técnico disponible a una orden de instalación."""
            # Obtener técnicos desde el microservicio
            response = requests.get(MICROSERVICIO_USUARIOS_URL)
            if response.status_code != 200:
                raise ValueError("Error al consultar el microservicio de usuarios.")

            tecnicos = response.json()
            tecnico_disponible = next((t for t in tecnicos if t["id_usuario"] == id_tecnico), None)

            if not tecnico_disponible:
                raise ValueError("El técnico no existe en el sistema.")

            if not tecnico_disponible["estado"]:
                raise ValueError("El técnico seleccionado está ocupado. Intente con otro técnico.")

            # Asignar el técnico y actualizar el estado de la orden
            orden = OrdenInstalacion.query.get(id_orden)
            if not orden:
                raise ValueError("Orden de instalación no encontrada.")

            orden.id_tecnico = id_tecnico
            orden.estado = "En Proceso"
            db.session.commit()

            return orden
