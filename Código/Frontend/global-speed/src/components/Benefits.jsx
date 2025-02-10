
import { Container, Row, Col } from "react-bootstrap";
import { FaBolt, FaShieldAlt, FaHeadset } from "react-icons/fa";

const Benefits = () => {
  const benefits = [
    {
      icon: <FaBolt size={40} color="white" />,
      title: "Alta Velocidad",
      description: "Disfruta de una conexión rápida y sin interrupciones para todas tus actividades digitales.",
      points: ["Velocidades simétricas", "Streaming sin retrasos", "Perfecto para gamers"],
      bg: "#EAF4FF",
      iconBg: "#007bff",
    },
    {
      icon: <FaShieldAlt size={40} color="white" />,
      title: "Conexión Segura",
      description: "Tu información siempre estará protegida con nuestras conexiones cifradas.",
      points: ["Protección avanzada", "Privacidad garantizada", "Evita amenazas cibernéticas"],
      bg: "#EBFAF1",
      iconBg: "#28a745",
    },
    {
      icon: <FaHeadset size={40} color="white" />,
      title: "Soporte 24/7",
      description: "Atención personalizada a cualquier hora para resolver tus problemas técnicos.",
      points: ["Respuestas rápidas", "Equipo especializado", "Soporte ilimitado"],
      bg: "#FFF9E5",
      iconBg: "#ffc107",
    },
  ];

  return (
    <Container className="my-5">
      <h2 className="text-center mb-5">Beneficios</h2>
      <Row className="g-4">
        {benefits.map((benefit, index) => (
          <Col md={4} key={index}>
            <div
              className="p-4 text-center shadow-sm"
              style={{
                backgroundColor: benefit.bg,
                borderRadius: "15px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0px 15px 30px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0px 10px 20px rgba(0, 0, 0, 0.05)";
              }}
            >
              <div
                style={{
                  backgroundColor: benefit.iconBg,
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                {benefit.icon}
              </div>
              <h5 className="mt-3" style={{ fontWeight: "bold", color: "#333" }}>
                {benefit.title}
              </h5>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>{benefit.description}</p>
              <ul className="list-unstyled text-start mt-3" style={{ color: "#555" }}>
                {benefit.points.map((point, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", marginBottom: "5px" }}>
                    • {point}
                  </li>
                ))}
              </ul>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Benefits;
