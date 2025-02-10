from app.models.plan_servicio import PlanServicio
from app import db

class DatabaseService:
    @staticmethod
    def create_plan(data):
        new_plan = PlanServicio(**data)
        db.session.add(new_plan)
        db.session.commit()
        return new_plan

    @staticmethod
    def update_plan(plan_id, data):
        plan = PlanServicio.query.get(plan_id)
        if not plan:
            raise ValueError("El plan no existe.")
        for key, value in data.items():
            setattr(plan, key, value)
        db.session.commit()
        return plan

    @staticmethod
    def delete_plan(plan_id):
       
        plan = PlanServicio.query.get(plan_id)
        if plan:
            db.session.delete(plan)
            db.session.commit()
            print(f"Plan '{plan_id}' eliminado de la base de datos.")
        else:
            raise Exception("Plan no encontrado en la base de datos")


    @staticmethod
    def list_plans():
        return PlanServicio.query.all()
