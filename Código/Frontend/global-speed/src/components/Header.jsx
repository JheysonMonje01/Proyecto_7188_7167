
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { FaGlobe, FaHome, FaInfoCircle, FaSignInAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <Navbar
      expand="lg"
      fixed="top"
      style={{
        background: "linear-gradient(90deg, #0044cc, #007bff)",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        padding: "10px 20px",
      }}
    >
      <Container>
        {/* Logo */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center"
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: "1.5rem",
            textTransform: "uppercase",
          }}
        >
          <FaGlobe className="me-2" size={25} /> Global Speed
        </Navbar.Brand>

        {/* Toggle para dispositivos pequeños */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" style={{ borderColor: "white" }} />

        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          {/* Navegación */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/home" className="text-white d-flex align-items-center">
              <FaHome className="me-2" /> Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/about" className="text-white d-flex align-items-center">
              <FaInfoCircle className="me-2" /> Acerca de
            </Nav.Link>
          </Nav>

          {/* Botón de Login */}
          <Button
            onClick={() => navigate("/login")}
            style={{
              borderRadius: "25px",
              padding: "8px 20px",
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#0044cc",
              backgroundColor: "white",
              border: "2px solid white",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "white";
              e.currentTarget.style.backgroundColor = "#0033aa";
              e.currentTarget.style.border = "2px solid #0033aa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#0044cc";
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.border = "2px solid white";
            }}
          >
            <FaSignInAlt className="me-2" /> Login
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
