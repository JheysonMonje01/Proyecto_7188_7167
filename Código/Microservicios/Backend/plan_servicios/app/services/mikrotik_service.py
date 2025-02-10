import paramiko
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()


class MikroTikService:
    def __init__(self):
        self.host = os.getenv('MIKROTIK_HOST')
        self.username = os.getenv('MIKROTIK_USERNAME')
        self.password = os.getenv('MIKROTIK_PASSWORD')
        self.client = None

    def connect(self):
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(self.host, username=self.username, password=self.password)
            print("Conexión SSH exitosa a MikroTik.")
        except Exception as e:
            raise Exception(f"Error al conectar con MikroTik: {str(e)}")

    def close(self):
        if self.client:
            self.client.close()
            print("Conexión SSH cerrada.")

    def execute_command(self, command):
        try:
            stdin, stdout, stderr = self.client.exec_command(command)
            output = stdout.read().decode()
            error = stderr.read().decode()
            if error:
                raise Exception(f"Error en MikroTik: {error}")
            return output
        except Exception as e:
            raise Exception(f"Error al ejecutar el comando: {str(e)}")

    def create_simple_queue(self, name, target, max_limit):
        command = f'/queue/simple/add name="{name}" target="{target}" max-limit="{max_limit}"'
        return self.execute_command(command)

    def update_simple_queue(self, old_name, new_name=None, new_target=None, new_max_limit=None):
        update_commands = []
        if new_name:
            update_commands.append(f'name="{new_name}"')
        if new_target:
            update_commands.append(f'target="{new_target}"')
        if new_max_limit:
            update_commands.append(f'max-limit="{new_max_limit}"')
        update_string = " ".join(update_commands)
        command = f'/queue/simple/set [find name="{old_name}"] {update_string}'
        return self.execute_command(command)

    def delete_simple_queue(self, name):
        command = f'/queue/simple/remove [find name="{name}"]'
        return self.execute_command(command)

    def list_simple_queues(self):
        command = "/queue/simple/print"
        return self.execute_command(command)












