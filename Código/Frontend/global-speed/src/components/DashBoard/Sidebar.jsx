import { useState } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaHome,
  FaUsers,
  FaInternetExplorer,
  FaFileInvoice,
  FaChartBar,
  FaChevronDown,
  FaChevronRight,
  FaUserPlus,
  FaList,
  FaFileContract,
  FaUserShield,
  FaMoneyCheckAlt,
  FaDollarSign,
  FaNetworkWired,
  FaPowerOff,
  FaFileAlt,
  FaTools,
  FaClipboardList,
  FaCog, // Importa el icono de configuración
} from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

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
      <h3 className="text-white mb-4">🌐 Global Speed</h3>
      <Nav className="d-flex flex-column">
        <SidebarItem to="/dashboard" icon={<FaHome />} label="Inicio" active={isActive("/dashboard")} />

        {/* 🔹 CLIENTES */}
        <DropdownMenu title="Clientes" icon={<FaUsers />} isOpen={openMenu === "clients"} toggle={() => toggleMenu("clients")}>
          <SidebarItem to="/dashboard/clients/register" icon={<FaUserPlus />} label="Registrar Cliente" active={isActive("/dashboard/clients/register")} />
          <SidebarItem to="/dashboard/clients/list" icon={<FaList />} label="Listar Clientes" active={isActive("/dashboard/clients/list")} />
          <SidebarItem to="/dashboard/clients/contracts" icon={<FaFileContract />} label="Contratos" active={isActive("/dashboard/clients/contracts")} />
        </DropdownMenu>

        {/* 🔹 USUARIOS */}
        <DropdownMenu title="Usuarios" icon={<FaUserShield />} isOpen={openMenu === "users"} toggle={() => toggleMenu("users")}>
          <SidebarItem to="/dashboard/users/create" icon={<FaUserPlus />} label="Crear Usuario" active={isActive("/dashboard/users/create")} />
          <SidebarItem to="/dashboard/users/list" icon={<FaList />} label="Listar Usuarios" active={isActive("/dashboard/users/list")} />
        </DropdownMenu>

        {/* 🔹 PLANES DE INTERNET */}
        <DropdownMenu title="Planes de Internet" icon={<FaInternetExplorer />} isOpen={openMenu === "plans"} toggle={() => toggleMenu("plans")}>
          <SidebarItem to="/dashboard/plans/register" icon={<FaUserPlus />} label="Registrar Plan" active={isActive("/dashboard/plans/register")} />
          <SidebarItem to="/dashboard/plans/list" icon={<FaList />} label="Listar Planes" active={isActive("/dashboard/plans/list")} />
        </DropdownMenu>

        {/* 🔹 PAGOS */}
        <DropdownMenu title="Pagos" icon={<FaMoneyCheckAlt />} isOpen={openMenu === "payments"} toggle={() => toggleMenu("payments")}>
          <SidebarItem to="/dashboard/payments/register" icon={<FaDollarSign />} label="Registrar Pago" active={isActive("/dashboard/payments/register")} />
          <SidebarItem to="/dashboard/payments/list" icon={<FaList />} label="Listar Pagos" active={isActive("/dashboard/payments/list")} />
        </DropdownMenu>

        {/* 🔹 GESTIÓN DE SERVICIO */}
        <DropdownMenu title="Gestión de Servicio" icon={<FaNetworkWired />} isOpen={openMenu === "service"} toggle={() => toggleMenu("service")}>
          <SidebarItem to="/dashboard/service/activate" icon={<FaPowerOff />} label="Activar Servicio" active={isActive("/dashboard/service/activate")} />
          <SidebarItem to="/dashboard/service/deactivate" icon={<FaPowerOff />} label="Desactivar Servicio" active={isActive("/dashboard/service/deactivate")} />
        </DropdownMenu>

        {/* 🔹 FACTURACIÓN */}
        <DropdownMenu title="Facturación" icon={<FaFileInvoice />} isOpen={openMenu === "billing"} toggle={() => toggleMenu("billing")}>
          <SidebarItem to="/dashboard/billing/create" icon={<FaFileAlt />} label="Crear Factura" active={isActive("/dashboard/billing/create")} />
          <SidebarItem to="/dashboard/billing/list" icon={<FaList />} label="Listar Facturas" active={isActive("/dashboard/billing/list")} />
        </DropdownMenu>


        {/* 🔹 ORDENES DE INSTALACION */}
        <DropdownMenu title="Ordenes Instalacion" icon={<FaTools />} isOpen={openMenu === "ordenes-instalacion"} toggle={() => toggleMenu("ordenes-instalacion")}>
          <SidebarItem to="/dashboard/ordenes/listar" icon={<FaClipboardList />} label="Lista de Órdenes" active={isActive("/dashboard/ordenes/listar")} />
          <SidebarItem to="/dashboard/instalacion/listar" icon={<FaClipboardList />} label="Lista de Instalacion" active={isActive("/dashboard/instalacion/listar")} />
        </DropdownMenu>

        {/* 🔹 CONFIGURACIÓN */}
        <DropdownMenu title="Configuración" icon={<FaCog />} isOpen={openMenu === "settings"} toggle={() => toggleMenu("settings")}>
          <SidebarItem to="/dashboard/settings/general" icon={<FaCog />} label="Configuración General" active={isActive("/dashboard/settings/general")} />
        </DropdownMenu>

        <SidebarItem to="/dashboard/statistics" icon={<FaChartBar />} label="Estadísticas" active={isActive("/dashboard/statistics")} />
      </Nav>
    </div>
  );
};

/** ✅ SidebarItem: Estilizado con un fondo resaltado en activo */
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
      borderLeft: active ? "5px solid #ffcc00" : "5px solid transparent",
      transition: "all 0.3s ease-in-out",
    }}
  >
    <span style={{ fontSize: "20px", marginRight: "10px" }}>{icon}</span>
    <span>{label}</span>
  </Nav.Link>
);

/** ✅ DropdownMenu: Usa flechas animadas y resalta el submenú abierto */
const DropdownMenu = ({ title, icon, isOpen, toggle, children }) => (
  <div>
    <div
      className="text-white py-2 px-3 rounded d-flex align-items-center justify-content-between position-relative"
      style={{
        fontWeight: "bold",
        marginBottom: "10px",
        cursor: "pointer",
        backgroundColor: isOpen ? "#003399" : "transparent",
        borderLeft: isOpen ? "5px solid #ffcc00" : "5px solid transparent",
        transition: "all 0.3s ease-in-out",
      }}
      onClick={toggle}
    >
      <div className="d-flex align-items-center">
        <span style={{ fontSize: "20px", marginRight: "10px" }}>{icon}</span>
        {title}
      </div>
      {isOpen ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
    </div>
    {isOpen && <div className="ms-4">{children}</div>}
  </div>
);

/** ✅ Validaciones de PropTypes */
SidebarItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
};

DropdownMenu.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default Sidebar;
