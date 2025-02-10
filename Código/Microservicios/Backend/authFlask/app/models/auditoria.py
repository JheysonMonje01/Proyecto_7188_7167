from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func, JSON
from sqlalchemy.orm import relationship
from app import db

class Auditoria(db.Model):
    __tablename__ = 'auditoria'

    id_auditoria = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False)
    accion = Column(String(255), nullable=False)
    detalles = Column(JSON, nullable=True)
    fecha = Column(TIMESTAMP, default=func.current_timestamp())

    usuario = relationship("Usuario", backref="auditorias")
