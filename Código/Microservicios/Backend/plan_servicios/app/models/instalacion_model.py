from app import db
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

class Instalacion(db.Model):
    _tablename_ = 'instalacion'

    id_instalacion = Column(Integer, primary_key=True)
    id_orden = Column(Integer, ForeignKey('orden_instalacion.id_orden'), nullable=False)
    id_tecnico = Column(Integer, nullable=False)  # Solo almacenamos el ID del técnico
    estado = Column(String(20), default="En Proceso")  # "Pendiente", "En Proceso", "Realizado"
    fecha_asignacion = Column(DateTime, default=db.func.current_timestamp())
    fecha_finalizacion = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            'id_instalacion': self.id_instalacion,
            'id_orden': self.id_orden,
            'id_tecnico': self.id_tecnico,
            'estado': self.estado,
            'fecha_asignacion': self.fecha_asignacion.isoformat() if self.fecha_asignacion else None,
            'fecha_finalizacion': self.fecha_finalizacion.isoformat() if self.fecha_finalizacion else None
        }