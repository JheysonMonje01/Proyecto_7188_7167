import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import PropTypes from "prop-types";

const EditarPlanModal = ({ show, onHide, plan, onSave }) => {
  const [editingPlan, setEditingPlan] = useState(plan);

  useEffect(() => {
    setEditingPlan(plan);
  }, [plan]);

  const handleSavePlan = async () => {
    try {
      await axios.put(
        `http://127.0.0.1:5001/plan_servicios/${editingPlan.id_plan_servicio}`,
        editingPlan
      );
      toast.success("Plan editado correctamente");
      onSave();
      onHide();
    } catch (error) {
      console.error("Error al editar el plan", error);
      toast.error("Error al editar el plan");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Plan</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editingPlan && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nombre del Plan</Form.Label>
              <Form.Control
                type="text"
                className="rounded-3 shadow-sm"
                value={editingPlan.nombre}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, nombre: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Velocidad de Descarga (Mbps)</Form.Label>
              <Form.Control
                type="number"
                className="rounded-3 shadow-sm"
                value={editingPlan.velocidad_down}
                onChange={(e) =>
                  setEditingPlan({
                    ...editingPlan,
                    velocidad_down: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Velocidad de Subida (Mbps)</Form.Label>
              <Form.Control
                type="number"
                className="rounded-3 shadow-sm"
                value={editingPlan.velocidad_up}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, velocidad_up: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Precio ($)</Form.Label>
              <Form.Control
                type="number"
                className="rounded-3 shadow-sm"
                value={editingPlan.precio}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, precio: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="rounded-3 shadow-sm"
                value={editingPlan.descripcion}
                onChange={(e) =>
                  setEditingPlan({
                    ...editingPlan,
                    descripcion: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-center">
        <Button 
          variant="primary" 
          className="rounded-pill px-4 w-100"
          onClick={handleSavePlan}
        >
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

EditarPlanModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  plan: PropTypes.shape({
    id_plan_servicio: PropTypes.number,
    nombre: PropTypes.string,
    velocidad_down: PropTypes.number,
    velocidad_up: PropTypes.number,
    precio: PropTypes.number,
    descripcion: PropTypes.string,
    activo: PropTypes.bool,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
};

export default EditarPlanModal;
