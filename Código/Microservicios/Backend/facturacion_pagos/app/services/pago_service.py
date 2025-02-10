from app.models.pago import Pago
from app.models.factura import Factura
from app import db
from datetime import datetime

class PagoService:
    @staticmethod
    def create_pago(id_factura):
        """
        Crea un nuevo registro de pago.
        """
        # Verificar que la factura exista
        factura = Factura.query.get(id_factura)
        if not factura:
            raise ValueError("Factura no encontrada.")

        # Verificar que no exista un pago duplicado para la misma factura
        existing_pago = Pago.query.filter_by(id_factura=id_factura).first()
        if existing_pago:
            raise ValueError("Ya existe un pago registrado para esta factura.")

        # Crear el pago con el monto de la factura
        nuevo_pago = Pago(
            id_factura=id_factura,
            fecha_pago=datetime.utcnow(),
            monto=factura.monto  # Asumiendo que el campo 'total' en Factura contiene el monto de la factura
        )
        db.session.add(nuevo_pago)
        db.session.commit()

        # Actualizar el estado de la factura
        factura.estado = 'Cancelado'
        db.session.commit()

        return nuevo_pago

    @staticmethod
    def update_pago(id_pago):
        """
        Permite actualizar un pago y restaurar el estado anterior de la factura.
        """
        pago = Pago.query.get(id_pago)
        if not pago:
            raise ValueError("Pago no encontrado.")

        # Obtener la factura relacionada
        factura = Factura.query.get(pago.id_factura)
        if not factura:
            raise ValueError("Factura no encontrada.")

        # Restaurar el estado anterior de la factura
        factura.estado = pago.estado_anterior

        # Eliminar el pago
        db.session.delete(pago)
        db.session.commit()

        return {"message": "Pago eliminado y factura restaurada", "estado_factura": factura.estado}

    @staticmethod
    def get_pago(id_pago):
        """
        Obtiene un pago por su ID.
        """
        pago = Pago.query.get(id_pago)
        if not pago:
            raise ValueError("Pago no encontrado.")
        return pago.to_dict()

    @staticmethod
    def list_pagos():
        """
        Lista todos los pagos registrados.
        """
        pagos = Pago.query.all()
        if not pagos:
            raise ValueError("No se encontraron pagos registrados.")
        return [pago.to_dict() for pago in pagos]

    @staticmethod
    def get_facturas_pendientes(id_cliente):
        """
        Obtiene todas las facturas en estado "Pendiente" o "Vencido" de un cliente.
        """
        facturas = Factura.query.filter(Factura.id_cliente == id_cliente, Factura.estado.in_(['Pendiente', 'Vencido'])).all()
        if not facturas:
            raise ValueError("No se encontraron facturas pendientes o vencidas para este cliente.")

        return [factura.to_dict() for factura in facturas]

    @staticmethod
    def get_total_facturas_pendientes(id_cliente):
        """
        Obtiene el total a pagar de todas las facturas pendientes o vencidas de un cliente.
        """
        total = db.session.query(db.func.sum(Factura.monto)).filter(Factura.id_cliente == id_cliente, Factura.estado.in_(['Pendiente', 'Vencido'])).scalar()
        
        if not total:
            return {"total_pendiente": 0.00, "message": "No hay facturas pendientes o vencidas para este cliente."}

        return {"total_pendiente": float(total)}



    @staticmethod
    def get_facturas_vencidas(id_cliente):
        """
        Obtiene todas las facturas en estado 'Vencido' de un cliente específico,
        ordenadas por fecha de vencimiento desde la más antigua hasta la más reciente.
        """
        if not id_cliente:
            raise ValueError("El ID del cliente es requerido.")

        facturas_vencidas = Factura.query.filter_by(id_cliente=id_cliente, estado="Vencido").order_by(Factura.fecha_vencimiento.asc()).all()

        if not facturas_vencidas:
            raise ValueError(f"No se encontraron facturas vencidas para el cliente con ID {id_cliente}.")

        return facturas_vencidas








#   Actualizar pago -----------------------------------------------------------

    @staticmethod
    def update_pago(id_pago):
        """
        Revertir un pago, devolviendo la factura a su estado anterior.
        """
        pago = Pago.query.get(id_pago)
        if not pago:
            raise ValueError("Pago no encontrado.")

        # Obtener la factura asociada
        factura = Factura.query.get(pago.id_factura)
        if not factura:
            raise ValueError("Factura no encontrada.")

        # Restaurar el estado anterior de la factura
        factura.estado = pago.estado_anterior

        # Actualizar el estado del pago para marcarlo como "Anulado"
        pago.estado_actual = "Anulado"
        pago.fecha_actualizacion = datetime.utcnow()

        # Guardar cambios en la base de datos
        db.session.commit()

        return pago