import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import { FaUsers, FaClipboardCheck, FaMoneyBillWave, FaBan, FaExclamationTriangle } from "react-icons/fa";

const DashboardHome = () => {
  const [usuariosActivos, setUsuariosActivos] = useState(0);
  const [planesDisponibles, setPlanesDisponibles] = useState(0);
  const [facturacionPendiente, setFacturacionPendiente] = useState(0);
  const [facturasCanceladas, setFacturasCanceladas] = useState(0);
  const [facturasVencidas, setFacturasVencidas] = useState(0);
  const [loading, setLoading] = useState(true); // 🔹 Definir el estado de carga

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener cantidad de usuarios activos
        const usuariosResponse = await axios.get("http://localhost:5000/api/usuarios/activos");
  
        setUsuariosActivos(usuariosResponse.data.total_usuarios);
  
  
  
        // Obtener cantidad de planes disponibles
  
        const planesResponse = await axios.get("http://localhost:5001/plan_servicios/planes/disponibles");
  
        setPlanesDisponibles(planesResponse.data.total_planes);
  
  
  
        // Obtener monto total pendiente de facturación
  
        const facturacionResponse = await axios.get("http://127.0.0.1:5002/facturacion/facturas/pendiente");
  
        setFacturacionPendiente(facturacionResponse.data.monto_pendiente || 0);
  
  
  
        // Obtener cantidad de facturas canceladas
  
        const facturasCanceladasResponse = await axios.get("http://127.0.0.1:5002/facturacion/facturas/cancelado");
  
        setFacturasCanceladas(facturasCanceladasResponse.data.monto_cancelado || 0);
  
  
  
        // Obtener cantidad de facturas vencidas
  
        const facturasVencidasResponse = await axios.get("http://127.0.0.1:5002/facturacion/facturas/vencido");
  
        setFacturasVencidas(facturasVencidasResponse.data.monto_vencido || 0);

        setLoading(false); // ✅ Una vez que los datos están cargados, desactivamos el estado de carga
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
        setLoading(false); // ✅ Asegurar que se desactiva el estado de carga incluso si hay un error
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Encabezado principal */}
      <div
        style={{
          background: "linear-gradient(90deg, #007bff, #0056b3)",
          color: "white",
          padding: "20px 30px",
          borderRadius: "10px",
          marginBottom: "20px",
          
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h2>Bienvenido al Panel de Administración</h2>
        <p>Desde aquí puedes administrar usuarios, planes, facturación y estadísticas del ISP.</p>
      </div>

      {/* Mostrar spinner de carga mientras se obtienen los datos */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spinner animation="border" variant="primary" />
          <p>Cargando datos...</p>
        </div>
      ) : (
        <Row className="g-4">
          {/* Usuarios Activos */}
          <Col md={4}>
            <Card className="text-center shadow" style={{ borderRadius: "10px", padding: "20px" }}>
              <FaUsers size={40} color="#007bff" />
              <Card.Body>
                <h5>Usuarios Activos</h5>
                <h2 style={{ color: "#007bff" }}>{usuariosActivos}</h2>
                <p className="text-muted">Total de usuarios registrados actualmente.</p>
              </Card.Body>
            </Card>
          </Col>

          {/* Planes Disponibles */}
          <Col md={4}>
            <Card className="text-center shadow" style={{ borderRadius: "10px", padding: "20px" }}>
              <FaClipboardCheck size={40} color="#28a745" />
              <Card.Body>
                <h5>Planes Disponibles</h5>
                <h2 style={{ color: "#28a745" }}>{planesDisponibles}</h2>
                <p className="text-muted">Número de planes de internet en oferta.</p>
              </Card.Body>
            </Card>
          </Col>

          {/* Facturación Pendiente */}
          <Col md={4}>
            <Card className="text-center shadow" style={{ borderRadius: "10px", padding: "20px" }}>
              <FaMoneyBillWave size={40} color="#dc3545" />
              <Card.Body>
                <h5>Facturación Pendiente</h5>
                <h2 style={{ color: "#dc3545" }}>${facturacionPendiente.toLocaleString()}</h2>
                <p className="text-muted">Monto total pendiente por facturar.</p>
              </Card.Body>
            </Card>
          </Col>

          {/* Facturas Canceladas */}
          <Col md={6}>
            <Card className="text-center shadow" style={{ borderRadius: "10px", padding: "20px" }}>
              <FaBan size={40} color="#ff9900" />
              <Card.Body>
                <h5>Facturas Canceladas</h5>
                <h2 style={{ color: "#ff9900" }}>{facturasCanceladas}</h2>
                <p className="text-muted">Facturas que fueron canceladas por el sistema o usuario.</p>
              </Card.Body>
            </Card>
          </Col>

          {/* Facturas Vencidas */}
          <Col md={6}>
            <Card className="text-center shadow" style={{ borderRadius: "10px", padding: "20px" }}>
              <FaExclamationTriangle size={40} color="#d63384" />
              <Card.Body>
                <h5>Facturas Vencidas</h5>
                <h2 style={{ color: "#d63384" }}>{facturasVencidas}</h2>
                <p className="text-muted">Facturas que han superado la fecha límite de pago.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardHome;
