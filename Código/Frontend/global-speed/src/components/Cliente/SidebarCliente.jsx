import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaFileInvoice, FaChartBar, FaFileContract } from "react-icons/fa";
import PropTypes from "prop-types";

const SidebarCliente = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#0044cc",
        height: "100vh",
        color: "white",
        padding: "20px",
        position: "fixed",
        overflowY: "auto",
      }}
      className="shadow"
    >
      <h3 className="text-white mb-4">Cliente</h3>
      <Nav className="d-flex flex-column">
        <SidebarItem to="/dashboard-cliente" icon={<FaHome />} label="Inicio" active={isActive("/dashboard-cliente")} />
        <SidebarItem to="/dashboard-cliente/facturas" icon={<FaFileInvoice />} label="Mis Facturas" active={isActive("/dashboard-cliente/facturas")} />
        <SidebarItem to="/dashboard-cliente/contratos" icon={<FaFileContract />} label="Mis Contratos" active={isActive("/dashboard-cliente/contratos")} />
        <SidebarItem to="/dashboard-cliente/estadisticas" icon={<FaChartBar />} label="Mi Consumo" active={isActive("/dashboard-cliente/estadisticas")} />
      </Nav>
    </div>
  );
};

/** Componente de ítem del Sidebar */
const SidebarItem = ({ to, icon, label, active }) => (
  <Nav.Link
    as={Link}
    to={to}
    active={active}
    className="text-white py-2 px-3 rounded d-flex align-items-center position-relative"
    style={{
      fontWeight: "bold",
      marginBottom: "8px",
      backgroundColor: active ? "#003399" : "transparent",
      borderLeft: active ? "5px solid #ffc107" : "5px solid transparent",
      transition: "all 0.3s ease-in-out",
    }}
  >
    <span style={{ fontSize: "20px", marginRight: "10px" }}>{icon}</span>
    <span>{label}</span>
  </Nav.Link>
);
/** ✅ Validación de PropTypes */
SidebarItem.propTypes = {
    to: PropTypes.string.isRequired,   // 📌 'to' debe ser un string obligatorio
    icon: PropTypes.node.isRequired,   // 📌 'icon' debe ser un nodo válido (React element)
    label: PropTypes.string.isRequired, // 📌 'label' debe ser un string obligatorio
    active: PropTypes.bool,            // 📌 'active' es opcional y debe ser booleano
  };
  
export default SidebarCliente;
