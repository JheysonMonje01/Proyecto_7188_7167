from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app import db

class Permiso(db.Model):
    __tablename__ = 'permisos'

    id_permiso = Column(Integer, primary_key=True)
    id_rol = Column(Integer, ForeignKey('roles.id_rol'), nullable=False)
    nombre = Column(String(50), nullable=False)

    rol = relationship("Rol", back_populates="permisos")

