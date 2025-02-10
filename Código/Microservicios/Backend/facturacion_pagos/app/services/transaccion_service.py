from app.models.transaccion import Transaccion
from app.models import db
from datetime import datetime

class TransaccionService:
    @staticmethod
    def create_transaccion(id_pago, metodo_pago, referencia_transaccion):
        transaccion = Transaccion(
            id_pago=id_pago,
            metodo_pago=metodo_pago,
            referencia_transaccion=referencia_transaccion,
            estado='completada',
            fecha_transaccion=datetime.utcnow()
        )
        db.session.add(transaccion)
        db.session.commit()
        return {
            'id_transaccion': transaccion.id_transaccion,
            'id_pago': transaccion.id_pago,
            'metodo_pago': transaccion.metodo_pago,
            'referencia_transaccion': transaccion.referencia_transaccion,
            'estado': transaccion.estado,
            'fecha_transaccion': transaccion.fecha_transaccion
        }














