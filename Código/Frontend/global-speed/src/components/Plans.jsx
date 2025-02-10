import { useEffect, useState } from "react";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import { FaWifi, FaRocket, FaCloud } from "react-icons/fa";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch plans from the API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5001/plan_servicios/planes"); // Cambia la URL a la de tu API
        if (!response.ok) {
          throw new Error("Error al obtener los planes");
        }
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return <Container className="my-5"><h2 className="text-center">Cargando planes...</h2></Container>;
  }

  if (plans.length === 0) {
    return <Container className="my-5"><h2 className="text-center">No hay planes disponibles en este momento.</h2></Container>;
  }

  // Icons and gradients for plans (adjustable for dynamic use)
  const icons = [
    <FaWifi size={60} color="white" />,
    <FaRocket size={60} color="white" />,
    <FaCloud size={60} color="white" />
  ];

  const gradients = [
    "linear-gradient(135deg, #4A90E2, #007bff)",
    "linear-gradient(135deg, #6A11CB, #2575FC)",
    "linear-gradient(135deg, #11998e, #38ef7d)"
  ];

  return (
    <Container className="my-5">
      <h2 className="text-center mb-5">Nuestros Planes</h2>
      <Row>
        {plans.map((plan, index) => (
          <Col md={4} key={index} className="mb-4">
            <Card
              className="shadow-lg text-center"
              style={{
                borderRadius: "20px",
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                backgroundColor: "#f9f9f9",
                height: "550px",
                boxShadow: "0px 10px 30px rgba(0, 0, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0px 15px 40px rgba(0, 0, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0px 10px 30px rgba(0, 0, 255, 0.3)";
              }}
            >
              <div
                style={{
                  background: gradients[index % gradients.length],
                  color: "white",
                  padding: "40px 0",
                }}
              >
                {icons[index % icons.length]}
                <h3 className="mt-3">{plan.nombre}</h3>
                <h1 className="display-4">{plan.velocidad_down} MB</h1>
                <p>por 12 meses</p>
              </div>
              <Card.Body>
                <h4 style={{ fontWeight: "bold", color: "#333", fontSize: "1.5rem" }}>${plan.precio}/mes</h4>
                <p style={{ fontSize: "1rem", color: "#555" }}>{plan.descripcion}</p>
                <hr />
                <p className="text-muted">
                  <strong>Velocidad de subida:</strong> {plan.velocidad_up} MB
                </p>
                <Button
                  variant="primary"
                  className="w-100"
                  style={{
                    borderRadius: "25px",
                    backgroundColor: "#007bff",
                    border: "none",
                    transition: "background-color 0.3s ease",
                    padding: "10px 0",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
                >
                  Lo quiero
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Plans;
