import { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Card, Spinner, Row, Col, Container, Alert } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import {
  FaMoneyBillWave, FaUser, FaIdCard, FaEnvelope, FaPhone,
  FaFileInvoice, FaNetworkWired, FaDollarSign, FaCalendarAlt
} from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const PagoEfectivo = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [totalPagar, setTotalPagar] = useState(0);
  const [planServicio, setPlanServicio] = useState("Cargando...");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [pagoRealizado, setPagoRealizado] = useState(false);
  const [cedula, setCedula] = useState("");
  const [sinFacturas, setSinFacturas] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState("");

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/");
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar la lista de clientes.");
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = async (e) => {
    const id_cliente = e.target.value;
    setSelectedClienteId(id_cliente);
    setCedula(""); // Resetear el campo de cédula al cambiar de cliente
    setSinFacturas(false); // Resetear el estado de sin facturas

    if (!id_cliente) {
      setSelectedCliente(null);
      setFacturasPendientes([]);
      setTotalPagar(0);
      setPlanServicio("Cargando...");
      return;
    }

    const clienteSeleccionado = clientes.find((c) => c.id_cliente == id_cliente);
    setSelectedCliente(clienteSeleccionado);
    setPagoRealizado(false); // Resetear el estado de pago realizado al cambiar de cliente

    try {
      const response = await axios.get(`http://127.0.0.1:5002/facturacion/facturas_pendientes/${id_cliente}`);
      if (response.data.length === 0) {
        setSinFacturas(true); // Mostrar mensaje de sin facturas
      }
      setFacturasPendientes(response.data);
      setTotalPagar(response.data.reduce((acc, factura) => acc + parseFloat(factura.monto), 0));
    } catch (error) {
      console.error("Error al cargar facturas pendientes:", error);
      setFacturasPendientes([]);
      setTotalPagar(0);
    }

    if (clienteSeleccionado.id_plan_servicio) {
      try {
        const response = await axios.get(`http://127.0.0.1:5001/plan_servicios/${clienteSeleccionado.id_plan_servicio}`);
        setPlanServicio(response.data.nombre);
      } catch (error) {
        console.error("Error al cargar el plan de servicio:", error);
        setPlanServicio("No asignado");
      }
    } else {
      setPlanServicio("No asignado");
    }
  };

  const handleCedulaChange = async (e) => {
    const cedula = e.target.value;
    setCedula(cedula);
    setSelectedClienteId(""); // Resetear el filtro de selección de cliente
    setSinFacturas(false); // Resetear el estado de sin facturas

    if (!cedula) {
      setSelectedCliente(null);
      setFacturasPendientes([]);
      setTotalPagar(0);
      setPlanServicio("Cargando...");
      return;
    }

    const clienteSeleccionado = clientes.find((c) => c.cedula == cedula);
    setSelectedCliente(clienteSeleccionado);
    setPagoRealizado(false); // Resetear el estado de pago realizado al cambiar de cliente

    if (clienteSeleccionado) {
      try {
        const response = await axios.get(`http://127.0.0.1:5002/facturacion/facturas_pendientes/${clienteSeleccionado.id_cliente}`);
        if (response.data.length === 0) {
          setSinFacturas(true); // Mostrar mensaje de sin facturas
        }
        setFacturasPendientes(response.data);
        setTotalPagar(response.data.reduce((acc, factura) => acc + parseFloat(factura.monto), 0));
      } catch (error) {
        console.error("Error al cargar facturas pendientes:", error);
        setFacturasPendientes([]);
        setTotalPagar(0);
      }

      if (clienteSeleccionado.id_plan_servicio) {
        try {
          const response = await axios.get(`http://127.0.0.1:5001/plan_servicios/${clienteSeleccionado.id_plan_servicio}`);
          setPlanServicio(response.data.nombre);
        } catch (error) {
          console.error("Error al cargar el plan de servicio:", error);
          setPlanServicio("No asignado");
        }
      } else {
        setPlanServicio("No asignado");
      }
    } else {
      setSelectedCliente(null);
      setFacturasPendientes([]);
      setTotalPagar(0);
      setPlanServicio("Cargando...");
      setSinFacturas(false); // Resetear el estado de sin facturas
    }
  };

  const handlePago = async () => {
    if (!selectedCliente || facturasPendientes.length === 0) {
      toast.error("No hay facturas pendientes para pagar.");
      return;
    }

    setProcesando(true);
    try {
      for (const factura of facturasPendientes) {
        await axios.post("http://127.0.0.1:5002/facturacion/pagos", { id_factura: factura.id_factura });
      }
      setFacturasPendientes([]);
      setTotalPagar(0);
      setPagoRealizado(true); // Marcar el pago como realizado
      Swal.fire({
        icon: "success",
        title: "Pago realizado con éxito",
        text: "El pago se ha procesado correctamente.",
      });
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Hubo un error al procesar el pago.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Container style={{ marginLeft: "400px"}}>
      <Card style={{ width: "700px", borderRadius: "15px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", border: "none" }}>
        <Card.Header className="text-white text-center" style={{ backgroundColor: "#007bff", fontSize: "1.6rem", padding: "20px" }}>
          <FaMoneyBillWave style={{ marginRight: "10px" }} /> Pago en Efectivo
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label><FaUser /> Seleccionar Cliente</Form.Label>
                <Form.Select value={selectedClienteId} onChange={handleClienteChange} disabled={loading} style={{ height: "40px" }}>
                  <option value="">Seleccione un Cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.cedula} - {cliente.nombre} {cliente.apellido}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label><FaIdCard /> Buscar por Cédula</Form.Label>
                <Form.Control type="text" value={cedula} onChange={handleCedulaChange} placeholder="Ingrese la cédula del cliente" style={{ height: "40px" }} />
              </Form.Group>
            </Col>
          </Row>

          {sinFacturas && (
            <Alert variant="info" className="mt-3">
              No hay facturas pendientes para este cliente.
            </Alert>
          )}

          {selectedCliente && !pagoRealizado && !sinFacturas && (
            <Card className="mt-3 p-4" style={{ borderRadius: "10px", backgroundColor: "#f8f9fa", border: "1px solid #ddd", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <h4 className="text-center mb-3">Información del Cliente</h4>
              <Form>
                <Row>
                  <Col md={6}><Form.Group><Form.Label><FaIdCard color="#007bff" /> Nombre:</Form.Label> <Form.Control readOnly value={`${selectedCliente.nombre} ${selectedCliente.apellido}`} /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label><FaEnvelope color="#007bff" /> Correo:</Form.Label> <Form.Control readOnly value={selectedCliente.correo} /></Form.Group></Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}><Form.Group><Form.Label><FaPhone color="#007bff" /> Teléfono:</Form.Label> <Form.Control readOnly value={selectedCliente.telefono} /></Form.Group></Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}><Form.Group><Form.Label><FaFileInvoice color="#007bff" /> Facturas a Pagar:</Form.Label> <Form.Control readOnly value={facturasPendientes.length} /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label><FaNetworkWired color="#007bff" /> Plan de Servicio:</Form.Label> <Form.Control readOnly value={planServicio} /></Form.Group></Col>
                </Row>
              </Form>
            </Card>
          )}
          {selectedCliente && !pagoRealizado && !sinFacturas && (
            <div className="mt-3 p-3 text-center" style={{ backgroundColor: "#e9f5ff", borderRadius: "10px", border: "1px solid #007bff" }}>
              <h3 style={{ color: "#007bff", margin: 0 }}>
                <FaDollarSign /> Total a Pagar: <strong>${totalPagar.toFixed(2)}</strong>
              </h3>
            </div>
          )}
          {selectedCliente && !pagoRealizado && !sinFacturas && (
            <div className="mt-3 text-center" style={{ fontSize: "1.2rem", color: "#1b1c1c" }}>
              <FaCalendarAlt /> Fecha de Pago: <strong>{new Date().toLocaleDateString()}</strong>
            </div>
          )}
          {pagoRealizado && (
            <div className="mt-3 text-center" style={{ fontSize: "1.2rem", color: "#1b1c1c" }}>
              <strong>No hay facturas pendientes a pagar.</strong>
            </div>
          )}
          <Button className="mt-3 w-100" variant="primary" disabled={!selectedCliente || facturasPendientes.length === 0 || procesando || pagoRealizado} onClick={handlePago}>
            {procesando ? <Spinner animation="border" size="sm" /> : "Realizar Pago"}
          </Button>
        </Card.Body>
      </Card>
      <ToastContainer />
    </Container>
  );
};

export default PagoEfectivo;
