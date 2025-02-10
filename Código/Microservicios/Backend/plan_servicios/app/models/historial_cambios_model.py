from app import db
from datetime import datetime

class HistorialCambios(db.Model):
    __tablename__ = 'historial_cambios'

    id_cambio = db.Column(db.Integer, primary_key=True)
    id_servicio = db.Column(
        db.Integer, 
        db.ForeignKey('servicio_internet.id_servicio', ondelete='CASCADE'), 
        nullable=False
    )
    id_configuracion = db.Column(db.Integer, nullable=True)
    campo_modificado = db.Column(db.String(50), nullable=False)
    valor_anterior = db.Column(db.Text, nullable=True)
    valor_nuevo = db.Column(db.Text, nullable=True)
    id_usuario = db.Column(db.Integer, default=1, nullable=False)  # Valor por defecto: 1
    fecha_cambio = db.Column(db.DateTime, default=datetime.utcnow)

    # Relación con el servicio de internet
    servicio_internet = db.relationship('ServicioInternet', backref='historial_cambios')

    def to_dict(self):
        """
        Convierte el modelo en un diccionario para facilitar la serialización.
        """
        return {
            "id_cambio": self.id_cambio,
            "id_servicio": self.id_servicio,
            "id_configuracion": self.id_configuracion,
            "campo_modificado": self.campo_modificado,
            "valor_anterior": self.valor_anterior,
            "valor_nuevo": self.valor_nuevo,
            "id_usuario": self.id_usuario,
            "fecha_cambio": self.creado_en
        }
