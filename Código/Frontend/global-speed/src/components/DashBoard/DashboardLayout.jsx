import { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaDoorOpen, FaUserCircle, FaBars } from "react-icons/fa";
import { obtenerUsuarioPorCorreo, obtenerRolPorId } from "../../utils/api";
import PropTypes from "prop-types";


const DashboardLayout = ({ children }) => {
  const [rol, setRol] = useState("");
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const correo = localStorage.getItem("correo");
        if (!correo) {
          throw new Error("Correo no disponible en localStorage.");
        }

        setCorreoUsuario(correo);

        const usuario = await obtenerUsuarioPorCorreo(correo);
        console.log("Datos del usuario:", usuario);

        const rolData = await obtenerRolPorId(usuario.id_rol);
        console.log("Datos del rol:", rolData);

       

        // 📌 Validación de roles permitidos (1: Administrador, 2: Otro rol permitido)
        if (![1, 2].includes(usuario.id_rol)) {
          alert("No tienes permisos para acceder a este panel.");
          navigate("/login");
          return;
        }
        if (usuario.id_usuario) {
          localStorage.setItem("userId", usuario.id_usuario);
          console.log("User ID guardado:", usuario.id_usuario);
        } else {
          console.error("No se pudo obtener el ID del usuario.");
        }
        setRol(rolData.rol.toUpperCase());
      } catch (error) {
        console.error("Error al cargar los datos del usuario o rol:", error);
        navigate("/login");
      }
    };

    cargarUsuario();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      
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
              Bienvenido al Panel de Administración
            </Navbar.Brand>
          </div>

          <Nav className="d-flex align-items-center">
            <FaUserCircle size={32} className="text-white me-2" />
            <span className="text-white me-4 fs-6">{correoUsuario} ({rol})</span>
            <FaDoorOpen
              size={28}
              className="text-white"
              onClick={handleLogout}
              style={{ cursor: "pointer" }}
            />
          </Nav>
        </Container>
      </Navbar>

      
      <div style={{ display: "flex", flex: 1, marginTop: "70px" }}>
        
        <div
          style={{
            width: isSidebarOpen ? (isMobile ? "100%" : "250px") : "60px",
            backgroundColor: "#0044cc",
            minHeight: "100vh",
            position: isMobile ? "absolute" : "fixed",
            top: "70px",
            left: 0,
            transition: "width 0.3s ease, left 0.3s ease",
            zIndex: isMobile ? 1050 : "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "10px",
            }}
          >
            <FaBars
              size={24}
              className="text-white d-lg-none"
              onClick={toggleSidebar}
              style={{ cursor: "pointer", display: isSidebarOpen ? "block" : "none" }}
            />
          </div>
          {children.sidebar}
        </div>

        
        <div
          style={{
            flex: 1,
            marginLeft: isSidebarOpen && !isMobile ? "250px" : "60px",
            padding: isMobile ? "15px" : "30px",
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

DashboardLayout.propTypes = {
  children: PropTypes.shape({
    sidebar: PropTypes.node,
    content: PropTypes.node,
  }).isRequired,
};

export default DashboardLayout;

/*
import { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaDoorOpen, FaUserCircle, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  
  return (
    <div className="d-flex flex-column vh-100">
      <Navbar className="bg-primary text-white px-3 fixed-top">
        <Container fluid className="d-flex justify-content-between">
          <FaBars size={24} className="text-white d-lg-none" onClick={toggleSidebar} style={{ cursor: "pointer" }} />
          <Navbar.Brand className="text-white fw-bold fs-4">
              Bienvenido al Panel de Administración
            </Navbar.Brand>
            
          <Nav className="d-flex align-items-center">
            <FaUserCircle size={32} className="text-white me-2" />
            <span className="text-white me-4 fs-6">{correoUsuario} ({rol})</span>
            <FaDoorOpen size={28} className="text-white" onClick={() => navigate("/login")} style={{ cursor: "pointer" }} />
          </Nav>
        </Container>
      </Navbar>

      <div className="d-flex" style={{ marginTop: "56px", flex: 1 }}>
        {isSidebarOpen && (
          <div className="sidebar" style={{ width: isMobile ? "100%" : "250px" }}>
            {children.sidebar}
          </div>
        )}
        <div className="flex-grow-1 p-3">{children.content}</div>
      </div>
    </div>
  );
};
DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired, // Asegura que children es un nodo válido de React
};
export default DashboardLayout;
*/