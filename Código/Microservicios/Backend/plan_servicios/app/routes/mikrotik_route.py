from flask import Blueprint, request, jsonify
from app.services.mikrotik_service import MikroTikService
from app.services.database_service import DatabaseService
from app.models.plan_servicio import PlanServicio
from app.decorators.token_required import token_required  # Importar el decorador

mikrotik_bp = Blueprint('mikrotik', __name__)

# Crear una cola simple
@mikrotik_bp.route('/create', methods=['POST'])
#@token_required  # Aplicar el decorador para requerir autenticación con token
def create_queue():
    data = request.json
    try:
        # Guardar en MikroTik
        mikrotik = MikroTikService()
        mikrotik.connect()
        mikrotik.create_simple_queue(data['nombre'], data['target_ip'], data['max_limit'])
        mikrotik.close()

        # Guardar en la base de datos
        plan = DatabaseService.create_plan(data)
        return jsonify({"message": "Plan creado exitosamente", "plan": plan.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Actualizar una cola simple
@mikrotik_bp.route('/update/<int:plan_id>', methods=['PUT'])
#@token_required
def update_queue(plan_id):
    data = request.json
    try:
        # Actualizar en MikroTik
        mikrotik = MikroTikService()
        mikrotik.connect()
        mikrotik.update_simple_queue(data['old_name'], data.get('nombre'), data.get('target_ip'), data.get('max_limit'))
        mikrotik.close()

        # Actualizar en la base de datos
        plan = DatabaseService.update_plan(plan_id, data)
        return jsonify({"message": "Plan actualizado exitosamente", "plan": plan.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Eliminar una cola simple
@mikrotik_bp.route('/delete/<int:plan_id>', methods=['DELETE'])
#@token_required
def delete_queue(plan_id):
    try:
        # Eliminar de la base de datos
        plan = PlanServicio.query.get(plan_id)
        if not plan:
            return jsonify({"error": "Plan no encontrado"}), 404

        # Eliminar de MikroTik
        mikrotik = MikroTikService()
        mikrotik.connect()
        mikrotik.delete_simple_queue(plan.nombre)
        mikrotik.close()

        DatabaseService.delete_plan(plan_id)
        return jsonify({"message": "Plan eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Listar todas las colas
@mikrotik_bp.route('/list', methods=['GET'])
#@token_required
def list_queues():
    try:
        plans = DatabaseService.list_plans()
        return jsonify([plan.to_dict() for plan in plans]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500













