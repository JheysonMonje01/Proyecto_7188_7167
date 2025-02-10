from app import db

class PlanServicio(db.Model):
    __tablename__ = 'plan_servicios'

    id_plan_servicio = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    velocidad_down = db.Column(db.Integer, nullable=False)
    velocidad_up = db.Column(db.Integer, nullable=False)
    precio = db.Column(db.Numeric(10, 2), nullable=False)
    descripcion = db.Column(db.Text)
    target_ip = db.Column(db.String, nullable=False)
    max_limit = db.Column(db.String(20), nullable=False)
    estado = db.Column(db.Boolean, default=True)
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id_plan_servicio": self.id_plan_servicio,
            "nombre": self.nombre,
            "velocidad_down": self.velocidad_down,
            "velocidad_up": self.velocidad_up,
            "precio": float(self.precio),
            "descripcion": self.descripcion,
            "target_ip": self.target_ip,
            "max_limit": self.max_limit,
            "estado": self.estado,
            "creado_en": self.creado_en,
            "actualizado_en": self.actualizado_en
        }















