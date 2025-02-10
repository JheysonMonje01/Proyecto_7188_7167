"""from flask import Flask
import routeros_api

app = Flask(__name__)

# Configurar la conexión a Mikrotik
def conectar_mikrotik():
    connection = routeros_api.RouterOsApiPool(
        '192.168.101.33', 
        username='admin', 
        password='G4L1L30.30', 
        plaintext_login=True,
        port=8728,
        use_ssl=False,
        ssl_verify=False
    )
    return connection.get_api(), connection

# Configuración inicial de Mikrotik
def configurar_mikrotik():
    api, connection = conectar_mikrotik()
    try:
        # Verificar si ya existe un cliente DHCP en ether3
        dhcp_clients = api.get_resource('/ip/dhcp-client').get(interface='ether3')
        if not dhcp_clients:
            # Si no existe, añadir cliente DHCP en ether3 (adaptador puente)
            api.get_resource('/ip/dhcp-client').add(interface='ether3', disabled='no')

        # Verificar si ya existe la dirección IP en ether2
        ip_addresses = api.get_resource('/ip/address').get(interface='ether2', address='192.168.88.1/24')
        if not ip_addresses:
            # Si no existe, asignar dirección IP a ether2 (red interna)
            api.get_resource('/ip/address').add(address='192.168.88.1/24', interface='ether2')
        
        # Agregar regla NAT para enmascarar tráfico
        api.get_resource('/ip/firewall/nat').add(
            chain='srcnat', action='masquerade', 
            src_address='192.168.88.0/24', out_interface='ether3'
        )

        # Configurar DNS
        api.get_resource('/ip/dns').set(
            servers='8.8.8.8,8.8.4.4', allow_remote_requests='yes'
        )

        # Configurar el pool de direcciones DHCP
        dhcp_pools = api.get_resource('/ip/pool').get(name='dhcp_pool')
        if not dhcp_pools:
            api.get_resource('/ip/pool').add(
                name='dhcp_pool', ranges='192.168.88.2-192.168.88.254'
            )

        # Configurar el servidor DHCP
        dhcp_servers = api.get_resource('/ip/dhcp-server').get(name='dhcp1')
        if not dhcp_servers:
            api.get_resource('/ip/dhcp-server').add(
                name='dhcp1', interface='ether2', address_pool='dhcp_pool'
            )

        # Configurar la red DHCP
        dhcp_networks = api.get_resource('/ip/dhcp-server/network').get(address='192.168.88.0/24')
        if not dhcp_networks:
            api.get_resource('/ip/dhcp-server/network').add(
                address='192.168.88.0/24', gateway='192.168.88.1', dns_server='8.8.8.8,8.8.4.4'
            )

        connection.disconnect()
        return "Configuración inicial de Mikrotik completada."
    except Exception as e:
        connection.disconnect()
        return "Error en la configuración inicial: {}".format(e)

@app.route('/configurar')
def configurar():
    return configurar_mikrotik()

@app.route('/activar')
def activar_internet():
    api, connection = conectar_mikrotik()
    try:
        # Eliminar reglas existentes para la IP
        rules = api.get_resource('/ip/firewall/filter').get(src_address='192.168.88.254')
        for rule in rules:
            api.get_resource('/ip/firewall/filter').remove(id=rule['id'])
        
        # Añadir una regla para permitir el acceso
        api.get_resource('/ip/firewall/filter').add(
            chain='forward',
            src_address='192.168.88.254',
            action='accept'
        )
        connection.disconnect()
        return "Internet activado."
    except Exception as e:
        connection.disconnect()
        return "Error al activar el internet: {}".format(e)

@app.route('/desactivar')
def desactivar_internet():
    api, connection = conectar_mikrotik()
    try:
        # Eliminar todas las reglas que permitan el acceso desde la IP
        rules = api.get_resource('/ip/firewall/filter').get(src_address='192.168.88.254')
        for rule in rules:
            api.get_resource('/ip/firewall/filter').remove(id=rule['id'])
        
        # Añadir una regla para denegar el acceso
        api.get_resource('/ip/firewall/filter').add(
            chain='forward',
            src_address='192.168.88.254',
            action='drop'
        )
        
        connection.disconnect()
        return "Internet desactivado."
    except Exception as e:
        connection.disconnect()
        return "Error al desactivar el internet: {}".format(e)

if __name__ == '__main__':
    app.run(debug=True)
"""


from flask import Flask, jsonify, request
import routeros_api
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

def conectar_mikrotik():
    connection = routeros_api.RouterOsApiPool(
        '172.25.223.121', 
        username='admin', 
        password='G4L1L30.30', 
        plaintext_login=True,
        port=8728,
        use_ssl=False,
        ssl_verify=False
    )
    return connection.get_api(), connection

@app.route('/activar/<ip_address>')
def activar_internet(ip_address):
    api, connection = conectar_mikrotik()
    try:
        # Eliminar reglas existentes para la IP
        rules = api.get_resource('/ip/firewall/filter').get(src_address=ip_address)
        for rule in rules:
            api.get_resource('/ip/firewall/filter').remove(id=rule['id'])
        
        # Añadir una regla para permitir el acceso
        api.get_resource('/ip/firewall/filter').add(
            chain='forward',
            src_address=ip_address,
            action='accept'
        )
        connection.disconnect()
        return f"Internet activado para {ip_address}", 200
    except Exception as e:
        connection.disconnect()
        return jsonify({"error": str(e)}), 500

@app.route('/desactivar/<ip_address>')
def desactivar_internet(ip_address):
    api, connection = conectar_mikrotik()
    try:
        # Eliminar todas las reglas que permitan el acceso desde la IP
        rules = api.get_resource('/ip/firewall/filter').get(src_address=ip_address)
        for rule in rules:
            api.get_resource('/ip/firewall/filter').remove(id=rule['id'])
        
        # Añadir una regla para denegar el acceso
        api.get_resource('/ip/firewall/filter').add(
            chain='forward',
            src_address=ip_address,
            action='drop'
        )
        
        connection.disconnect()
        return f"Internet desactivado para {ip_address}", 200
    except Exception as e:
        connection.disconnect()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5003)



