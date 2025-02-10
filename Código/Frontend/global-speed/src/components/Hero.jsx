
import { Container, Button, Row, Col } from "react-bootstrap";
import { FaRocket, FaWifi, FaCloud } from "react-icons/fa";

const Hero = () => {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #007bff, #0056b3)",
        color: "white",
        padding: "60px 20px",
      }}
    >
      <Container>
        <Row className="align-items-center">
          {/* Columna de Texto */}
          <Col md={6} className="text-center text-md-start">
            <h1 className="display-4 fw-bold">¡Conéctate a la velocidad del futuro!</h1>
            <p className="lead mt-3">
              Planes de internet para todas tus necesidades. Rápido, confiable y asequible.
            </p>
            <Button
              variant="light"
              className="mt-3 px-4 py-2"
              style={{
                fontSize: "1rem",
                fontWeight: "bold",
                borderRadius: "25px",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Ver Planes
            </Button>
          </Col>
          {/* Columna de Iconos */}
          <Col md={6} className="text-center mt-4 mt-md-0">
            <Row className="g-4">
              <Col xs={4}>
                <div className="bg-light rounded-circle p-4">
                  <FaRocket size={40} color="#007bff" />
                </div>
                <p className="mt-2">Alta Velocidad</p>
              </Col>
              <Col xs={4}>
                <div className="bg-light rounded-circle p-4">
                  <FaWifi size={40} color="#007bff" />
                </div>
                <p className="mt-2">Conexión Estable</p>
              </Col>
              <Col xs={4}>
                <div className="bg-light rounded-circle p-4">
                  <FaCloud size={40} color="#007bff" />
                </div>
                <p className="mt-2">Almacenamiento Seguro</p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Hero;

