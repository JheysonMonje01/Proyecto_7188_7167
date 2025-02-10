from app import db
from datetime import datetime

class Configuracion(db.Model):
    __tablename__ = 'configuracion'

    id_configuracion = db.Column(db.Integer, primary_key=True)
    porcentaje_iva = db.Column(db.Numeric(5, 2), nullable=False, default=12.00)
    intentos_login = db.Column(db.Integer, nullable=False, default=5)
    actualizado_por = db.Column(db.Integer, nullable=True)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tiempo_bloqueo_login = db.Column(db.Integer, nullable=False, default=1)  # Bloqueo de 1 min por defecto
    intervalo_monitoreo = db.Column(db.Integer, nullable=False, default=60)  # Monitoreo cada 60 min

    def to_dict(self):
        return {
            "id_configuracion": self.id_configuracion,
            "porcentaje_iva": float(self.porcentaje_iva),
            "intentos_login": self.intentos_login,
            "actualizado_por": self.actualizado_por,
            "actualizado_en": self.actualizado_en.strftime('%Y-%m-%d %H:%M:%S') if self.actualizado_en else None,
            "tiempo_bloqueo_login": self.tiempo_bloqueo_login,
            "intervalo_monitoreo": self.intervalo_monitoreo
        }
