
import logging
from app.models.servicio_internet_model import ServicioInternet
from app.models.historial_cambios_model import HistorialCambios
from app.services.historial_cambios_service import HistorialCambiosService
from datetime import datetime, timedelta
import requests

# Configurar el logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ServicioInternetService:
    @staticmethod
    def get_servicio_by_cliente_id(db, id_cliente):
        logger.debug(f"Buscando servicio para el cliente con ID: {id_cliente}")
        servicio = ServicioInternet.query.filter_by(id_cliente=id_cliente).first()
        if servicio:
            logger.debug(f"Servicio encontrado: {servicio.to_dict()}")
        else:
            logger.debug(f"No se encontró servicio para el cliente con ID: {id_cliente}")
        return servicio

    @staticmethod
    def crear_servicio_internet(db, id_cliente):
        logger.debug(f"Creando servicio de internet para el cliente con ID: {id_cliente}")
        nuevo_servicio = ServicioInternet(
            id_cliente=id_cliente,
            estado=False,
            ancho_banda=10,  # Puedes ajustar el ancho de banda según sea necesario
            creado_en=datetime.utcnow(),
            actualizado_en=datetime.utcnow()
        )
        db.session.add(nuevo_servicio)
        db.session.commit()
        logger.debug(f"Servicio de internet creado: {nuevo_servicio.to_dict()}")
        return nuevo_servicio

    @staticmethod
    def obtener_ip_por_cliente(id_cliente):
        # Lógica para obtener la IP estática asociada al cliente
        # Esto es un ejemplo, ajusta según tu lógica
        if id_cliente == 1:
            return "192.168.88.254"
        elif id_cliente == 2:
            return "192.168.88.253"
        else:
            raise ValueError("IP no encontrada para el cliente.")

    @staticmethod
    def activar_servicio(db, id_cliente):
        logger.debug(f"Activando servicio para el cliente con ID: {id_cliente}")
        servicio = ServicioInternetService.get_servicio_by_cliente_id(db, id_cliente)
        if not servicio:
            logger.debug(f"No se encontró servicio para el cliente con ID: {id_cliente}. Creando nuevo servicio.")
            servicio = ServicioInternetService.crear_servicio_internet(db, id_cliente)

        servicio.estado = True
        servicio.actualizado_en = datetime.utcnow()
        db.session.commit()

        # Registrar cambio en el historial
        HistorialCambiosService.registrar_cambio(
            id_servicio=servicio.id_servicio,
            id_configuracion=1,
            campo_modificado="estado",
            valor_anterior="False",
            valor_nuevo="True",
            id_usuario=1  # Puedes ajustar el ID del usuario según sea necesario
        )

        # Obtener la IP asociada al cliente
        ip_address = ServicioInternetService.obtener_ip_por_cliente(id_cliente)

        # Llamar al script de Mikrotik para activar el servicio
        response = requests.get(f"http://127.0.0.1:5003/activar/{ip_address}")
        if response.status_code != 200:
            raise ValueError("Error al activar el servicio en Mikrotik.")

        return servicio

    @staticmethod
    def desactivar_servicio(db, id_cliente):
        logger.debug(f"Desactivando servicio para el cliente con ID: {id_cliente}")
        servicio = ServicioInternetService.get_servicio_by_cliente_id(db, id_cliente)
        if not servicio:
            logger.debug(f"No se encontró servicio para el cliente con ID: {id_cliente}. Creando nuevo servicio.")
            servicio = ServicioInternetService.crear_servicio_internet(db, id_cliente)

        servicio.estado = False
        servicio.actualizado_en = datetime.utcnow()
        db.session.commit()

        # Registrar cambio en el historial
        HistorialCambiosService.registrar_cambio(
            id_servicio=servicio.id_servicio,
            campo_modificado="estado",
            valor_anterior="True",
            valor_nuevo="False",
            id_usuario=1  # Puedes ajustar el ID del usuario según sea necesario
        )

        # Obtener la IP asociada al cliente
        ip_address = ServicioInternetService.obtener_ip_por_cliente(id_cliente)

        # Llamar al script de Mikrotik para desactivar el servicio
        response = requests.get(f"http://127.0.0.1:5003/desactivar/{ip_address}")
        if response.status_code != 200:
            raise ValueError("Error al desactivar el servicio en Mikrotik.")

        return servicio

    @staticmethod
    def actualizar_fecha_corte(db, id_cliente, fecha_corte):
        logger.debug(f"Actualizando fecha de corte para el cliente con ID: {id_cliente}")
        servicio = ServicioInternetService.get_servicio_by_cliente_id(db, id_cliente)
        if not servicio:
            logger.debug(f"No se encontró servicio para el cliente con ID: {id_cliente}. Creando nuevo servicio.")
            servicio = ServicioInternetService.crear_servicio_internet(db, id_cliente)

        # Validar que la fecha de corte no sea el mismo día o una fecha anterior al día actual
        if fecha_corte <= datetime.utcnow():
            raise ValueError("La fecha de corte debe ser posterior al día actual.")

        servicio.fecha_corte_programada = fecha_corte
        servicio.actualizado_en = datetime.utcnow()
        db.session.commit()

        # Registrar cambio en el historial
        HistorialCambiosService.registrar_cambio(
            id_servicio=servicio.id_servicio,
            campo_modificado="fecha_corte_programada",
            valor_anterior=str(servicio.fecha_corte_programada),
            valor_nuevo=str(fecha_corte),
            id_usuario=1  # Puedes ajustar el ID del usuario según sea necesario
        )

        return servicio
 
    
    
    @staticmethod
    def verificar_facturas_vencidas(db):
        logger.debug("Verificando facturas vencidas para clientes")
        # Lista de IDs de clientes a verificar
        clientes = [1, 2]  # IDs de los clientes
        for id_cliente in clientes:
            try:
                # Consultar facturas vencidas para este cliente
                response = requests.get(f"http://127.0.0.1:5002/facturacion/facturas/vencidas/cliente/{id_cliente}")
                
                if response.status_code == 200:
                    facturas = response.json()  # Obtener las facturas vencidas del cliente actual
                    servicio = ServicioInternetService.get_servicio_by_cliente_id(db, id_cliente)

                    if servicio:  # Verificar que el servicio existe
                        if facturas and len(facturas) > 0:  # Si hay facturas vencidas
                            if servicio.estado:  # Solo desactivar si está activo
                                logger.debug(f"Cliente con ID {id_cliente} tiene facturas vencidas. Desactivando servicio.")
                                ServicioInternetService.desactivar_servicio(db, id_cliente)
                        else:  # Si no hay facturas vencidas
                            if not servicio.estado:  # Solo activar si está desactivado
                                logger.debug(f"Cliente con ID {id_cliente} no tiene facturas vencidas. Activando servicio.")
                                ServicioInternetService.activar_servicio(db, id_cliente)
                            else:
                                logger.debug(f"Cliente con ID {id_cliente} no tiene facturas vencidas y el servicio ya está activado.")
                    else:
                        logger.warning(f"No se encontró servicio asociado al cliente con ID {id_cliente}.")
                elif response.status_code == 404:
                    logger.debug(f"No se encontraron facturas vencidas para el cliente con ID {id_cliente}.")
                    servicio = ServicioInternetService.get_servicio_by_cliente_id(db, id_cliente)
                    if servicio and not servicio.estado:
                        logger.debug(f"Activando servicio para el cliente con ID {id_cliente} ya que no tiene facturas vencidas.")
                        ServicioInternetService.activar_servicio(db, id_cliente)
                else:
                    logger.error(f"Error al consultar facturas para el cliente con ID {id_cliente}. Código de estado: {response.status_code}")
            except Exception as e:
                logger.error(f"Error al procesar facturas vencidas para el cliente con ID {id_cliente}: {e}")

        
        

    @staticmethod
    def verificar_fechas_corte(db):
        logger.debug("Verificando fechas de corte para todos los clientes")
        servicios = ServicioInternet.query.all()
        for servicio in servicios:
            if servicio.fecha_corte_programada and servicio.fecha_corte_programada <= datetime.utcnow():
                logger.debug(f"Fecha de corte programada para el cliente con ID {servicio.id_cliente} ha llegado. Desactivando servicio.")
                ServicioInternetService.desactivar_servicio(db, servicio.id_cliente)



