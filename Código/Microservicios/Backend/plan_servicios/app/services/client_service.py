import requests
import os
from app.models.client_model import Cliente
from app.models.contrato_model import Contrato
from app.models.orden_instalacion_model import OrdenInstalacion
from app.services.contrato_service import ContratoService
from app.services.orden_instalacion import OrdenInstalacionService
from app import db
from datetime import datetime, timedelta, timezone
from email.utils import formatdate
import logging
from sqlalchemy.exc import IntegrityError, DataError
import re
from flask import request, jsonify
#AÑADIR LIBRERIAS PARA LOS MENSAJES A LOS TÉCNICOS
from email.utils import formatdate
import logging
from sqlalchemy.exc import IntegrityError, DataError
import re
import logging
import calendar
import logging

logger = logging.getLogger(__name__)

# Configurar el logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Duración del ciclo fija (en días)
DURACION_CICLO = 30

# Coordenadas por defecto del centro de Riobamba
DEFAULT_LATITUD = -1.6333
DEFAULT_LONGITUD = -78.6667

#PARA LA ZOna horaria de ecuador
ECUADOR_TIMEZONE = timezone(timedelta(hours=-5)) 

class ClientService:
    @staticmethod
    def validate_user(id_usuario):
        """
        Valida si el usuario existe en el microservicio authFlask.
        """
        auth_service_url = f"http://127.0.0.1:5000/api/usuario/{id_usuario}"
        try:
            response = requests.get(auth_service_url)
            if response.status_code == 200:
                return True
            return False
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error al validar el usuario: {e}")

    @staticmethod
    def get_plan_price(id_plan_servicio):
        """
        Obtiene el precio del plan de servicio por su ID.
        """
        plan_service_url = f"http://127.0.0.1:5001/plan_servicios/{id_plan_servicio}"
        try:
            response = requests.get(plan_service_url)
            logger.debug(f"Respuesta del microservicio de planes de servicio: {response.json()}")
            if response.status_code == 200:
                plan_data = response.json()
                precio = plan_data.get('precio')
                if precio is None:
                    logger.error(f"El plan de servicio no contiene precio: {plan_data}")
                return precio
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al obtener el precio del plan de servicio: {e}")
            raise ValueError(f"Error al obtener el precio del plan de servicio: {e}")


    
    def validate_client_data(data):
        """
        Valida que los datos del cliente estén completos y sean válidos.
        """
        # Campos requeridos
        required_fields = ['nombre', 'apellido', 'correo', 'id_plan_servicio', 'cedula', 'direccion', 'telefono']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"El campo {field} es requerido.")

        # Validar el formato del correo electrónico
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data.get('correo')):
            raise ValueError("El formato del correo electrónico no es válido.")

        # Validar el apellido (debe contener al menos 2 caracteres alfabéticos)
        apellido = data.get('apellido')
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]{2,}$", apellido):
            raise ValueError("El apellido no es válido. Debe contener al menos 2 caracteres y solo letras.")

        # Validar el formato de la cédula o RUC
        cedula = data.get('cedula')
        if not re.match(r"^\d{10}(\d{3})?$", cedula):
            raise ValueError("El formato de la cédula o RUC no es válido.")

        # Validar la cédula ecuatoriana o RUC
        if len(cedula) == 10:
            if not ClientService.validar_cedula_ecuador(cedula):
                raise ValueError("La cédula ecuatoriana no es válida.")
        elif len(cedula) == 13:
            cedula_parte = cedula[:10]
            codigo_establecimiento = cedula[10:]
            if not ClientService.validar_cedula_ecuador(cedula_parte):
                raise ValueError("La cédula de los primeros 10 dígitos del RUC no es válida.")
            if codigo_establecimiento != "001":
                raise ValueError("El código de establecimiento del RUC no es válido. Debe ser '001'.")

        # Validar el formato del teléfono
        telefono = data.get('telefono')
        if not re.match(r"^\d{10}$", telefono):
            raise ValueError("El formato del teléfono no es válido. Debe contener exactamente 10 dígitos.")

        # Validar que el plan de servicio exista
        plan_price = ClientService.get_plan_price(data['id_plan_servicio'])
        if plan_price is None:
            raise ValueError("El plan de servicio especificado no existe.")

    @staticmethod
    def validar_cedula_ecuador(cedula):
        """
        Valida el número de cédula ecuatoriana según el algoritmo oficial.
        """
        if len(cedula) != 10:
            return False

        try:
            province_code = int(cedula[:2])
            if province_code < 1 or province_code > 24:  # Verificar provincia válida
                return False

            coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
            total = 0

            for i in range(9):
                product = int(cedula[i]) * coefficients[i]
                if product >= 10:
                    product -= 9
                total += product

            verifier = int(cedula[9])
            return (total % 10 == 0 and verifier == 0) or (10 - (total % 10) == verifier)
        except ValueError:
            return False



    @staticmethod
    def parse_fecha(fecha_str):
        """
        Convierte una fecha en diferentes formatos a un objeto `date`.
        Puede aceptar:
            - "YYYY-MM-DD"
            - "Sat, 08 Mar 2025 05:00:00 GMT"
            - "Sat, 08 Mar 2025 05:00:00"
        """
        formatos_fecha = [
            '%Y-%m-%d',  # "2025-03-08"
            '%a, %d %b %Y %H:%M:%S %Z',  # "Sat, 08 Mar 2025 05:00:00 GMT"
            '%a, %d %b %Y %H:%M:%S'  # "Sat, 08 Mar 2025 05:00:00"
        ]

        for formato in formatos_fecha:
            try:
                fecha_parseada = datetime.strptime(fecha_str, formato).date()
                logger.debug(f"✅ Fecha parseada correctamente: {fecha_parseada} (Original: {fecha_str})")
                return fecha_parseada
            except ValueError:
                continue

        # Si llega aquí, no pudo parsear la fecha
        logger.error(f"❌ Error: Formato de fecha no reconocido: {fecha_str}")
        raise ValueError(f"Formato de fecha no reconocido: {fecha_str}")


    @staticmethod
    def has_active_factura(id_cliente, id_contrato):
        """
        Verifica si el cliente ya tiene una factura activa para el mismo contrato en el ciclo actual.
        """
        today = datetime.utcnow().date()
        mes_actual = today.month
        año_actual = today.year

        response = requests.get(f"http://127.0.0.1:5002/facturacion/facturas/cliente/{id_cliente}")

        if response.status_code == 200:
            facturas = response.json()
            for factura in facturas:
                try:
                    fecha_vencimiento = ClientService.parse_fecha(factura['fecha_vencimiento'])
                    mes_factura = fecha_vencimiento.month
                    año_factura = fecha_vencimiento.year
                except ValueError as e:
                    print(f"❌ Error al convertir fecha de factura: {factura['fecha_vencimiento']} - {e}")
                    continue  

                # ✅ CORRECCIÓN: Validamos que la factura pertenezca al contrato y tenga estado "Pendiente" o "Vencido"
                if (
                    factura.get('id_contrato') == id_contrato and 
                    mes_factura == mes_actual and 
                    año_factura == año_actual and 
                    factura.get('estado') in ['Pendiente', 'Vencido']
                ):
                    print(f"🚨 Cliente {id_cliente} ya tiene una factura activa en el contrato {id_contrato} para {mes_actual}-{año_actual}.")
                    return True


        print(f"✅ Cliente {id_cliente} no tiene facturas activas para el contrato {id_contrato} en {mes_actual}-{año_actual}.")
        return False

    @staticmethod
    def get_geocode(address):
        """
        Obtiene las coordenadas geográficas de una dirección usando la API de Geocoding de Google Maps.
        """
        api_key = os.getenv('GOOGLE_GEOCODING_API_KEY')
        if not api_key:
            raise ValueError("La clave de la API de Google Maps no está configurada.")

        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}"
        response = requests.get(url)
        if response.status_code != 200:
            raise ValueError("Error al obtener las coordenadas geográficas de la dirección.")

        data = response.json()
        if data['status'] != 'OK':
            raise ValueError("No se pudieron obtener las coordenadas geográficas de la dirección.")

        location = data['results'][0]['geometry']['location']
        return location['lat'], location['lng']

    @staticmethod
    def is_in_riobamba(lat, lng):
        """
        Verifica si las coordenadas están dentro de Riobamba, Ecuador.
        """
        # Coordenadas aproximadas de Riobamba
        riobamba_lat = -1.6333
        riobamba_lng = -78.6667
        max_distance = 0.1  # Ajusta según sea necesario

        return abs(lat - riobamba_lat) <= max_distance and abs(lng - riobamba_lng) <= max_distance

    def calcular_proxima_fecha(fecha_actual):
        """Calcula la fecha de vencimiento manteniendo el mismo día del mes o ajustándolo si es necesario."""
        nuevo_mes = fecha_actual.month + 1 if fecha_actual.month < 12 else 1
        nuevo_anio = fecha_actual.year if fecha_actual.month < 12 else fecha_actual.year + 1
        ultimo_dia_mes = calendar.monthrange(nuevo_anio, nuevo_mes)[1]
        nuevo_dia = min(fecha_actual.day, ultimo_dia_mes)

        # Establecemos la fecha con la zona horaria de Ecuador
        fecha_vencimiento = datetime(nuevo_anio, nuevo_mes, nuevo_dia, tzinfo=ECUADOR_TIMEZONE)
        
        print(f" Fecha calculada: {fecha_vencimiento} (Tipo: {type(fecha_vencimiento)})")  # Depuración
        
        return fecha_vencimiento

    @staticmethod
    def create_client(data):
        """
        Crea un cliente en la base de datos después de validar el usuario.
        También genera y guarda un contrato asociado al cliente.
        """
        id_usuario = data.get('id_usuario')
        if not ClientService.validate_user(id_usuario):
            raise ValueError("El usuario especificado no existe.")

        # Validar datos del cliente
        ClientService.validate_client_data(data)

        # Obtener coordenadas geográficas de la dirección
        latitud, longitud = ClientService.get_geocode(data['direccion'])

        # Verificar si la dirección está dentro de Riobamba
        if not ClientService.is_in_riobamba(latitud, longitud):
            raise ValueError("La dirección está fuera de cobertura.")

        # Crear cliente
        new_client = Cliente(
            nombre=data['nombre'],
            apellido=data['apellido'],
            cedula=data['cedula'],
            direccion=data['direccion'],
            telefono=data.get('telefono'),
            correo=data.get('correo'),
            id_usuario=id_usuario,
            id_plan_servicio=data.get('id_plan_servicio'),
            estado=data.get('estado', True),
            creado_en=datetime.utcnow(),
            actualizado_en=datetime.utcnow(),
            latitud=latitud,  # Almacenar latitud
            longitud=longitud  # Almacenar longitud
        )

        try:
            db.session.add(new_client)
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            if 'clientes_cedula_key' in str(e):
                raise ValueError("Ya existe un cliente con la misma cédula.")
            elif 'clientes_correo_key' in str(e):
                raise ValueError("Ya existe un cliente con el mismo correo electrónico.")
            else:
                raise ValueError(f"Error al crear el cliente: {e}")
        except DataError as e:
            db.session.rollback()
            raise ValueError(f"Error de datos al crear el cliente: {e}")

        # ✅ Crear contrato automáticamente
        ContratoService.create_contrato(new_client.id_cliente, new_client.direccion, new_client.id_plan_servicio)

        # ✅ Crear órdenes de instalación para cada contrato sin orden existente
        #contratos = Contrato.query.filter_by(id_cliente=new_client.id_cliente).all()

        #for contrato in contratos:
            # Verificar si ya existe una orden de instalación para la dirección del contrato
         #   existing_orden = OrdenInstalacion.query.filter_by(id_cliente=new_client.id_cliente, direccion_instalacion=contrato.direccion).first()
          #  if not existing_orden:
           #     orden_instalacion_data = {
            #        "id_cliente": new_client.id_cliente,
             #       "direccion_instalacion": contrato.direccion
              #  }
               # OrdenInstalacionService.create_orden_instalacion(orden_instalacion_data)

        return new_client


    @staticmethod
    def get_client(id_cliente):
        """
        Obtiene un cliente por su ID.
        """
        return Cliente.query.get(id_cliente)






    @staticmethod
    def update_client(id_cliente, data):
        """
        Actualiza un cliente existente en la base de datos y sus contratos asociados si hay cambios relevantes.
        """
        try:
            client = Cliente.query.get(id_cliente)
            if not client:
                raise ValueError("Cliente no encontrado.")

            # Validar datos del cliente
            ClientService.validate_client_data(data)

            # Actualizar datos del cliente
            client.nombre = data.get('nombre', client.nombre)
            client.apellido = data.get('apellido', client.apellido)
            client.direccion = data.get('direccion', client.direccion)
            client.telefono = data.get('telefono', client.telefono)
            client.correo = data.get('correo', client.correo)
            client.id_plan_servicio = data.get('id_plan_servicio', client.id_plan_servicio)
            client.actualizado_en = datetime.utcnow()

            # Actualizar coordenadas geográficas si la dirección cambia
            if 'direccion' in data and data['direccion']:
                try:
                    latitud, longitud = ClientService.get_geocode(data['direccion'])
                    client.latitud = latitud
                    client.longitud = longitud

                    if not ClientService.is_in_riobamba(latitud, longitud):
                        raise ValueError("La dirección está fuera de cobertura.")
                except Exception as e:
                    logger.error(f"❌ Error en la geolocalización: {str(e)}")
                    raise ValueError("Error al obtener coordenadas de la dirección.")

            # ✅ Imprimir datos del cliente antes del commit
            logger.debug(f"🔄 Datos del cliente ANTES de commit: {client.__dict__}")

            db.session.commit()
            logger.info(f"✅ Cliente {id_cliente} actualizado correctamente.")

            # ✅ Actualizar TODOS los contratos asociados a este cliente
            contratos = Contrato.query.filter_by(id_cliente=id_cliente).all()
            for contrato in contratos:
                try:
                    logger.debug(f"🔄 Actualizando contrato ID {contrato.id_contrato} para cliente {id_cliente}...")
                    ContratoService.update_contrato(contrato.id_contrato)
                    
                    # ✅ Llamar al microservicio de facturación para actualizar la factura
                    FACTURACION_URL = f"http://127.0.0.1:5002/facturacion/facturas/actualizar/{contrato.id_contrato}"
                    payload = {
                        "id_cliente": client.id_cliente,
                        "nombre": client.nombre,
                        "apellido": client.apellido,
                        "cedula": client.cedula,
                        "telefono": client.telefono,
                        "correo": client.correo,
                        "direccion": contrato.direccion  # ✅ Se toma la dirección del contrato
                    }

                    response = requests.put(FACTURACION_URL, json=payload)

                    if response.status_code != 200:
                        logger.error(f"❌ Error al actualizar factura en microservicio de facturación: {response.status_code} - {response.text}")
                except Exception as e:
                    logger.error(f"❌ Error al actualizar contrato {contrato.id_contrato}: {str(e)}")

            return client

        except Exception as e:
            logger.error(f"❌ Error en update_client: {str(e)}")
            raise ValueError(str(e))






    @staticmethod
    def delete_client(id_cliente):
        """
        Elimina un cliente de la base de datos.
        También elimina el contrato asociado.
        """
        client = Cliente.query.get(id_cliente)
        if not client:
            raise ValueError("Cliente no encontrado.")

        # Eliminar contrato asociado
        ContratoService.delete_contrato(client.id_cliente)  # Llama a la eliminación del contrato

        # Eliminar cliente
        db.session.delete(client)
        db.session.commit()

    @staticmethod
    def list_clients():
        """
        Lista todos los clientes registrados en la base de datos.
        """
        return Cliente.query.order_by(Cliente.apellido.asc()).all()

    @staticmethod
    def search_client_by_name(nombre):
        """
        Busca clientes por nombre.
        """
        return Cliente.query.filter(Cliente.nombre.ilike(f"%{nombre}%")).order_by(Cliente.apellido.asc()).all()

    @staticmethod
    def search_client_by_cedula(cedula):
        """
        Busca clientes por cédula.
        """
        return Cliente.query.filter(Cliente.cedula.ilike(f"%{cedula}%")).order_by(Cliente.apellido.asc()).all()

    @staticmethod
    def search_client_by_correo(correo):
        """
        Busca clientes por correo electrónico.
        """
        return Cliente.query.filter(Cliente.correo.ilike(f"%{correo}%")).order_by(Cliente.apellido.asc()).all()

    @staticmethod
    def get_orden_instalacion(id_orden):
        """
        Obtiene una orden de instalación por su ID.
        """
        return OrdenInstalacion.query.get(id_orden)

    @staticmethod
    def create_orden_instalacion(data):
        """
        Crea una nueva orden de instalación.
        """
        id_cliente = data.get('id_cliente')
        if not Cliente.query.get(id_cliente):
            raise ValueError("El cliente especificado no existe.")

        # Verificar si ya existe una orden de instalación para el cliente
        if OrdenInstalacion.query.filter_by(id_cliente=id_cliente).first():
            raise ValueError("Ya existe una orden de instalación para este cliente.")

        # Crear orden de instalación
        nueva_orden = OrdenInstalacion(
            id_cliente=id_cliente,
            direccion_instalacion=data['direccion_instalacion'],
            pdf=OrdenInstalacionService.generate_pdf(data)  # Generar el PDF
        )
        db.session.add(nueva_orden)
        db.session.commit()

        return nueva_orden

    @staticmethod
    def update_orden_instalacion(id_orden, data):
        """
        Actualiza una orden de instalación existente.
        """
        orden = OrdenInstalacion.query.get(id_orden)
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")

        # Actualizar datos de la orden de instalación
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
        """
        Elimina una orden de instalación.
        """
        orden = OrdenInstalacion.query.get(id_orden)
        if not orden:
            raise ValueError("Orden de instalación no encontrada.")

        db.session.delete(orden)
        db.session.commit()

    # ContratoService
    @staticmethod
    def add_contrato_to_cliente(id_cliente, direccion, id_plan_servicio):
        """
        Agrega un nuevo contrato a un cliente existente, permitiendo cambiar la dirección y el plan de servicio.
        """

        # Buscar el cliente en la base de datos
        cliente = Cliente.query.get(id_cliente)
        if not cliente:
            raise ValueError("Cliente no encontrado.")

        # Normalizar la dirección ingresada
        direccion = direccion.strip().lower()

        # Verificar si el cliente ya tiene un contrato con la misma dirección
        contrato_existente = Contrato.query.filter_by(id_cliente=id_cliente, direccion=direccion).first()
        if contrato_existente:
            raise ValueError("El cliente ya tiene un contrato en esta misma dirección.")

        # Generar el contrato en PDF
        pdf_content = ContratoService.generate_contract_pdf(cliente)

        # Crear un nuevo contrato
        nuevo_contrato = Contrato(
            id_cliente=id_cliente,
            direccion=direccion,
            contenido=f"Contrato de {cliente.nombre} {cliente.apellido} - Plan {id_plan_servicio}",
            archivo=pdf_content
        )

        # Guardar en la base de datos
        db.session.add(nuevo_contrato)
        db.session.commit()

        return nuevo_contrato


