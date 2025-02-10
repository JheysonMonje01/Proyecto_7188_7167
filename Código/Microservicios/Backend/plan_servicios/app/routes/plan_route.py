from flask import Blueprint, request, jsonify
from app.models.plan_servicio import PlanServicio
from app.services.mikrotik_manager import MikroTikManager
from app.decorators.token_required import token_required  # Importar el decorador
from app import db

plan_bp = Blueprint('plan_bp', __name__) 

@plan_bp.route('/', methods=['POST'])
#@token_required  # Aplicar el decorador para requerir autenticación con token
def create_plan():
    """
    Crea un nuevo plan en la base de datos y una cola simple en MikroTik.
    """
    data = request.json
    nombre = data.get('nombre')
    velocidad_down = data.get('velocidad_down')
    velocidad_up = data.get('velocidad_up')
    precio = data.get('precio')
    descripcion = data.get('descripcion', '')
    target_ip = data.get('target_ip')

    # Validar campos obligatorios
    if not all([nombre, velocidad_down, velocidad_up, precio, target_ip]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    # Validar valores negativos o cero
    if any([
        not nombre.strip(),
        precio <= 0,
        velocidad_down <= 0,
        velocidad_up <= 0
    ]):
        return jsonify({"error": "El Nombre del plan no puede estar vacío y el precio y las velocidades deben ser mayores a 0"}), 400

    # Verificar si el nombre del plan ya existe
    existing_plan = PlanServicio.query.filter_by(nombre=nombre).first()
    if existing_plan:
        return jsonify({"error": f"Ya existe un plan con el nombre '{nombre}'"}), 409

    max_limit = f"{velocidad_down}k/{velocidad_up}k"

    # Guardar en la base de datos
    new_plan = PlanServicio(
        nombre=nombre,
        velocidad_down=velocidad_down,
        velocidad_up=velocidad_up,
        precio=precio,
        descripcion=descripcion,
        target_ip=target_ip,
        max_limit=max_limit,
        estado=True
    )
    db.session.add(new_plan)
    db.session.commit()

    # Crear la cola simple en MikroTik
    try:
        mikrotik_manager = MikroTikManager()
        mikrotik_manager.connect()
        mikrotik_manager.create_simple_queue(nombre, target_ip, max_limit)
        mikrotik_manager.close()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear la cola en MikroTik: {str(e)}"}), 500

    return jsonify({"message": "Plan creado exitosamente"}), 201


@plan_bp.route('/<int:id_plan>', methods=['PUT'])
#@token_required
def update_plan(id_plan):
    """
    Actualiza un plan existente en la base de datos y la cola en MikroTik.
    """
    data = request.json
    plan = PlanServicio.query.get(id_plan)

    if not plan:
        return jsonify({"error": "Plan no encontrado"}), 404

    # Validar valores nuevos
    nombre = data.get('nombre', plan.nombre)
    velocidad_down = data.get('velocidad_down', plan.velocidad_down)
    velocidad_up = data.get('velocidad_up', plan.velocidad_up)
    precio = data.get('precio', plan.precio)
    target_ip = data.get('target_ip', plan.target_ip)

    # Validar campos no vacíos y valores mayores a 0
    if any([
        not nombre.strip(),
        precio <= 0,
        velocidad_down <= 0,
        velocidad_up <= 0
    ]):
        return jsonify({"error": "El Nombre del plan no puede estar vacío y el precio y las velocidades deben ser mayores a 0"}), 400

    # Verificar si el nombre del plan ya existe en otro plan
    if nombre != plan.nombre:
        existing_plan = PlanServicio.query.filter_by(nombre=nombre).first()
        if existing_plan:
            return jsonify({"error": f"Ya existe un plan con el nombre '{nombre}'"}), 409

    # Guardar valores actuales para MikroTik
    old_name = plan.nombre

    # Actualizar los datos en la base de datos
    plan.nombre = nombre
    plan.velocidad_down = velocidad_down
    plan.velocidad_up = velocidad_up
    plan.precio = precio
    plan.descripcion = data.get('descripcion', plan.descripcion)
    plan.target_ip = target_ip
    plan.max_limit = f"{velocidad_down}k/{velocidad_up}k"

    # Actualizar en la MikroTik
    try:
        mikrotik_manager = MikroTikManager()
        mikrotik_manager.connect()
        mikrotik_manager.update_simple_queue(
            old_name=old_name,
            new_name=plan.nombre,
            new_target=plan.target_ip,
            new_max_limit=plan.max_limit
        )
        mikrotik_manager.close()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al actualizar la cola en MikroTik: {str(e)}"}), 500

    db.session.commit()
    return jsonify(plan.to_dict()), 200


@plan_bp.route('/<int:id_plan>', methods=['DELETE'])
#@token_required
def delete_plan(id_plan):
    """
    Elimina un plan existente de la base de datos y la cola de MikroTik.
    """
    plan = PlanServicio.query.get(id_plan)

    if not plan:
        return jsonify({"error": "Plan no encontrado"}), 404

    # Eliminar la cola en MikroTik
    try:
        mikrotik_manager = MikroTikManager()
        mikrotik_manager.connect()
        mikrotik_manager.delete_simple_queue(name=plan.nombre)
        mikrotik_manager.close()
    except Exception as e:
        return jsonify({"error": f"Error al eliminar la cola en MikroTik: {str(e)}"}), 500

    db.session.delete(plan)
    db.session.commit()
    return jsonify({"message": f"Plan '{plan.nombre}' eliminado exitosamente"}), 200


@plan_bp.route('/<int:id_plan>', methods=['GET'])
#@token_required
def get_plan(id_plan):
    """
    Obtiene un plan específico por su ID.
    """
    plan = PlanServicio.query.get(id_plan)
    if not plan:
        return jsonify({"error": "Plan no encontrado"}), 404
    return jsonify(plan.to_dict()), 200

@plan_bp.route('/planes', methods=['GET'])
#@token_required
def get_all_planes():
    """
    Obtiene todos los planes.
    """
    planes = PlanServicio.query.all()
    if not planes:
        return jsonify({"error": "No se encontraron planes"}), 404
    return jsonify([plan.to_dict() for plan in planes]), 200


@plan_bp.route('/test_connection', methods=['GET'])
#@token_required
def test_mikrotik_connection():
    """
    Comprueba la conexión con el MikroTik.
    """
    try:
        mikrotik_manager = MikroTikManager()
        result = mikrotik_manager.test_connection()
        return jsonify(result), 200 if result["success"] else 500
    except Exception as e:
        return jsonify({"error": f"Error al probar la conexión con MikroTik: {str(e)}"}), 500

@plan_bp.route('/planes/disponibles', methods=['GET'])
def obtener_planes_disponibles():
    total_planes = PlanServicio.query.filter_by(estado=True).count()
    return jsonify({"total_planes": total_planes}), 200