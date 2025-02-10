import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Card, Button, Row, Col, Form } from "react-bootstrap";
import { FaWifi, FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import EditarPlanModal from "./EditarPlanModal";

const ListarPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredPlanes, setFilteredPlanes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarPlanes();
  }, []);

  useEffect(() => {
    filterPlanes();
  }, [searchTerm, selectedPrice, planes]);

  const cargarPlanes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/plan_servicios/planes");
      setPlanes(response.data);
    } catch (error) {
      console.error("Error al cargar los planes:", error);
      toast.error("Error al cargar los planes");
    } finally {
      setLoading(false);
    }
  };

  const eliminarPlan = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Estás seguro de eliminar este plan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://127.0.0.1:5001/planes/${id}`);
      toast.success("Plan eliminado correctamente");
      cargarPlanes();
    } catch (error) {
      console.error("Error al eliminar el plan", error);
      toast.error("Error al eliminar el plan");
    }
  };

  const filterPlanes = () => {
    let filtered = planes;

    if (searchTerm) {
      filtered = filtered.filter((plan) =>
        plan.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPrice) {
      filtered = filtered.filter((plan) => plan.precio === parseFloat(selectedPrice));
    }

    setFilteredPlanes(filtered);
  };

  const handleAddPlan = () => {
    navigate("/crear-plan");
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSavePlan = () => {
    cargarPlanes();
  };

  const uniquePrices = [...new Set(planes.map((plan) => plan.precio))];

  return (
    <Container className="mt-4">
      <h2 className="text-center text-primary mb-4" style={{ fontWeight: "bold", fontSize: "2rem" }}>
        📡 Listado de Planes
      </h2>
      <Row className="mb-4 align-items-end">
        <Col md={5}>
          <Form.Group>
            <Form.Label>Buscar por nombre</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del plan"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={5}>
          <Form.Group>
            <Form.Label>Filtrar por precio</Form.Label>
            <Form.Select
              aria-label="Seleccionar precio"
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Seleccionar precio</option>
              {uniquePrices.map((price, index) => (
                <option key={index} value={price}>
                  ${price}/mes
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2} className="d-flex justify-content-end">
          <Button variant="primary" onClick={handleAddPlan}>
            <FaPlus className="me-2" />
            Añadir Plan
          </Button>
        </Col>
      </Row>
      {loading ? (
        <p className="text-center">Cargando planes...</p>
      ) : (
        <Row className="justify-content-center">
          {filteredPlanes.map((plan) => (
            <Col md={4} key={plan.id_plan_servicio} className="mb-4">
              <Card
                className="shadow-lg border-0"
                style={{
                  borderRadius: "50px",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  background: "linear-gradient(135deg, #ffffff, #ffffff)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 15px 30px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.1)";
                }}
              >
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-end mb-3">
                    <Button variant="link" className="p-0 text-primary" onClick={() => handleEditPlan(plan)}>
                      <FaEdit size={22} />
                    </Button>
                    <Button
                      variant="link"
                      className="p-0 text-danger ms-2"
                      onClick={() => eliminarPlan(plan.id_plan_servicio)}
                    >
                      <FaTrashAlt size={22} />
                    </Button>
                  </div>
                  <div className="mb-3 d-flex justify-content-center align-items-center" style={{
                    backgroundColor: "#007bff",
                    borderRadius: "50%",
                    width: "80px",
                    height: "80px",
                    margin: "0 auto",
                  }}>
                    <FaWifi size={40} color="#ffffff" />
                  </div>
                  <h4 className="mt-2 fw-bold text-dark">{plan.nombre}</h4>
                  <h3 className="text-primary fw-bold">{plan.velocidad_down} MB</h3>
                  <p className="text-muted">{plan.descripcion || "Sin descripción"}</p>
                  <p className="text-muted">
                    <strong>Velocidad de subida:</strong> {plan.velocidad_up} MB
                  </p>
                  <h5 className="fw-bold mt-3 text-success">${plan.precio}/mes</h5>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <EditarPlanModal
        show={showModal}
        onHide={handleCloseModal}
        plan={editingPlan}
        onSave={handleSavePlan}
      />

      <ToastContainer />
    </Container>
  );
};

export default ListarPlanes;
