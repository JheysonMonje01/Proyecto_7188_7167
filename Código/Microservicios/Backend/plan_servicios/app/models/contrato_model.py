from app import db

class Contrato(db.Model):
    __tablename__ = 'contratos'

    id_contrato = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)
    contenido = db.Column(db.Text, nullable=False)  # Texto descriptivo del contrato
    archivo = db.Column(db.LargeBinary, nullable=True)  # Archivo PDF o Word almacenado como binario
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    direccion = db.Column(db.String(250), nullable=True)
    id_plan_servicio = db.Column(db.Integer, nullable=False)  # ✅ Se añade el ID del plan de internet
    # Relación con el cliente
    cliente = db.relationship('Cliente', backref='contratos')

    def to_dict(self):
        """
        Convierte el objeto Contrato en un diccionario para facilitar su representación.
        """
        return {
            "id_contrato": self.id_contrato,
            "id_cliente": self.id_cliente,
            "contenido": self.contenido,
            "creado_en": self.creado_en,
            "actualizado_en": self.actualizado_en,
            "direccion":self.direccion,
            "id_plan_servicio": self.id_plan_servicio
        }
