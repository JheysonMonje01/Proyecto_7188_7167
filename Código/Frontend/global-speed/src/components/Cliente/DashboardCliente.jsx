import { Navbar, Nav, Container } from "react-bootstrap";
import { FaDoorOpen, FaUserCircle, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useState} from "react";

const DashboardCliente = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Barra de Navegación */}
      <Navbar
        style={{
          background: "linear-gradient(90deg, #007bff, #0056b3)",
          color: "white",
          padding: "15px 30px",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaBars
              size={24}
              className="text-white me-3 d-lg-none"
              style={{ cursor: "pointer" }}
              onClick={toggleSidebar}
            />
            <Navbar.Brand className="text-white fw-bold fs-4">
              Bienvenido al Portal del Cliente
            </Navbar.Brand>
          </div>

          <Nav className="d-flex align-items-center">
            <FaUserCircle size={32} className="text-white me-2" />
            <span className="text-white me-4 fs-6">Cliente</span>
            <FaDoorOpen
              size={28}
              className="text-white"
              onClick={handleLogout}
              style={{ cursor: "pointer" }}
            />
          </Nav>
        </Container>
      </Navbar>

      {/* Contenedor de Página */}
      <div style={{ display: "flex", flex: 1, marginTop: "70px" }}>
        {/* Sidebar */}
        <div
          style={{
            width: isSidebarOpen ? "250px" : "60px",
            backgroundColor: "#218838",
            minHeight: "100vh",
            position: "fixed",
            top: "70px",
            left: 0,
            transition: "width 0.3s ease",
          }}
        >
          {children.sidebar}
        </div>

        {/* Contenido Principal */}
        <div
          style={{
            flex: 1,
            marginLeft: isSidebarOpen ? "250px" : "60px",
            padding: "30px",
            backgroundColor: "#f9f9f9",
            minHeight: "calc(100vh - 70px)",
            transition: "margin-left 0.3s ease",
          }}
        >
          {children.content}
        </div>
      </div>
    </div>
  );
};

DashboardCliente.propTypes = {
  children: PropTypes.shape({
    sidebar: PropTypes.node,
    content: PropTypes.node,
  }).isRequired,
};

export default DashboardCliente;
