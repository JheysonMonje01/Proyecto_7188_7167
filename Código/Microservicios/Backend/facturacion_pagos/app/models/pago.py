from app.models import db
from datetime import datetime

class Pago(db.Model):
    __tablename__ = 'pagos'
    id_pago = db.Column(db.Integer, primary_key=True)
    id_factura = db.Column(db.Integer, db.ForeignKey('facturas.id_factura'), nullable=False)
    fecha_pago = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {
            "id_pago": self.id_pago,
            "id_factura": self.id_factura,
            "fecha_pago": self.fecha_pago.strftime('%Y-%m-%d %H:%M:%S'),
            "monto" : self.monto,
        }





