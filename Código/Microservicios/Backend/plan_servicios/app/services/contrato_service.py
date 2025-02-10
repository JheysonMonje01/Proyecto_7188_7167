from fpdf import FPDF
from app.models.contrato_model import Contrato
from app.models.client_model import Cliente
from app.services.orden_instalacion import OrdenInstalacionService
from app import db
import os
import io
from datetime import datetime
from datetime import datetime
import locale
from babel.dates import format_date
import requests
import calendar
from flask import send_file


#--------------------------------------------------------------------------------------
# URL de la API de Google Maps
GOOGLE_GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json"
#--------------------------------------------------------------------------------------



class ContratoService:
    @staticmethod
    def generate_contract_pdf(cliente: Cliente, direccion_contrato: str, id_plan_servicio: int):
        """
        Genera un contrato en formato PDF basado en los datos del cliente.
        Retorna el contenido binario del archivo.
        """
        try:
            print("📄 Iniciando generación del PDF...")

            PLANES_URL = f"http://127.0.0.1:5001/plan_servicios/{id_plan_servicio}"
            response = requests.get(PLANES_URL)

            if response.status_code != 200:
                print(f"❌ Error al obtener datos del plan de servicio {id_plan_servicio}")
                raise ValueError("No se pudo obtener la información del plan de servicio.")

            plan_servicio = response.json()

            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)

            if not pdf.fonts:
                print("⚠️ Advertencia: No se han cargado fuentes en FPDF.")
            # Título del contrato
            pdf.set_font("Arial", style="B", size=16)
            pdf.cell(200, 10, txt="CONTRATO DE PRESTACIÓN DE SERVICIOS", ln=True, align="C")
            pdf.ln(10)

            # Agregar el logo de la empresa
            logo_path = os.path.join(os.path.dirname(__file__), "../path", "logo.jpg")
            logo_path = os.path.abspath(logo_path)
            try:
                pdf.image(logo_path, x=10, y=8, w=30)  # Ajusta x, y y w según el tamaño y posición deseados
            except FileNotFoundError:
                print("Error: Logo no encontrado en la ruta especificada.")

            # Lugar y fecha
            locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')


            pdf.set_font("Arial", size=12)
            pdf.cell(200, 10, txt="Lugar: Riobamba-Ecuador", ln=True)
            fecha_actual = format_date(datetime.now(), format="d 'de' MMMM 'de' y", locale='es')
            pdf.cell(200, 10, txt=f"Fecha: {fecha_actual}", ln=True)
            pdf.ln(10)

            # Datos del prestador
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(200, 10, txt="DATOS DEL PRESTADOR:", ln=True)
            pdf.ln(5)
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Nombre/Razón Social:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="GLOBALSPEED S.A.S", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Dirección:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="Eugenio Espejo y Primera Constituyente", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Provincia:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="Chimborazo", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Cantón:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="Riobamba", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Teléfonos:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="0963210011 0999986917", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="RUC:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="0691780228001", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Correo:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt="globalspeed.ec@gmail.com", border=0, ln=1, align="L")
            pdf.ln(10)

            # Datos del cliente
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(200, 10, txt="DATOS DEL ABONADO/SUSCRIPTOR:", ln=True)
            pdf.ln(5)
            pdf.set_font("Arial", size=12)
            pdf.cell(50, 10, txt="Nombre/Razón Social:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt=f"{cliente.nombre} {cliente.apellido}", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Cédula/RUC:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt=f"{cliente.cedula}", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Email:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt=f"{cliente.correo}", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Dirección del servicio:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt=f"{direccion_contrato}", border=0, ln=1, align="L")
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(50, 10, txt="Celular:", border=0, ln=0, align="L")
            pdf.set_font("Arial", style="", size=12)
            pdf.cell(100, 10, txt=f"{cliente.telefono}", border=0, ln=1, align="L")
            pdf.ln(10)

            # 📌 Datos del Plan de Servicio Contratado
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(200, 10, txt="PLAN DE SERVICIO CONTRATADO:", ln=True)
            pdf.ln(5)
            pdf.set_font("Arial", size=12)
            pdf.cell(50, 10, txt="Nombre del Plan:", ln=0)
            pdf.cell(100, 10, txt=f"{plan_servicio['nombre']}", ln=1)
            pdf.cell(50, 10, txt="Descripción:", ln=0)
            pdf.cell(100, 10, txt=f"{plan_servicio['descripcion']}", ln=1)
            pdf.cell(50, 10, txt="Velocidad de Bajada:", ln=0)
            pdf.cell(100, 10, txt=f"{plan_servicio['velocidad_down']} Kbps", ln=1)
            pdf.cell(50, 10, txt="Velocidad de Subida:", ln=0)
            pdf.cell(100, 10, txt=f"{plan_servicio['velocidad_up']} Kbps", ln=1)
            pdf.cell(50, 10, txt="Precio Mensual:", ln=0)
            pdf.cell(100, 10, txt=f"${plan_servicio['precio']:.2f}", ln=1)
            pdf.ln(10)
            
            # Cláusulas del contrato
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(200, 10, txt="CLAUSULAS:", ln=True)
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 10, txt=(
                "1) CLAUSULA PRIMERA.- Objeto: El prestador del servicio se compromete a proporcionar al abonado "
                "el servicio de acceso a internet bajo las condiciones descritas en este contrato.\n"
                "2) CLAUSULA SEGUNDA.- Vigencia del contrato: El presente contrato tendrá una duración de 24 meses "
                "y entrará en vigencia a partir de la fecha de instalación efectiva del servicio. La fecha inicial "
                "considerada para la facturación para cada uno de los servicios contratados debe ser la de la "
                "activación de servicio. La fecha inicial considerada para la facturación para cada uno de los "
                "servicios contratados debe ser la de la activación de servicio. \n"
                "Las partes se comprometen a respetar el plazo de vigencia pactado, sin perjuicio de que si el"
                "abonado/ suscriptor puede darlo por terminado únicamente, en cualquier tiempo, previa"
                "notificación física o electrónica, con por lo menos 15 días de anticipación, conforme lo"
                "dispuesto en las Leyes Orgánicas de Telecomunicaciones y de Defensa del Consumidor y sin"
                "que para ello este obligado a cancelar multas o recargos de valores de ninguna naturaleza. \n"
                "El abonado acepta la renovación automática sucesiva del contrato en las mismas condiciones"
                "de este contrato, independientemente a su derecho a terminar la relación contractual "
                "conforme la legislación aplicable, o solicitar en cualquier tiempo, con hasta quince (15) días"
                "de antelación a la fecha de renovación, su decisión de no renovación. \n"
                "3) CLAUSULA TERCERA.- Tarifa y forma de pago: Las tarifas o valores mensuales a ser cancelados"
                "por cada uno de los servicios contratados por el abonado estará determinada en la fecha de cada"
                "servicio, que constan en el Anexo 1.\n"
                "4) CLAUSULA SEXTA.- Compra Arriendo de Equipos: GLOBALSPEED arrendará e instalará al CLIENTE los"
                "equipos que se detallan en el ANEXO #2, parte integrante de este contrato. Los equipos que quedan"
                "descritos como propiedad de GLOBALSPEED, y en ningún momento constituye transferencia de los"
                "mismos a terceras personas por objeto de este contrato, por lo tanto, el CLIENTE será responsable"
                "de la custodia de los mismos, mientras dure el presente contrato. Caso contrario se hará "
                "responsable por el valor económico de los mismos (50.00 dólares americanos), teniendo que cancelar"
                "dicho valor a GLOBALSPEED S.A.S.\n"
                "5) CLAUSULA SEPTIMA.- Uso de Información personal: Los datos personales que los usuarios"
                "proporcionen a los prestadores de servicios del régimen general de telecomunicaciones, no podrá"
                "ser usados para la promoción comercial de servicios o productos, inclusive de la propia operadora,"
                "salvo autorización y consentimiento expreso del abonado suscriptor, lo autorice mediante medios "
                "físicos o electrónicos como está conforme lo dispuesto en el artículo 121 del Reglamento General"
                "a la ley Orgánica de Telecomunicaciones.\n\n\n"
                
                f"__________________________                              ___________________________\n"
                f"Ing. Estalin A. Fuentes Salazar Msc                         {cliente.nombre} {cliente.apellido}\n"
                f"GERENTE GLOBALSPEED SAS                              Cédula: {cliente.cedula}\n"     
            
            ))

            # Guardar el contenido como binario
            #pdf_output = pdf.output(dest='S')
            #return pdf_output
            #pdf_buffer = io.BytesIO()
            #pdf.output(pdf_buffer, dest='S')
            #pdf_buffer.seek(0)
            
            #return pdf_buffer.getvalue()
            #pdf_buffer = io.BytesIO()
            #pdf.output(pdf_buffer, dest='S')
            #pdf_buffer.seek(0)

            #pdf_data = pdf_buffer.getvalue()  # ⚠️ Se asegura de obtener el contenido binario

            #if not pdf_data:
            #   print("❌ Error: No se generó el contenido del PDF.")
            #else:
            #   print(f"✅ PDF generado con éxito ({len(pdf_data)} bytes)")

            #return pdf_data 
            #pdf_output = pdf.output(dest='S')
            #return pdf_output
            # Crear buffer para almacenar el PDF
           

            print("✍️ Escribiendo en buffer...")
            pdf.output("test_output.pdf")
            print("✅ Archivo guardado como test_output.pdf")

           # Generar PDF en memoria (Buffer)
            pdf_data = pdf.output(dest='S').encode('latin1')

            if not pdf_data or len(pdf_data) == 0:
                print("❌ ERROR: No se generó el contenido del PDF.")
                return None

            print(f"✅ PDF generado correctamente ({len(pdf_data)} bytes)")
            return pdf_data
        
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return None
    
    
    @staticmethod
    def create_contrato(id_cliente, direccion_ingresada, id_plan_servicio):
        """
        Crea un contrato para un cliente y genera automáticamente la factura correspondiente.
        """

        # Buscar el cliente en la base de datos
        cliente = Cliente.query.get(id_cliente)
        if not cliente:
            raise ValueError("Cliente no encontrado.")

        # Normalizar la dirección ingresada
        direccion_ingresada = direccion_ingresada.strip().lower()

        # Verificar si el cliente ya tiene un contrato en la misma dirección
        contrato_existente = Contrato.query.filter_by(id_cliente=id_cliente, direccion=direccion_ingresada).first()
        if contrato_existente:
            raise ValueError("El cliente ya tiene un contrato en la misma dirección.")

        # ✅ Obtener los detalles del plan de servicio
        PLANES_URL = f"http://127.0.0.1:5001/plan_servicios/{id_plan_servicio}"
        response = requests.get(PLANES_URL)

        if response.status_code != 200:
            print(f"❌ Error al obtener datos del plan de servicio {id_plan_servicio}")
            raise ValueError("No se pudo obtener la información del plan de servicio.")

        plan_servicio = response.json()

        # Generar el contrato en PDF
        pdf_content = ContratoService.generate_contract_pdf(cliente, direccion_ingresada, id_plan_servicio)

        # Crear un nuevo contrato
        nuevo_contrato = Contrato(
            id_cliente=id_cliente,
            direccion=direccion_ingresada,
            id_plan_servicio=id_plan_servicio, 
            contenido=f"Contrato de {cliente.nombre} {cliente.apellido}",
            archivo=pdf_content,
            creado_en=datetime.utcnow()
        )

        # Guardar en la base de datos
        db.session.add(nuevo_contrato)
        db.session.commit()

         # ✅ Crear una nueva orden de instalación
        nueva_orden = OrdenInstalacionService.create_orden_instalacion({
            "id_cliente": id_cliente,
            "direccion_instalacion": direccion_ingresada
        })

        # ✅ Obtener el precio del plan de servicio
        plan_price = plan_servicio["precio"]
        # ✅ Calcular la fecha de vencimiento (formato YYYY-MM-DD)
        fecha_vencimiento = ContratoService.calcular_proxima_fecha(datetime.utcnow().date()).strftime('%Y-%m-%d')

        # ✅ Enviar la solicitud al microservicio de facturación para generar la factura
        factura_data = {
            "id_cliente": id_cliente,
            "id_contrato": nuevo_contrato.id_contrato,  # 📌 Factura con ID del contrato
            "monto": plan_price,
            "fecha_vencimiento": fecha_vencimiento,
            "direccion": direccion_ingresada  # 📌 Se envía la dirección del contrato
        }

        print(f"📤 Enviando datos de factura: {factura_data}")


        response = requests.post('http://127.0.0.1:5002/facturacion/facturas', json=factura_data)

        if response.status_code != 201:
            print(f"❌ Error en facturación: {response.status_code} - {response.text}")
            raise ValueError("No se pudo crear la factura para el nuevo contrato.")

        return nuevo_contrato
    
    @staticmethod
    def get_plan_price(id_plan_servicio):
        """
        Obtiene el precio del plan de servicio asociado al contrato.
        """
        PLAN_SERVICIOS_URL = f"http://127.0.0.1:5001/plan_servicios/{id_plan_servicio}"
        response = requests.get(PLAN_SERVICIOS_URL)
        if response.status_code == 200:
            plan_data = response.json()
            return plan_data.get('precio')
        return None

    @staticmethod
    def calcular_proxima_fecha(fecha_actual):
        """
        Calcula la próxima fecha de vencimiento de la factura.
        """
        nuevo_mes = fecha_actual.month + 1 if fecha_actual.month < 12 else 1
        nuevo_anio = fecha_actual.year if fecha_actual.month < 12 else fecha_actual.year + 1
        ultimo_dia_mes = calendar.monthrange(nuevo_anio, nuevo_mes)[1]
        nuevo_dia = min(fecha_actual.day, ultimo_dia_mes)
        return datetime(nuevo_anio, nuevo_mes, nuevo_dia)

    @staticmethod
    def get_contrato_by_id(id_contrato):
        """
        Obtiene un contrato por su ID.
        """
        contrato = Contrato.query.get(id_contrato)
        if not contrato:
            raise ValueError("Contrato no encontrado.")
        return contrato.to_dict()

    @staticmethod
    def has_active_contrato(cliente_id: int):
        """
        Verifica si el cliente ya tiene un contrato activo.
        """
        return Contrato.query.filter_by(id_cliente=cliente_id).first() is not None

    @staticmethod
    def get_contrato_by_cliente_id(cliente_id: int):
        """
        Obtiene un contrato por el ID del cliente.
        """
        return Contrato.query.filter_by(id_cliente=cliente_id).first()

    @staticmethod
    def get_contrato_by_nombre(nombre: str):
        """
        Obtiene un contrato por el nombre del cliente.
        """
        cliente = Cliente.query.filter_by(nombre=nombre).first()
        if not cliente:
            return None
        return Contrato.query.filter_by(id_cliente=cliente.id_cliente).first()

    @staticmethod
    def get_contrato_by_cedula(cedula: str):
        """
        Obtiene un contrato por la cédula del cliente.
        """
        cliente = Cliente.query.filter_by(cedula=cedula).first()
        if not cliente:
            return None
        return Contrato.query.filter_by(id_cliente=cliente.id_cliente).first()

    @staticmethod
    def list_contratos():
        """
        Lista todos los contratos existentes.
        """
        return Contrato.query.all()

    from flask import send_file
    import io

    @staticmethod
    def download_contrato(contrato_id: int):
        """
        Descarga un contrato específico basado en su ID.
        """

        # Buscar el contrato específico por ID
        contrato = Contrato.query.get(contrato_id)

        if not contrato or not contrato.archivo:
            raise ValueError("Contrato no encontrado o sin archivo almacenado.")
        
        cliente = Cliente.query.get(contrato.id_cliente)
        if not cliente:
            raise ValueError("Cliente no encontrado.")

        print(f"✅ Contrato encontrado: {contrato.contenido}")
        print(f"📂 Tamaño del archivo: {len(contrato.archivo)} bytes")

        # Crear un nombre de archivo único con el ID y la dirección del contrato
        direccion_sanitizada = contrato.direccion.replace(" ", "_").replace(",", "").replace("/", "-")
        nombre_archivo = f"Contrato_{cliente.apellido}_{cliente.nombre}_{direccion_sanitizada}.pdf".replace(" ", "_")

        # Devolver el archivo PDF con Flask
        return send_file(
            io.BytesIO(contrato.archivo),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=nombre_archivo
        )



    @staticmethod
    def update_contrato(id_contrato: int, archivo=None):
        """
        Actualiza el archivo PDF de un contrato existente:
        - Si se sube un nuevo archivo, lo reemplaza.
        - Si no se sube un archivo, se regenera con los datos actuales del cliente.
        """

        contrato = Contrato.query.get(id_contrato)
        if not contrato:
            raise ValueError("Contrato no encontrado.")

        # Obtener el cliente asociado al contrato
        cliente = Cliente.query.get(contrato.id_cliente)
        if not cliente:
            raise ValueError("Cliente asociado no encontrado.")

        if archivo:  # ✅ Si se sube un archivo, reemplazarlo
            print(f"📄 Se ha subido un nuevo archivo PDF, actualizando...")
            pdf_content = archivo.read()  # ✅ Leer el contenido binario del archivo
        else:  # ✅ Si no se sube archivo, regenerarlo automáticamente
            print(f"🔄 Regenerando contrato automáticamente...")
            pdf_content = ContratoService.generate_contract_pdf(cliente, contrato.direccion, contrato.id_plan_servicio)

        # Guardar el nuevo archivo en la base de datos
        contrato.contenido = f"Contrato de {cliente.nombre} {cliente.apellido} {contrato.direccion}"
        contrato.archivo = pdf_content  # ✅ Ahora sí guardamos el binario correctamente

        db.session.commit()
        print(f"✅ Contrato actualizado para {cliente.nombre} {cliente.apellido} {contrato.direccion}")

    

    @staticmethod
    def delete_contrato(cliente_id: int):
        """
        Elimina un contrato asociado a un cliente.
        """
        contrato = Contrato.query.filter_by(id_cliente=cliente_id).first()
        if not contrato:
            raise ValueError("Contrato asociado al cliente no encontrado.")
        db.session.delete(contrato)
        db.session.commit()

    @staticmethod
    def get_contratos_by_id_cliente(id_cliente):
        """
        Obtiene todos los contratos de un cliente por su ID.
        """
        contratos = Contrato.query.filter_by(id_cliente=id_cliente).all()
        if not contratos:
            raise ValueError("No se encontraron contratos para este cliente.")
        
        return [contrato.to_dict() for contrato in contratos]  # Devuelve una lista de contratos en formato diccionario

