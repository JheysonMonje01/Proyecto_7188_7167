from app import db
from datetime import datetime

class Cliente(db.Model):
    __tablename__ = 'clientes'

    id_cliente = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    cedula = db.Column(db.String(20), unique=True, nullable=False)
    direccion = db.Column(db.Text, nullable=False)
    telefono = db.Column(db.String(15))
    correo = db.Column(db.String(100), unique=True)
    id_usuario = db.Column(db.Integer, nullable=False)
    #id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False)
    id_plan_servicio = db.Column(db.Integer, db.ForeignKey('plan_servicios.id_plan_servicio', ondelete='SET NULL'))
    estado = db.Column(db.Boolean, default=True)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    latitud = db.Column(db.Float, nullable=True)  # Nuevo atributo para latitud
    longitud = db.Column(db.Float, nullable=True)  # Nuevo atributo para longitud

    def to_dict(self):
        return {
            "id_cliente": self.id_cliente,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "cedula": self.cedula,
            "direccion": self.direccion,
            "telefono": self.telefono,
            "correo": self.correo,
            "id_usuario": self.id_usuario,
            "id_plan_servicio": self.id_plan_servicio,
            "estado": self.estado,
            "creado_en": self.creado_en,
            "actualizado_en": self.actualizado_en,
            "latitud": self.latitud,  # Incluir latitud en el diccionario
            "longitud": self.longitud  # Incluir longitud en el diccionario
        }
