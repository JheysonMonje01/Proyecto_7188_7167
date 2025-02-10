from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app import db

class CodigoVerificacion(db.Model):
    __tablename__ = 'codigos_verificacion'

    id_codigo = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete="CASCADE"), nullable=False)  # Agregar CASCADE
    codigo = Column(String(6), nullable=False)
    creado_en = Column(DateTime, default=func.current_timestamp())
    expira_en = Column(DateTime, nullable=False)

    usuario = relationship("Usuario", backref="codigos_verificacion")
