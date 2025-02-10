from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app import db

class Rol(db.Model):
    __tablename__ = 'roles'

    id_rol = Column(Integer, primary_key=True)
    rol = Column(String(50), nullable=False)
    descripcion = Column(String(255), nullable=True)

    permisos = relationship("Permiso", back_populates="rol", cascade="all, delete-orphan")




