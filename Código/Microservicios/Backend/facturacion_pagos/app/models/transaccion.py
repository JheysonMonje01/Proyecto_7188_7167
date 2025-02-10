from app.models import db
from datetime import datetime

class Transaccion(db.Model):
    __tablename__ = 'transacciones'
    id_transaccion = db.Column(db.Integer, primary_key=True)
    id_pago = db.Column(db.Integer, db.ForeignKey('pagos.id_pago'), nullable=False)
    metodo_pago = db.Column(db.String(50), nullable=False)
    referencia_transaccion = db.Column(db.String(100), nullable=True)
    estado = db.Column(db.String(20), default='Completado', nullable=False)
    fecha_transaccion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)












