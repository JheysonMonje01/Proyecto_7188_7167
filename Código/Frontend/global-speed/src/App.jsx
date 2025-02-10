import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Plans from "./components/Plans";
import Benefits from "./components/Benefits";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import LoginForm from "./components/LoginForm";
import Sidebar from "./components/DashBoard/Sidebar";
import DashboardHome from "./components/DashBoard/DashboardHome";
import PlansAdmin from "./components/DashBoard/Plans";
import Billing from "./components/DashBoard/Billing";
import Statistics from "./components/DashBoard/Statistics";
import DashboardLayout from "./components/DashBoard/DashboardLayout";
import RecuperacionForm from "./components/Recuperar";
import ClientForm from "./components/ClientForm";
import ListClients from "./components/ListClients";
import ListContrato from "./components/ListContrato";
import ListarFacturas from "./components/ListFacturas";
import PagoEfectivo from "./components/RegistarPago";
import ListarPagos from "./components/ListPagos";
import RegistrarPlan from "./components/RegisterPlan";
import ListarPlanes from "./components/ListPlan";
import Configuracion from "./components/Configuracion";
import ListarUsuarios from "./components/ListUsuarios";
import RegistrarUsuario from "./components/RegisterUsuario";
import ListaOrdenesInstalacion from "./components/ListOrdenesInstalacion";
import ListaInstalaciones from "./components/ListInstalacion";
import SidebarCliente from "./components/Cliente/SidebarCliente";
import DashboardCliente from "./components/Cliente/DashboardCliente";
import DashboardClienteHome from "./components/Cliente/DashboardClienteHome";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };



  return (
    <Router>
      <Routes>
        {/* Rutas principales */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <Hero />
              <main>
                <Plans />
                <Benefits />
              </main>
              <Footer />
              <Chatbot />
            </>
          }
        />
        <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
        <Route path="/recuperacion" element={<RecuperacionForm/>} />
        
        
        {/* Plataforma del Cliente */}
        <Route
          path="/dashboard-cliente/*"
          element={
            isAuthenticated ? (
              <DashboardCliente user={user}>
                {{
                  sidebar: <SidebarCliente />,
                  content: (
                    <Routes>
                      <Route path="/" element={<DashboardClienteHome />} />
                      {/* Agrega aquí las rutas específicas para clientes */}
                    </Routes>
                  ),
                }}
              </DashboardCliente>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? (
              <DashboardLayout user={user}>
                {{
                  sidebar: <Sidebar />,
                  content: (
                    <Routes>
                      
                      <Route path="/" element={<DashboardHome />} />
                      <Route path="clients/register" element={<ClientForm />} />
                      <Route path="clients/list" element={<ListClients />} />
                      <Route path="clients/contracts" element={<ListContrato />} />
                      <Route path="billing/list" element={<ListarFacturas />} />
                      <Route path="payments/register" element={<PagoEfectivo />} />
                      <Route path="payments/list" element={<ListarPagos />} />
                      <Route path="plans" element={<PlansAdmin />} />
                      <Route path="plans/register" element={<RegistrarPlan />} />
                      <Route path="users/create" element={<RegistrarUsuario />} />
                      <Route path="plans/list" element={<ListarPlanes />} />
                      <Route path="users/list" element={<ListarUsuarios  />} />
                      <Route path="ordenes/listar" element={<ListaOrdenesInstalacion  />} />
                      <Route path="instalacion/listar" element={<ListaInstalaciones  />} />
                      <Route path="billing" element={<Billing />} />
                      <Route path="statistics" element={<Statistics />} />
                      <Route path="settings/general" element={<Configuracion />} />
                    </Routes>
                  ),
                }}
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>
    </Router>
  );
};

export default App;
