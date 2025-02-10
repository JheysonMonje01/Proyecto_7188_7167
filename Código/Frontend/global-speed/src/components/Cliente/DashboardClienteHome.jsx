import { useEffect, useState } from "react";
import axios from "axios";
import { FaFileInvoiceDollar, FaFileContract, FaChartLine } from "react-icons/fa";

const DashboardClienteHome = () => {
  const [facturasPendientes, setFacturasPendientes] = useState(0);
  const [consumoMensual, setConsumoMensual] = useState(0);
  const [contratosActivos, setContratosActivos] = useState(0);
  const userId = localStorage.getItem("userId"); // Obtener el ID del usuario autenticado
  
  useEffect(() => {
    
    if (userId) {
      cargarDatosCliente();
    }
  }, [userId]);

  const cargarDatosCliente = async () => {
    try {
      // 📌 Obtener Facturas Pendientes
      const facturasResponse = await axios.get(
        `http://127.0.0.1:5002/facturacion/facturas/estado?id_cliente=${userId}`
      );
      setFacturasPendientes(facturasResponse.data.length);

      // 📌 Obtener Consumo Mensual (ejemplo, en MB)
      const consumoResponse = await axios.get(
        `http://127.0.0.1:5001/consumo/${userId}`
      );
      setConsumoMensual(consumoResponse.data.consumo_mensual || 0);

      // 📌 Obtener Contratos Activos
      const contratosResponse = await axios.get(
        `http://127.0.0.1:5001/contratos/cliente/${userId}`
      );
      setContratosActivos(contratosResponse.data.length);
    } catch (error) {
      console.error("Error al cargar datos del cliente:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">📊 Mi Panel de Cliente</h2>
      <div className="row">
        {/* Tarjeta de Facturas Pendientes */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3">
            <div className="d-flex align-items-center">
              <FaFileInvoiceDollar size={40} className="text-danger me-3" />
              <div>
                <h5>Facturas Pendientes</h5>
                <h2 className="text-danger">{facturasPendientes}</h2>
              </div>
            </div>
            <p className="text-muted mt-2">
              Revisa tus facturas pendientes de pago.
            </p>
          </div>
        </div>

        {/* Tarjeta de Contratos Activos */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3">
            <div className="d-flex align-items-center">
              <FaFileContract size={40} className="text-primary me-3" />
              <div>
                <h5>Contratos Activos</h5>
                <h2 className="text-primary">{contratosActivos}</h2>
              </div>
            </div>
            <p className="text-muted mt-2">
              Consulta los contratos vigentes con tu proveedor.
            </p>
          </div>
        </div>

        {/* Tarjeta de Consumo Mensual */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3">
            <div className="d-flex align-items-center">
              <FaChartLine size={40} className="text-success me-3" />
              <div>
                <h5>Consumo Mensual</h5>
                <h2 className="text-success">{consumoMensual} MB</h2>
              </div>
            </div>
            <p className="text-muted mt-2">
              Monitorea tu consumo de datos de internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardClienteHome;
