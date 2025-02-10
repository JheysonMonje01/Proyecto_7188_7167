from app.models import db
from datetime import datetime

class Factura(db.Model):
    __tablename__ = 'facturas'
    
    id_factura = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    fecha_vencimiento = db.Column(db.Date, nullable=False)
    estado = db.Column(db.String(20), default='Pendiente', nullable=False)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    pdf_factura = db.Column(db.LargeBinary, nullable=True)  # Campo para almacenar el PDF
    iva = db.Column(db.Numeric(10, 3), nullable=False)
    id_contrato = db.Column(db.Integer, nullable=True)
    # Nuevos campos para recargos con valores predeterminados
    detalle_recargo = db.Column(db.String(255), default='', nullable=False)  # Descripción vacía por defecto
    total_recargo = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)  # Total del recargo predeterminado en 0.00

    def to_dict(self):
        """
        Convierte el objeto Factura en un diccionario para respuestas JSON.
        """
        return {
            "id_factura": self.id_factura,
            "id_cliente": self.id_cliente,
            "monto": float(self.monto),  # Convertir Decimal a float
            "fecha_vencimiento": self.fecha_vencimiento.strftime('%Y-%m-%d'),
            "estado": self.estado,
            "creado_en": self.creado_en.strftime('%Y-%m-%d %H:%M:%S'),
            "actualizado_en": self.actualizado_en.strftime('%Y-%m-%d %H:%M:%S'),
            "iva": float(self.iva),
            "detalle_recargo": self.detalle_recargo,
            "total_recargo": float(self.total_recargo),
            "pdf_factura": "Archivo adjunto" if self.pdf_factura else None,
            "id_contrato": self.id_contrato
        }












