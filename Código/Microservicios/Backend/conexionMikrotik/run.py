from app import create_app
from flask_cors import CORS

app = create_app()

app = create_app()
CORS(app, resources={r"/*": {"origins": "*"}})  # Permitir solicitudes desde cualquier origen


if __name__ == '__main__':
    app.run(debug=True, port=5003)
