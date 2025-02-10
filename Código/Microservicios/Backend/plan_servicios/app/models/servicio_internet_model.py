from app import db
from datetime import datetime

class ServicioInternet(db.Model):
    __tablename__ = 'servicio_internet'

    id_servicio = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente', ondelete='CASCADE'), nullable=False)
    estado = db.Column(db.Boolean, default=True)  # Activo/Inactivo
    ancho_banda = db.Column(db.Integer, nullable=False)  # Ancho de banda en Mbps
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    fecha_corte_programada = db.Column(db.DateTime, nullable=True)  # Fecha programada para el corte

    # Relación con el cliente
    cliente = db.relationship('Cliente', backref='servicios_internet')

    def to_dict(self):
        return {
            "id_servicio": self.id_servicio,
            "id_cliente": self.id_cliente,
            "estado": self.estado,
            "ancho_banda": self.ancho_banda,
            "creado_en": self.creado_en,
            "actualizado_en": self.actualizado_en,
            "fecha_corte_programada": self.fecha_corte_programada
        }
