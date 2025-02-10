from app import db
from app.models.historial_cambios_model import HistorialCambios
from datetime import datetime

class HistorialCambiosService:
    @staticmethod
    def registrar_cambio(id_servicio, campo_modificado, valor_anterior, valor_nuevo, id_usuario=1, id_configuracion=None):
        nuevo_cambio = HistorialCambios(
            id_servicio=id_servicio,
            id_configuracion=id_configuracion,
            campo_modificado=campo_modificado,
            valor_anterior=valor_anterior,
            valor_nuevo=valor_nuevo,
            id_usuario=id_usuario,
            fecha_cambio=datetime.utcnow()
        )
        db.session.add(nuevo_cambio)
        db.session.commit()
        return nuevo_cambio

    @staticmethod
    def get_historial_by_servicio_id(id_servicio):
        return HistorialCambios.query.filter_by(id_servicio=id_servicio).all()
