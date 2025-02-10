import paramiko
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class MikroTikManager:
    def __init__(self):
        """Inicializa la configuración de conexión SSH."""
        self.host = os.getenv('MIKROTIK_HOST')
        self.username = os.getenv('MIKROTIK_USERNAME')
        self.password = os.getenv('MIKROTIK_PASSWORD')
        self.client = None

    def connect(self):
        """Establece conexión SSH con MikroTik."""
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(self.host, username=self.username, password=self.password, port=22)
            print("Conexión SSH exitosa a MikroTik.")
        except Exception as e:
            raise Exception(f"Error al conectar con MikroTik por SSH: {str(e)}")

    def close(self):
        """Cierra la conexión SSH."""
        if self.client:
            self.client.close()
            print("Conexión SSH cerrada.")

    def create_simple_queue(self, name, target, max_limit):
        """Crea una cola simple en MikroTik."""
        try:
            command = f'/queue/simple/add name="{name}" target="{target}" max-limit="{max_limit}"'
            print(f"Ejecutando comando: {command}")
            self._execute_command(command)
            print("Cola creada exitosamente en MikroTik.")
        except Exception as e:
            raise Exception(f"Error al crear la cola simple: {str(e)}")

    def list_simple_queues(self):
        """Lista todas las colas simples en MikroTik."""
        try:
            command = "/queue/simple/print"
            result = self._execute_command(command)
            print("Colas simples obtenidas exitosamente.")
            return result
        except Exception as e:
            raise Exception(f"Error al listar colas simples: {str(e)}")

    def update_simple_queue(self, old_name, new_name=None, new_target=None, new_max_limit=None):
        """
        Actualiza una cola simple en MikroTik.
        """
        try:
            update_commands = []
            if new_name:
                update_commands.append(f'name="{new_name}"')
            if new_target:
                update_commands.append(f'target="{new_target}"')
            if new_max_limit:
                update_commands.append(f'max-limit="{new_max_limit}"')

            if not update_commands:
                raise Exception("No se proporcionaron campos para actualizar.")

            update_string = " ".join(update_commands)
            command = f'/queue/simple/set [find name="{old_name}"] {update_string}'
            print(f"Ejecutando comando: {command}")
            self._execute_command(command)
            print("Cola actualizada exitosamente en MikroTik.")
        except Exception as e:
            raise Exception(f"Error al actualizar la cola simple: {str(e)}")

    def delete_simple_queue(self, name):
        """Elimina una cola simple en MikroTik."""
        try:
            command = f'/queue/simple/remove [find name="{name}"]'
            print(f"Ejecutando comando: {command}")
            self._execute_command(command)
            print("Cola eliminada exitosamente en MikroTik.")
        except Exception as e:
            raise Exception(f"Error al eliminar la cola simple: {str(e)}")

    def test_connection(self):
        """Verifica la conexión con MikroTik ejecutando un comando simple."""
        try:
            self.connect()
            command = "/system identity print"
            print("Ejecutando comando de prueba para verificar la conexión...")
            stdin, stdout, stderr = self.client.exec_command(command)
            output = stdout.read().decode()
            error = stderr.read().decode()
            self.close()
            if error:
                raise Exception(f"Error en la conexión: {error}")
            return {"success": True, "message": "Conexión con MikroTik exitosa", "output": output.strip()}
        except Exception as e:
            return {"success": False, "message": f"Error al conectar con MikroTik: {str(e)}"}

    def _execute_command(self, command):
        """Ejecuta un comando en MikroTik a través de SSH."""
        try:
            stdin, stdout, stderr = self.client.exec_command(command)
            output = stdout.read().decode()
            error = stderr.read().decode()

            if error:
                raise Exception(f"Error en MikroTik: {error}")
            return output
        except Exception as e:
            raise Exception(f"Error al ejecutar el comando: {str(e)}")
