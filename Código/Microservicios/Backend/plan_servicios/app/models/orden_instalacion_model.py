from app import db
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

class OrdenInstalacion(db.Model):
    _tablename_ = 'orden_instalacion'

    id_orden = Column(Integer, primary_key=True)
    id_cliente = Column(Integer, ForeignKey('clientes.id_cliente'), nullable=False)
    direccion_instalacion = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime, default=db.func.current_timestamp())
    estado = Column(String(20), default='Pendiente')
    pdf = Column(db.LargeBinary, nullable=True)
    actualizado_en = Column(DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # 🔥 Eliminamos id_tecnico porque la relación se maneja en instalacion

    # Relación con Instalacion (Un pedido puede tener un técnico asignado)
    instalacion = relationship("Instalacion", backref="orden_instalacion", uselist=False)

    def to_dict(self):
        return {
            'id_orden': self.id_orden,
            'id_cliente': self.id_cliente,
            'direccion_instalacion': self.direccion_instalacion,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'estado': self.estado,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
            'instalacion': self.instalacion.to_dict() if self.instalacion else None  # Muestra la asignación
        }