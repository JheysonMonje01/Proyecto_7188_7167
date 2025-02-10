from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from app import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id_usuario = Column(Integer, primary_key=True)
    correo = Column(String(255), unique=True, nullable=False)
    contrasenia = Column(String(500), nullable=False)
    id_rol = Column(Integer, ForeignKey('roles.id_rol'), nullable=False, default=1)
    estado = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=db.func.current_timestamp())
    actualizado_en = Column(DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    telefono = Column(String(15), unique=True, nullable=True)

    rol = relationship("Rol", backref="usuarios")
