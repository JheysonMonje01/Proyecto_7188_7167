from flask_cors import CORS
from app import create_app

from threading import Thread

app = create_app()
CORS(app, resources={r"/*": {"origins": "*"}})  # Permitir solicitudes desde cualquier origen

if __name__ == '__main__':
    app.run(debug=True, port=5001)










