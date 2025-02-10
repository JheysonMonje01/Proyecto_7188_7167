from flask import Flask, request, jsonify
import requests
import psycopg2
import os
from datetime import datetime
import math
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import googlemaps

app = Flask(__name__)

PLAN_SERVICIOS_URL = 'http://127.0.0.1:5001/plan_servicios/planes'
CLIENTES_URL = 'http://127.0.0.1:5001/clientes/'

# Información de la empresa
COMPANY_INFO = {
    "Empresa": "Global Speed",
    "Direccion": "Espejo y Primera Constituyente - Riobamba",
    "Telefono": "0992606326",
    "Dueño": "Estalin Andres Fuentes",
    "Coordenadas": (-1.6727148391242193, -78.64881917583548),
    "Horario": "Lunes a Viernes apartir de las 8am hasta las 17pm"
}

COVERAGE_RADIUS = 40  # Rango de cobertura en kilómetros

def clientes_conteo():
    response = requests.get(f'{CLIENTES_URL}/clientes/activos')
    if response.status_code == 200:
        data = response.json()
        return data.get("total_usuarios", 0)  # Obtiene el valor de "total_usuarios", o 0 si no existe
    return 0 

def get_plan_servicio():
    response = requests.get(f'{PLAN_SERVICIOS_URL}')
    if response.status_code == 200:
        return response.json()
    return None

def get_internet_plans():
    """Consulta los planes de internet a través de la API de plan_servicios."""
    try:
        response = requests.get(PLAN_SERVICIOS_URL)

        # Verificar si la respuesta fue exitosa
        if response.status_code == 200:
            plans = response.json()

            # Formatear los resultados
            if not plans:
                return "Actualmente no hay planes de internet disponibles."

            plans_text = "\n".join([
                f"- {plan['nombre']}: {plan['descripcion']}. Velocidad de descarga: {plan['velocidad_down']} Mbps, subida: {plan['velocidad_up']} Mbps. Precio: ${plan['precio']}."
                for plan in plans
            ])
            return plans_text
        else:
            return f"Error al obtener los planes: {response.status_code} - {response.reason}"
    except requests.RequestException as e:
        print(f"Error al conectar con la API: {e}")
        return "Lo siento, no se pudieron obtener los planes de internet en este momento."
    
def query_claude(prompt):
    """Consulta la API de Claude."""
    if not prompt or not isinstance(prompt, str):  # Verificar que el prompt sea un string válido
        print("El contenido del prompt es inválido.")
        return "Hubo un problema al generar la respuesta."
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }
    data = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 512,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        return response.json()["content"][0]["text"]
    else:
        print(f"Error al consultar la API de Claude: {response.text}")
        return "Hubo un problema al generar la respuesta."

def get_greeting():
    """Genera un saludo dependiendo de la hora actual."""
    current_hour = datetime.now().hour
    if current_hour < 12:
        return "¡Buenos días! ¿En qué puedo ayudarte?"
    elif current_hour < 18:
        return "¡Buenas tardes! ¿En qué puedo ayudarte?"
    else:
        return "¡Buenas noches! ¿En qué puedo ayudarte?"
    
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

def is_within_coverage(lat, lng, company_coords, coverage_radius):
    """
    Verifica si unas coordenadas están dentro del rango de cobertura.
    """
    distance = geodesic((lat, lng), company_coords).kilometers
    return distance <= coverage_radius
