"""from flask import Flask, request, jsonify
from flask_cors import CORS
from claude.api import get_internet_plans, query_claude, get_greeting, COMPANY_INFO, get_geocode, is_within_coverage, COVERAGE_RADIUS,clientes_conteo

app = Flask(__name__)
CORS(app)

conversation_state = {}

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '').lower()  # Convertir a minúsculas para un mejor manejo de las palabras clave
    print("Contenido recibido del frontend:", user_message)

    # Mensaje de saludo inicial
    greeting = get_greeting()

    response_text = None

    # Diccionario de respuestas rápidas
    quick_responses = {
        "planes de internet": lambda: f"Estos son los planes disponibles:\n{get_internet_plans()}",
        "servicios de internet": lambda: "La empresa ofrece el servicio de fibra óptica.",
        "tiempo se tarda la instalacion": lambda: "Menos de 24 horas después de firmar el contrato.",
        "cargos extra por la instalacion": lambda: "Al contratar por primera vez los costos son gratuitos, pero si ya has contratado el servicio y quieres alguna instalación adicional, tiene un recargo a su factura.",
        "costos adicionales": lambda: "Al contratar por primera vez los costos son gratuitos, pero si ya has contratado el servicio y quieres alguna instalación adicional, tiene un recargo a su factura.",
        "metodos de pago": lambda: f"Efectivo si se acerca a la oficina en {COMPANY_INFO['Direccion']}, o pagos en línea con las tarjeta de crédito o debito en la plataforma",
        "retraso en un pago": lambda: "Hay posibilidades que le desactiven el servicio de internet",
        "no funciona mi internet": lambda: f"Contactarse al número de la empresa {COMPANY_INFO['Telefono']} para su solución con los técnicos.",
        "precio": lambda: f"Los precios de los planes de internet:\n{get_internet_plans()}",
        "velocidad": lambda: f"Las velocidades de los planes de internet:\n{get_internet_plans()}",
        "direccion de la empresa": lambda: f"La empresa se encuentra en {COMPANY_INFO['Direccion']}.",
        "dónde están": lambda: f"La empresa se encuentra en {COMPANY_INFO['Direccion']}.",
        "numero de telefono de la empresa": lambda: f"Puedes contactarnos al {COMPANY_INFO['Telefono']}.",
        "contacto": lambda: f"Puedes contactarnos al {COMPANY_INFO['Telefono']}.",
        "nombre de la empresa": lambda: f"El nombre de la empresa es {COMPANY_INFO['Empresa']}.",
        "como se llama": lambda: f"El nombre de la empresa es {COMPANY_INFO['Empresa']}.",
        "dueño de la empresa": lambda: f"El dueño de la empresa es {COMPANY_INFO['Dueño']}.",
        "propietario": lambda: f"El dueño de la empresa es {COMPANY_INFO['Dueño']}.",
        "clientes": lambda: f"Nuestra empresa cuenta hasta el momento con \n{clientes_conteo()} clientes",
        "horario de atencion": lambda: f"El horario es de {COMPANY_INFO['Horario']}.",
    }

    # Buscar respuesta rápida basada en palabras clave
    for keyword, response_func in quick_responses.items():
        if keyword in user_message:
            response_text = response_func()
            break

    # Verificar cobertura
    if response_text is None and ("quiero contratar el servicio" in user_message or "direccion es" in user_message):
        if "direccion es" in user_message or "mi direccion es" in user_message:
            print("Entra a direccion:", user_message)
            # Extraer la dirección del mensaje del cliente
            address = user_message.split("es", 1)[1].strip()
            try:
                # Obtener coordenadas de la dirección
                lat, lng = get_geocode(address)

                # Verificar cobertura
                if is_within_coverage(lat, lng, COMPANY_INFO["Coordenadas"], COVERAGE_RADIUS):
                    response_text = f"¡Perfecto! Tu dirección tiene cobertura. Estos son los planes de internet disponibles:\n{get_internet_plans()}\n¿Te interesa alguno de estos planes?"
                    conversation_state['plans_shown'] = True
                else:
                    response_text = "Lo siento, pero tu dirección no tiene cobertura con nuestra empresa."

            except ValueError as e:
                response_text = f"Hubo un problema al verificar tu dirección: {str(e)}"
        else:
            response_text = "Por favor, indícame tu dirección para verificar si tienes cobertura."

    # Manejo de seguimiento después de mostrar los planes
    elif response_text is None and "me interesa" in user_message and conversation_state.get('plans_shown'):
        response_text = f"¡Excelente! Por favor, acércate a nuestra empresa en {COMPANY_INFO['Direccion']} para firmar el contrato y activar tu servicio. Si necesitas más información, contáctanos al {COMPANY_INFO['Telefono']}."
    elif response_text is None and "no tienes" in user_message and conversation_state.get('plans_shown'):
        response_text = "Gracias por tu tiempo. ¿Podrías decirnos qué características o servicios te gustaría que ofrezcamos en el futuro? Esto nos ayudará a mejorar."

    # Consulta genérica si no se encuentra coincidencia
    if response_text is None:
        response_text = query_claude(f"Lo siento, no puedo proporcionarte esa información en este momento.")

    return jsonify({
        "greeting": greeting,
        "response": response_text
    })

if __name__ == '__main__':
    app.run(debug=True)"""
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from claude.api import get_internet_plans, query_claude, get_greeting, COMPANY_INFO, get_geocode, is_within_coverage, COVERAGE_RADIUS, clientes_conteo

app = Flask(__name__)
CORS(app)

conversation_state = {}

# Respuestas rápidas con expresiones regulares
quick_responses = {
        "planes de internet": lambda: f"Estos son los planes disponibles:\n{get_internet_plans()}",
        "servicios de internet": lambda: "La empresa ofrece el servicio de fibra óptica.",
        "tiempo se tarda la orden de instalacion": lambda: "Menos de 24 horas después de firmar el contrato.",
        "cargos extra por la instalacion": lambda: "Al contratar por primera vez los costos son gratuitos, pero si ya has contratado el servicio y quieres alguna instalación adicional, tiene un recargo a su factura.",
        "costos adicionales": lambda: "Al contratar por primera vez los costos son gratuitos, pero si ya has contratado el servicio y quieres alguna instalación adicional, tiene un recargo a su factura.",
        "metodos de pago": lambda: f"Efectivo si se acerca a la oficina en {COMPANY_INFO['Direccion']}, o pagos en línea con tarjeta de crédito o débito en la plataforma.",
        "retraso en un pago": lambda: "Hay posibilidades que le desactiven el servicio de internet.",
        "no funciona mi internet": lambda: f"Contactarse al número de la empresa {COMPANY_INFO['Telefono']} para su solución con los técnicos.",
        "precio": lambda: f"Los precios de los planes de internet:\n{get_internet_plans()}",
        "velocidad": lambda: f"Las velocidades de los planes de internet:\n{get_internet_plans()}",
        "direccion de la empresa": lambda: f"La empresa se encuentra en {COMPANY_INFO['Direccion']}.",
        "donde estan": lambda: f"La empresa se encuentra en {COMPANY_INFO['Direccion']}.",
        "numero de telefono de la empresa": lambda: f"Puedes contactarnos al {COMPANY_INFO['Telefono']}.",
        "contacto": lambda: f"Puedes contactarnos al {COMPANY_INFO['Telefono']}.",
        "nombre de la empresa": lambda: f"El nombre de la empresa es {COMPANY_INFO['Empresa']}.",
        "como se llama": lambda: f"El nombre de la empresa es {COMPANY_INFO['Empresa']}.",
        "dueño de la empresa": lambda: f"El dueño de la empresa es {COMPANY_INFO['Dueño']}.",
        "propietario": lambda: f"El dueño de la empresa es {COMPANY_INFO['Dueño']}.",
        "gerente": lambda: f"El dueño de la empresa es {COMPANY_INFO['Dueño']}.",
        "clientes": lambda: f"Nuestra empresa cuenta hasta el momento con {clientes_conteo()} clientes.",
        "horario de atencion": lambda: f"El horario es de {COMPANY_INFO['Horario']}.",
        "cambiar de plan": lambda: f"Claro, puedes cambiar de plan. Por favor, contacta con nosotros para más detalles al {COMPANY_INFO['Telefono']}.",
        "cancelar": lambda: f"Puedes cancelar tu servicio acercándote a nuestras oficinas en {COMPANY_INFO['Direccion']} o contactándonos directamente al teléfono al {COMPANY_INFO['Telefono']}",
        "reportar un fallo": lambda: f"Para reportar un fallo, por favor llama al {COMPANY_INFO['Telefono']} o envía un mensaje por nuestra plataforma.",
        "descargar mi factura": lambda: "Puedes descargar tu factura desde nuestra plataforma en línea ingresando a tu cuenta.",
        "pausar temporalmente el servicio": lambda: "Puedes pausar temporalmente tu servicio. Por favor, contacta con soporte técnico para más información.",
    }

# Convertir palabras clave en expresiones regulares precompiladas
quick_responses_regex = {re.compile(rf"\b{re.escape(k)}\b", re.IGNORECASE): v for k, v in quick_responses.items()}


@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '').lower().strip()
    print("Mensaje recibido:", user_message)

    greeting = get_greeting()
    response_text = None

    # Buscar respuesta rápida basada en expresiones regulares
    for pattern, response_func in quick_responses_regex.items():
        if pattern.search(user_message):
            response_text = response_func()
            break

    # Verificar cobertura si el usuario menciona su dirección
    # Verificar cobertura
    if response_text is None and ("quiero contratar el servicio" in user_message or "direccion es" in user_message):
        if "direccion es" in user_message or "mi direccion es" in user_message:
            print("Entra a direccion:", user_message)
            # Extraer la dirección del mensaje del cliente
            address = user_message.split("es", 1)[1].strip()
            try:
                # Obtener coordenadas de la dirección
                lat, lng = get_geocode(address)

                # Verificar cobertura
                if is_within_coverage(lat, lng, COMPANY_INFO["Coordenadas"], COVERAGE_RADIUS):
                    response_text = f"¡Perfecto! Tu dirección tiene cobertura. Estos son los planes de internet disponibles:\n{get_internet_plans()}\n¿Te interesa alguno de estos planes?"
                    conversation_state['plans_shown'] = True
                else:
                    response_text = "Lo siento, pero tu dirección no tiene cobertura con nuestra empresa."

            except ValueError as e:
                response_text = f"Hubo un problema al verificar tu dirección: {str(e)}"
        else:
            response_text = "Por favor, indícame tu dirección para verificar si tienes cobertura."

    # Manejo de seguimiento después de mostrar los planes
    elif response_text is None and "me interesa" in user_message and conversation_state.get('plans_shown'):
        response_text = f"¡Excelente! Para contratar el servicio, visítanos en {COMPANY_INFO['Direccion']} o llámanos al {COMPANY_INFO['Telefono']}."

    elif response_text is None and "no tienes" in user_message and conversation_state.get('plans_shown'):
        response_text = "Lo siento. ¿Podrías decirnos qué características te gustaría que ofrezcamos en el futuro?"

    for keyword, response_func in quick_responses.items():
        if keyword in user_message:
            # Generar una respuesta básica
            basic_response = response_func()
            # Mejorar la respuesta usando la API de Claude
            response_text = query_claude(f"Responda de manera rapida y corta la respuesta para un cliente: {basic_response}")
            break

    # Si no se encontró una respuesta rápida, se consulta la API de Claude
    if response_text is None:
        response_text = "Lo siento, no puedo proporcionarte esa información en este momento. Por favor, contáctanos directamente para ayudarte mejor."

    return jsonify({
        "greeting": greeting,
        "response": response_text
    })


if __name__ == '__main__':
    app.run(debug=True, port=5004)
