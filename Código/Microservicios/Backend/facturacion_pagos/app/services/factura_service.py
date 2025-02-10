import requests
from app.models.factura import Factura
from app.models import db
from datetime import datetime, timedelta
from fpdf import FPDF
import io
import os
from decimal import Decimal
from sqlalchemy.sql import extract
import threading
import schedule
import time
import calendar
from datetime import datetime, date, timezone, timedelta

CLIENTES_URL = 'http://127.0.0.1:5001/clientes'
CONTRATOS_URL = 'http://127.0.0.1:5001/contratos'
PLAN_SERVICIOS_URL = 'http://127.0.0.1:5001/plan_servicios/'
CONFIGURACION_URL = 'http://127.0.0.1:5001/configuracion/configuracion'
FACTURAS_VENCIDAS_URL = 'http://127.0.0.1:5002/facturacion/facturas/estado'

def get_cliente(id_cliente):
    response = requests.get(f'{CLIENTES_URL}/{id_cliente}')
    if response.status_code == 200:
        return response.json()
    return None

def get_plan_servicio(id_plan_servicio):
    response = requests.get(f'{PLAN_SERVICIOS_URL}{id_plan_servicio}')
    if response.status_code == 200:
        return response.json()
    return None

def get_configuracion():
    response = requests.get(CONFIGURACION_URL)
    if response.status_code == 200:
        return response.json()
    return None

def parse_fecha(fecha_vencimiento):
    """Convierte la fecha a un objeto datetime.date, aceptando distintos formatos."""
    try:
        if isinstance(fecha_vencimiento, datetime):
            return fecha_vencimiento.date()
        elif isinstance(fecha_vencimiento, str):
            try:
                return datetime.strptime(fecha_vencimiento, '%Y-%m-%d').date()
            except ValueError:
                return datetime.strptime(fecha_vencimiento, '%a, %d %b %Y %H:%M:%S %z').date()
        elif isinstance(fecha_vencimiento, (int, float)):  # Si viene como timestamp
            return datetime.utcfromtimestamp(fecha_vencimiento).date()
        elif isinstance(fecha_vencimiento, date):
            return fecha_vencimiento
        else:
            raise ValueError("Formato de fecha no reconocido")
    except ValueError as e:
        raise ValueError(f"Error al procesar la fecha: {e}")



def create_factura(id_cliente, id_contrato, monto_total, fecha_vencimiento, estado, direccion):
    if estado not in ['Pendiente', 'Cancelado', 'Vencido']:
        raise ValueError("Estado de factura no válido. Los estados válidos son: Pendiente, Cancelado, Vencido.")

    if monto_total <= 0:
        raise ValueError("El monto debe ser mayor a cero.")

    fecha_vencimiento = parse_fecha(fecha_vencimiento)
    if fecha_vencimiento <= datetime.utcnow().date():
        raise ValueError("La fecha de vencimiento no puede ser una fecha pasada.")

    # 📌 Obtener los datos del cliente desde el microservicio
    CLIENTES_URL = f"http://127.0.0.1:5001/clientes/{id_cliente}"
    cliente_response = requests.get(CLIENTES_URL)

    if cliente_response.status_code != 200:
        raise ValueError("No se encontró el cliente asociado.")

    cliente = cliente_response.json()  # ✅ Se obtiene correctamente el cliente

    # 📌 Obtener los datos del contrato
    CONTRATOS_URL = f"http://127.0.0.1:5001/contratos/contrato/{id_contrato}"
    contrato_response = requests.get(CONTRATOS_URL)

    if contrato_response.status_code != 200:
        raise ValueError("No se encontró el contrato asociado.")

    contrato = contrato_response.json()

    # ✅ Obtener el plan de servicio correcto desde el contrato
    plan_servicio = get_plan_servicio(contrato['id_plan_servicio'])
    if not plan_servicio:
        raise ValueError("No se pudo obtener el plan de servicio asociado al contrato.")

    nombre_plan = plan_servicio.get("nombre", "Plan Desconocido")

    # ✅ IMPRIMIR LOS DATOS PARA VERIFICAR
    print(f"🔍 Cliente obtenido: {cliente}")
    print(f"📜 Contrato obtenido: {contrato}")
    # ✅ Ahora usamos la dirección del contrato en lugar de la del cliente
     # 📌 Usar la dirección proporcionada en la solicitud
    direccion_factura = direccion  # ✅ Ya no obtenemos la dirección del cliente
    print(f"🏠 Dirección del contrato a usar en la factura: {direccion_factura}")


    # 📌 Verificar que el cliente tiene facturación pendiente para este contrato en el mismo mes
    mes = fecha_vencimiento.month
    año = fecha_vencimiento.year

#-------------------------------------------------------------------------------------
    factura_existente = Factura.query.filter(
        Factura.id_cliente == id_cliente,
        Factura.id_contrato == id_contrato,  #AÑADIR EL ID_CONTRATO ###################################################################################3
        extract('month', Factura.creado_en) == mes,
        extract('year', Factura.creado_en) == año,
        Factura.estado.in_(['Pendiente', 'Vencido'])
    ).first()

#-------------------------------------------------------------------------------------


    if factura_existente:
        raise ValueError(f"El cliente ya tiene una factura para el contrato {id_contrato} en el mes {mes} del año {año}. Solo se permite una factura por mes por contrato.")

    # 📌 Obtener la configuración global (IVA)
    configuracion = get_configuracion()
    iva_porcentaje = configuracion.get('porcentaje_iva', 12)

    # 📌 Calcular IVA y Subtotal
    iva = round(monto_total * (iva_porcentaje / 100), 2)
    subtotal = round(monto_total - iva, 2)

    # 📌 Crear la factura
    factura = Factura(
        id_cliente=id_cliente,
        id_contrato=id_contrato, #--------------- SE AÑADE EL CAMPO DE ID_CONTRATO
        monto=monto_total,
        fecha_vencimiento=fecha_vencimiento,
        estado=estado,
        creado_en=datetime.utcnow(),
        actualizado_en=datetime.utcnow(),
        iva=iva,
        detalle_recargo='',
        total_recargo=0.00
    )

# HASTA ACA EL RESTO DE ESTA FUNCION ES DE LA INFORMACION DEL CONTRATO
#----------------------------------------------------------------------------------------



    # Generar el PDF de la factura
    pdf_buffer = io.BytesIO()
    pdf = FPDF()
    pdf.add_page()

    # Logo
    logo_path = os.path.join(os.path.dirname(__file__), "..", "path", "logo.jpg")
    logo_path = os.path.abspath(logo_path)
    try:
        pdf.image(logo_path, x=10, y=8, w=30)
    except FileNotFoundError:
        print("Error: Logo no encontrado en la ruta especificada.")

    # Encabezado de la empresa
    pdf.set_font("Arial", style='B', size=12)
    pdf.cell(0, 10, "GLOBALSPEED S.A.S", ln=True, align='C')
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, "Dirección Matriz: CHIMBORAZO / RIOBAMBA / LIZARZABURU /", ln=True, align='C')
    pdf.cell(0, 10, "EUGENIO ESPEJO 28 Y PRIMERA CONSTITUYENTE", ln=True, align='C')
    pdf.cell(0, 10, "R.U.C.: 0691780228001", ln=True, align='C')
    pdf.cell(0, 10, "Obligado a llevar contabilidad: Sí", ln=True, align='C')
    pdf.ln(10)

    # Información básica de la factura
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "FACTURA No.:", border=1)
    pdf.set_font("Arial", size=10)  # Volver a fuente normal para el valor
    pdf.cell(60, 10, "001-002-000000780", border=1)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "Fecha de Emisión:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(50, 10, f"{factura.creado_en.strftime('%Y-%m-%d')}", border=1, ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "Clave de Acceso:", border=1)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(160, 10, "0210202401069178022800120010020000007800000078011", border=1, ln=True)
    pdf.ln(10)

    # Datos del cliente
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(0, 10, "Datos del Cliente:", ln=True)
    pdf.cell(40, 10, "Nombre:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{cliente['nombre']} {cliente['apellido']}", border=1, ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "Identificación:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{cliente['cedula']}", border=1, ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "Dirección:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{direccion_factura}", border=1, ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "Correo:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{cliente['correo']}", border=1, ln=True)
    pdf.ln(10)

    # Detalles de productos o servicios
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(0, 10, "Detalle de Productos o Servicios:", ln=True)
    pdf.set_font("Arial", size=10)
    pdf.cell(50, 10, "Descripción", border=1)
    pdf.cell(40, 10, "Cantidad", border=1)
    pdf.cell(40, 10, "Precio Unitario", border=1)
    pdf.cell(40, 10, "Total", border=1, ln=True)

    plan_servicio = get_plan_servicio(contrato['id_plan_servicio'])
    if plan_servicio:
        pdf.cell(50, 10, f"{plan_servicio['nombre']}", border=1)
        pdf.cell(40, 10, "1", border=1, align='C')
        pdf.cell(40, 10, f"{subtotal:.2f}", border=1, align='R')
        pdf.cell(40, 10, f"{monto_total:.2f}", border=1, align='R', ln=True)

    # Totales
    pdf.ln(10)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(100, 10, "Subtotal:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(90, 10, f"{subtotal:.2f}", border=1, align='R', ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(100, 10, f"IVA {iva_porcentaje}%:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(90, 10, f"{iva:.2f}", border=1, align='R', ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(100, 10, "Total a Pagar:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(90, 10, f"{monto_total:.2f}", border=1, align='R', ln=True)

    # Guardar PDF en BytesIO
    pdf.output(dest='S').encode('latin1')  # Generar el contenido binario del PDF
    pdf_buffer.write(pdf.output(dest='S').encode('latin1'))
    pdf_buffer.seek(0)

    # Guardar el PDF en el modelo de la factura
    factura.pdf_factura = pdf_buffer.read()
    pdf_buffer.close()
    
    # Guardar en la base de datos
    db.session.add(factura)
    db.session.commit()

    return {
        'id_factura': factura.id_factura,
        'id_cliente': factura.id_cliente,
        'monto': factura.monto,
        'fecha_vencimiento': factura.fecha_vencimiento.strftime('%Y-%m-%d'),  # 🔹 Forzar formato correcto
        'estado': factura.estado,
        'creado_en': factura.creado_en.strftime('%Y-%m-%d %H:%M:%S'),
        'actualizado_en': factura.actualizado_en.strftime('%Y-%m-%d %H:%M:%S'),
        'iva': factura.iva,
        'detalle_recargo': factura.detalle_recargo,
        'total_recargo': factura.total_recargo,
    #------------------------------------------------------------------------------------------------
        'id_contrato': factura.id_contrato,
        'direccion_contrato': direccion_factura
    }

def get_factura(id_factura):
    factura = Factura.query.get(id_factura)
    return factura

@staticmethod
def get_factura_id(id_factura):
        """
        Obtiene un pago por su ID.
        """
        factura = Factura.query.get(id_factura)
        if not factura:
            raise ValueError("Pago no encontrado.")
        return factura.to_dict()

def get_factura_cliente(id_cliente):
    factura = Factura.query.get(id_cliente)
    return factura

@staticmethod
def get_facturas_by_cliente(id_cliente):
        facturas = Factura.query.filter_by(id_cliente=id_cliente).all()
        return [
            {
                'id_factura': factura.id_factura,
                'id_cliente': factura.id_cliente,
                'monto': factura.monto,
                'fecha_vencimiento': factura.fecha_vencimiento,
                'estado': factura.estado,
                'creado_en': factura.creado_en,
                'actualizado_en': factura.actualizado_en,
                'iva': factura.iva,  # Incluir el IVA en la respuesta
                "detalle_recargo": factura.detalle_recargo,
            "total_recargo": float(factura.total_recargo),
            "pdf_factura": "Archivo adjunto" if factura.pdf_factura else None,
            "id_contrato": factura.id_contrato
            } for factura in facturas
        ]

@staticmethod
def descargar_factura(id_factura: int):
    factura = Factura.query.get(id_factura)
    
    if not factura or not factura.pdf_factura:
        raise ValueError("Factura no encontrada o sin archivo almacenado.")
    
    # 📌 Obtener el contrato desde el microservicio de contratos
    CONTRATO_URL = f"http://127.0.0.1:5001/contratos/contrato/{factura.id_contrato}"
    contrato_response = requests.get(CONTRATO_URL)
    # ✅ Obtener el contrato asociado
    if contrato_response.status_code != 200:
        raise ValueError("Contrato asociado no encontrado.")

    contrato = contrato_response.json()
    direccion_contrato = contrato.get('direccion', 'Dirección no disponible')  # ✅ Dirección correcta

    # 📌 Obtener el cliente desde el microservicio
    CLIENTE_URL = f"http://127.0.0.1:5001/clientes/{factura.id_cliente}"
    cliente_response = requests.get(CLIENTE_URL)

    if cliente_response.status_code != 200:
        raise ValueError("Cliente no encontrado.")

    cliente = cliente_response.json()

    print(f"✅ Factura encontrada: {factura.pdf_factura}")
    print(f"📂 Tamaño del archivo: {len(factura.pdf_factura)} bytes")
    print(f"📜 Contrato asociado: {contrato}")
    print(f"🏠 Dirección del contrato usada en la descarga: {direccion_contrato}")

    # ✅ Incluir la dirección del contrato en el nombre del archivo
    nombre_archivo = f"Factura_{cliente['apellido']}_{cliente['nombre']}_{direccion_contrato}.pdf".replace(" ", "_")
    
    return factura.pdf_factura, nombre_archivo




def get_facturas_by_cliente(id_cliente):
    facturas = Factura.query.filter_by(id_cliente=id_cliente).all()
    return [
        {
            'id_factura': factura.id_factura,
            'id_cliente': factura.id_cliente,
            'monto': factura.monto,
            'fecha_vencimiento': factura.fecha_vencimiento.strftime('%Y-%m-%d'),  # 🔹 Asegurar formato correcto
            'estado': factura.estado,
            'creado_en': factura.creado_en.strftime('%Y-%m-%d %H:%M:%S'),
            'actualizado_en': factura.actualizado_en.strftime('%Y-%m-%d %H:%M:%S'),
            'iva': factura.iva,
            'detalle_recargo': factura.detalle_recargo,
            'total_recargo': factura.total_recargo,
            'id_contrato': factura.id_contrato  ########################################################################################3
        } for factura in facturas
    ]




def get_facturas_vencidas_by_cliente(id_cliente):
    response = requests.get(f'{FACTURAS_VENCIDAS_URL}?estado=Vencido&id_cliente={id_cliente}')
    if response.status_code == 200:
        facturas = response.json()
        # Filtrar las facturas por id_cliente
        facturas_filtradas = [factura for factura in facturas if factura['id_cliente'] == id_cliente]
        if facturas_filtradas:
            return facturas_filtradas
        else:
            return {"error": "No se encontraron facturas vencidas para este cliente"}
    return {"error": "No se pudo obtener las facturas vencidas"}



def update_factura(id_factura, detalle_recargo=None, total_recargo=None, estado=None,):
    factura = Factura.query.get(id_factura)
    if not factura:
        raise ValueError("Factura no encontrada.")
    if detalle_recargo:
        factura.detalle_recargo = detalle_recargo
    if total_recargo is not None:
        total_recargo = Decimal(total_recargo)
        if total_recargo < 0:
            raise ValueError("No se permiten valores negativos para el total_recargo.")
        factura.total_recargo = total_recargo

    # Actualizar el monto total de la factura
    factura.monto = Decimal(factura.monto) + factura.total_recargo

    # Obtener los datos del cliente
    cliente = get_cliente(factura.id_cliente)

    # Obtener la configuración global para el porcentaje de IVA
    configuracion = get_configuracion()
    iva_porcentaje = configuracion['porcentaje_iva']

    # Generar el PDF de la factura
    pdf_buffer = io.BytesIO()
    pdf = FPDF()
    pdf.add_page()

    # Logo
    logo_path = os.path.join(os.path.dirname(__file__), "..", "path", "logo.jpg")
    logo_path = os.path.abspath(logo_path)
    try:
        pdf.image(logo_path, x=10, y=8, w=30)
    except FileNotFoundError:
        print("Error: Logo no encontrado en la ruta especificada.")

    # Encabezado de la empresa
    pdf.set_font("Arial", style='B', size=12)
    pdf.cell(0, 10, "GLOBALSPEED S.A.S", ln=True, align='C')
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, "Dirección Matriz: CHIMBORAZO / RIOBAMBA / LIZARZABURU /", ln=True, align='C')
    pdf.cell(0, 10, "EUGENIO ESPEJO 28 Y PRIMERA CONSTITUYENTE", ln=True, align='C')
    pdf.cell(0, 10, "R.U.C.: 0691780228001", ln=True, align='C')
    pdf.cell(0, 10, "Obligado a llevar contabilidad: Sí", ln=True, align='C')
    pdf.ln(10)

    # Información básica de la factura
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(40, 10, "FACTURA No.:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(60, 10, "001-002-000000780", border=1)
    pdf.set_font("Arial", style='B', size=10) 
    pdf.cell(40, 10, "Fecha de Emisión:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(50, 10, f"{factura.creado_en.strftime('%Y-%m-%d')}", border=1, ln=True)
    pdf.set_font("Arial", style='B', size=10) 
    pdf.cell(40, 10, "Clave de Acceso:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(160, 10, "0210202401069178022800120010020000007800000078011", border=1, ln=True)
    pdf.ln(10)

    # Datos del cliente
    pdf.set_font("Arial", style='B', size=10)  # Establecer negrilla
    pdf.cell(0, 10, "Datos del Cliente:", ln=True)

    # Ahora, para cada etiqueta (Nombre, Identificación, Dirección, Correo), ponemos la fuente en negrilla antes de imprimirla
    pdf.set_font("Arial", style='B', size=10)  
    pdf.cell(40, 10, "Nombre:", border=1)

    pdf.set_font("Arial", size=10)  # Volver a fuente normal para el valor
    pdf.cell(150, 10, f"{cliente['nombre']} {cliente['apellido']}", border=1, ln=True)

    pdf.set_font("Arial", style='B', size=10)  
    pdf.cell(40, 10, "Identificación:", border=1)

    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{cliente['cedula']}", border=1, ln=True)

    pdf.set_font("Arial", style='B', size=10)  
    pdf.cell(40, 10, "Dirección:", border=1)

    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{cliente['direccion']}", border=1, ln=True)

    pdf.set_font("Arial", style='B', size=10)  
    pdf.cell(40, 10, "Correo:", border=1)

    pdf.set_font("Arial", size=10)
    pdf.cell(150, 10, f"{cliente['correo']}", border=1, ln=True)

    pdf.ln(10)  # Salto de línea

        
    
    

    # Detalles de productos o servicios
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(0, 10, "Detalle de Productos o Servicios:", ln=True)
    pdf.cell(50, 10, "Descripción", border=1)
    pdf.cell(40, 10, "Cantidad", border=1)
    pdf.cell(40, 10, "Precio Unitario", border=1)
    pdf.cell(40, 10, "Total", border=1, ln=True)




    plan_servicio = get_plan_servicio(cliente['id_plan_servicio'])
    if plan_servicio:
        pdf.set_font("Arial", size=10)
        pdf.cell(50, 10, f"{plan_servicio['nombre']}", border=1)
        pdf.cell(40, 10, "1", border=1, align='C')
        pdf.cell(40, 10, f"{factura.monto - factura.iva - factura.total_recargo:.2f}", border=1, align='R')
        pdf.cell(40, 10, f"{factura.monto:.2f}", border=1, align='R', ln=True)

    # Recargos
    if factura.detalle_recargo:
        pdf.set_font("Arial", style='B', size=10)  # Establecer negrilla antes de imprimir "Recargos:"
        pdf.cell(0, 10, "Recargos:", ln=True)
        
        pdf.set_font("Arial", size=10)  # Volver a la fuente normal para los detalles
        pdf.cell(50, 10, "Detalle", border=1)
        pdf.cell(40, 10, "Total", border=1, ln=True)
        
        pdf.cell(50, 10, factura.detalle_recargo, border=1)
        pdf.cell(40, 10, f"{factura.total_recargo:.2f}", border=1, ln=True)


    # Totales
    pdf.ln(10)
    pdf.set_font("Arial", style='B', size=10) 
    pdf.cell(100, 10, "Subtotal:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(90, 10, f"{factura.monto - factura.iva - factura.total_recargo:.2f}", border=1, align='R', ln=True)
    pdf.set_font("Arial", style='B', size=10)
    pdf.cell(100, 10, f"IVA {iva_porcentaje}%:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(90, 10, f"{factura.iva:.2f}", border=1, align='R', ln=True)
    pdf.set_font("Arial", style='B', size=10) 
    pdf.cell(100, 10, "Total a Pagar:", border=1)
    pdf.set_font("Arial", size=10)
    pdf.cell(90, 10, f"{factura.monto:.2f}", border=1, align='R', ln=True)

    # Guardar PDF en BytesIO
    pdf.output(dest='S').encode('latin1')  # Generar el contenido binario del PDF
    pdf_buffer.write(pdf.output(dest='S').encode('latin1'))
    pdf_buffer.seek(0)

    # Guardar PDF en BytesIO y asignarlo a la factura
    pdf_content = pdf.output(dest='S').encode('latin1')
    factura.pdf_factura = pdf_content
    
    factura.actualizado_en = datetime.utcnow()
    db.session.commit()
    return {
        'id_factura': factura.id_factura,
        'id_cliente': factura.id_cliente,
        'monto': factura.monto,
        'fecha_vencimiento': factura.fecha_vencimiento,
        'estado': factura.estado,
        'creado_en': factura.creado_en,
        'actualizado_en': factura.actualizado_en,
        'iva': factura.iva,  # Incluir el IVA en la respuesta
        'detalle_recargo': factura.detalle_recargo,
        'total_recargo': factura.total_recargo,
        
#--------------------------------------------------------------------------------------------------------------
# SE AÑADE LA COLUMNA ID_CONTRATO
        'id_contrato':factura.id_contrato      ###################################################################################################
    }

def delete_factura(id_factura):
    factura = Factura.query.get(id_factura)
    if not factura:
        raise ValueError("Factura no encontrada.")
    db.session.delete(factura)
    db.session.commit()
    return True

def get_facturas_by_estado(estado):
    """
    Lista todas las facturas por su estado.
    """
    facturas = Factura.query.filter_by(estado=estado).all()
    return [
        {
            'id_factura': factura.id_factura,
            'id_cliente': factura.id_cliente,
            'monto': factura.monto,
            'fecha_vencimiento': factura.fecha_vencimiento,
            'estado': factura.estado,
            'creado_en': factura.creado_en,
            'actualizado_en': factura.actualizado_en,
            'iva': factura.iva,  # Incluir el IVA en la respuesta
            'detalle_recargo': factura.detalle_recargo,
            'total_recargo': factura.total_recargo,
#--------------------------------------------------------------------------------------------------------------
# SE AÑADE LA COLUMNA ID_CONTRATO
            'id_contrato':factura.id_contrato   ####################################################################################3
        } for factura in facturas
    ]
ECUADOR_TIMEZONE = timezone(timedelta(hours=-5))

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


def create_new_factura_if_vencimiento(id_factura):
    """
    Crea una nueva factura si la fecha de vencimiento de la factura actual es hoy.
    """
    factura = Factura.query.get(id_factura)
    if not factura:
        print(f"❌ Error: Factura {id_factura} no encontrada.")
        return None

    print(f"⚠️ Factura {factura.id_factura} está vencida. Creando nueva factura...")

    # Cambiar el estado a "Vencido"
    factura.estado = 'Vencido'
    db.session.commit()

    # Obtener datos del cliente y del plan de servicio
    cliente = get_cliente(factura.id_cliente)
    if not cliente:
        print(f"❌ Error: Cliente {factura.id_cliente} no encontrado.")
        return None

    plan_servicio = get_plan_servicio(cliente['id_plan_servicio'])
    if not plan_servicio:
        print(f"❌ Error: No se encontró el plan de servicio para el cliente {cliente['id_cliente']}")
        return None

    print(f"📢 Cliente {cliente['nombre']} tiene el plan {plan_servicio['nombre']} con precio {plan_servicio['precio']}")

    # Obtener la fecha correcta
    nueva_fecha_vencimiento = calcular_proxima_fecha(datetime.utcnow().date())  # Asegurar que sea futura

    print(f"✅ Nueva fecha de vencimiento calculada: {nueva_fecha_vencimiento}")

    try:
        nueva_factura = create_factura(
            factura.id_cliente,
            factura.id_contrato,  ##########################################################################################################3
            plan_servicio['precio'],
            nueva_fecha_vencimiento,
            'Pendiente'
        )
        print(f"✅ Factura creada con ID {nueva_factura['id_factura']} y fecha {nueva_factura['fecha_vencimiento']}")
        return nueva_factura
    except ValueError as e:
        print(f"❌ Error al crear nueva factura: {e}")
        return None


def procesar_facturas_vencidas():
    facturas_vencidas = Factura.query.filter(Factura.fecha_vencimiento <= datetime.utcnow().date(), Factura.estado != 'Vencido').all()
    for factura in facturas_vencidas:
        create_new_factura_if_vencimiento(factura.id_factura)

def verificar_facturas_vencidas(app):
    """
    Revisa todas las facturas y si alguna está vencida, la marca como 'Vencido'
    y genera una nueva factura.
    """
    with app.app_context():  # ✅ Usa `app` en lugar de `current_app`
        print(f"⏳ Verificando facturas vencidas... {datetime.utcnow()}")

        facturas_vencidas = Factura.query.filter(
            Factura.fecha_vencimiento <= datetime.utcnow().date(),
            Factura.estado != 'Vencido'
        ).all()

        for factura in facturas_vencidas:
            print(f"⚠️ Factura {factura.id_factura} vencida. Creando nueva...")
            create_new_factura_if_vencimiento(factura.id_factura)

        print(f"✅ Facturas procesadas: {len(facturas_vencidas)}")

# ✅ Modifica esta función para aceptar `app` como argumento
def ejecutar_scheduler(app):
    """
    Ejecuta el programador en un hilo separado dentro del contexto de la aplicación.
    """
    with app.app_context():  # ✅ Se asegura de que tenga acceso a la BD
        schedule.every(1).minutes.do(verificar_facturas_vencidas, app)

        while True:
            schedule.run_pending()
            time.sleep(60)  # Revisar cada minuto si hay algo pendiente


def list_facturas():
    """
    Lista todas las facturas ordenadas por fecha de vencimiento de manera ascendente.
    """
    facturas = Factura.query.order_by(Factura.fecha_vencimiento.asc()).all()
    return [
        {
            'id_factura': factura.id_factura,
            'id_cliente': factura.id_cliente,
            'monto': factura.monto,
            'fecha_vencimiento': factura.fecha_vencimiento,
            'estado': factura.estado,
            'creado_en': factura.creado_en,
            'actualizado_en': factura.actualizado_en,
            'iva': factura.iva,  # Incluir el IVA en la respuesta
            'detalle_recargo': factura.detalle_recargo,
            'total_recargo': factura.total_recargo,
            'id_contrato':factura.id_contrato
        } for factura in facturas
    ]
