from flask import Blueprint, request, jsonify
from app.services.factura_service import get_facturas_by_cliente, update_factura
from app.services.pago_service import PagoService
from app.services.transaccion_service import TransaccionService
import stripe
from app.models.pago import Pago
from app import Config

stripe.api_key = Config.STRIPE_API_KEY

payment_routes = Blueprint('payment_routes', __name__)

@payment_routes.route('/pagos/<int:id_cliente>', methods=['POST'])
def pay(id_cliente):
    try:
        # Obtener el payment_method_id del cuerpo de la solicitud
        data = request.get_json()
        payment_method_id = data.get("payment_method_id")

        if not payment_method_id:
            return jsonify({"error": "payment_method_id es requerido"}), 400

        # Obtener facturas pendientes
        invoices = get_facturas_by_cliente(id_cliente)
        if not invoices:
            return jsonify({"error": "No se encontraron facturas para este cliente."}), 404

        pending_invoices = [i for i in invoices if i["estado"] == "Pendiente"]

        if not pending_invoices:
            return jsonify({"error": "No hay facturas pendientes del cliente."}), 404

        # Calcular el monto total
        total_amount = sum(float(invoice["monto"]) for invoice in pending_invoices)
        total_amount_cents = int(total_amount * 100)  # Stripe trabaja en centavos

        # Crear y confirmar la intención de pago en Stripe
        try:
            intent = stripe.PaymentIntent.create(
                amount=total_amount_cents,
                currency="usd",
                payment_method=payment_method_id,
                automatic_payment_methods={
                    'enabled': True,
                    'allow_redirects': 'never'
                }
            )
            print(f"Intención de pago creada: {intent}")

        # Confirmar la intención de pago
            intent = stripe.PaymentIntent.confirm(intent.id, payment_method=payment_method_id)
            print(f"Intención de pago confirmada: {intent}")
        except stripe.error.CardError as e:
            return jsonify({"error": f"Error de tarjeta: {e.user_message}"}), 400
        except stripe.error.StripeError as e:
            return jsonify({"error": f"Error de Stripe: {str(e)}"}), 500

        # Lista para guardar los IDs de las facturas pagadas
        facturas_pagadas = []
        transacciones_registradas = []
        # Actualizar el estado de las facturas a "Cancelada"
        for invoice in pending_invoices:
            try:
                update_factura(
                    id_factura=invoice["id_factura"],
                    estado="Cancelado"
                )

                
                pago = PagoService.create_pago(invoice["id_factura"])  # Registrar el pago
                facturas_pagadas.append(invoice["id_factura"])  # Agregar el ID a la lista
                
                # Crear transacción asociada al pago
                transaccion = TransaccionService.create_transaccion(
                   id_pago=pago.id_pago,
                    metodo_pago="Tarjeta",
                    referencia_transaccion=intent.id
                )
                transacciones_registradas.append(transaccion)
            except ValueError as e:
                print(f"Error al actualizar la factura: {e}")
                return jsonify({"error": f"Error al actualizar la factura: {e}"}), 500

        return jsonify({"message": "Pago exitoso", "payment_intent": intent}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Ocurrió un error inesperado."}), 500
