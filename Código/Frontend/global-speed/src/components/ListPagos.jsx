import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Table, Spinner, Card, Form, InputGroup, Button, Pagination } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { FaSearch, FaPlus, FaSortUp, FaSortDown } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const ListarPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState({});
  const [facturas, setFacturas] = useState({});
  const [planes, setPlanes] = useState({});
  const [contratos, setContratos] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pagosPerPage = 5; // Número de pagos por página

  // Estado de ordenamiento
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const navigate = useNavigate();

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5002/facturacion/pagos");
      const pagosData = response.data;
      const uniqueFacturaIds = [...new Set(pagosData.map((p) => p.id_factura))];

      const facturasData = {};
      const clientesData = {};
      const planesData = {};
      const contratosData = {};

      await Promise.all(
        uniqueFacturaIds.map(async (id_factura) => {
          try {
            const facturaResponse = await axios.get(`http://127.0.0.1:5002/facturacion/factur/${id_factura}`);
            const factura = facturaResponse.data;
            facturasData[id_factura] = factura;

            const clienteResponse = await axios.get(`http://127.0.0.1:5001/clientes/${factura.id_cliente}`);
            const cliente = clienteResponse.data;
            clientesData[factura.id_cliente] = cliente;

            const contratoResponse = await axios.get(`http://127.0.0.1:5001/contratos/contrato/${factura.id_contrato}`);
            const contrato = contratoResponse.data;
            contratosData[factura.id_contrato] = contrato;

            if (contrato.id_plan_servicio) {
              try {
                const planResponse = await axios.get(`http://127.0.0.1:5001/plan_servicios/${contrato.id_plan_servicio}`);
                planesData[contrato.id_plan_servicio] = planResponse.data.nombre;
              } catch (error) {
                console.error(`Error al obtener el plan ${contrato.id_plan_servicio}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error al obtener factura ${id_factura}:`, error);
          }
        })
      );
      setContratos(contratosData);
      setFacturas(facturasData);
      setClientes(clientesData);
      setPlanes(planesData);
      setPagos(pagosData);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast.error("Error al cargar la lista de pagos.");
    } finally {
      setLoading(false);
    }
  };

  const formatearFechaFactura = (fecha) => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const [year, month] = fecha.split("-");
    return `${meses[parseInt(month, 10) - 1]} ${year}`;
  };

  const pagosFiltrados = pagos.filter((pago) => {
    const factura = facturas[pago.id_factura];
    const cliente = clientes[factura?.id_cliente];
    const nombrePlan = planes[cliente?.id_plan_servicio] || "No asignado";
    const fechaPago = new Date(pago.fecha_pago).toISOString().split("T")[0];

    const filtroFechaDesdeDate = filtroFechaDesde ? new Date(filtroFechaDesde) : null;
    const filtroFechaHastaDate = filtroFechaHasta ? new Date(filtroFechaHasta) : null;
    const fechaPagoDate = new Date(fechaPago);

    return (
      (filtroTexto === "" || cliente?.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) || cliente?.apellido?.toLowerCase().includes(filtroTexto.toLowerCase()) || cliente?.cedula?.includes(filtroTexto)) &&
      (filtroPlan === "" || nombrePlan === filtroPlan) &&
      (!filtroFechaDesdeDate || fechaPagoDate >= filtroFechaDesdeDate) &&
      (!filtroFechaHastaDate || fechaPagoDate <= filtroFechaHastaDate)
    );
  });

  // **Ordenamiento**
  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedPagos = [...pagosFiltrados].sort((a, b) => {
    if (!sortField) return 0;

    const facturaA = facturas[a.id_factura];
    const facturaB = facturas[b.id_factura];
    const clienteA = clientes[facturaA?.id_cliente];
    const clienteB = clientes[facturaB?.id_cliente];
    let valueA, valueB;

    switch (sortField) {
      case "cedula":
        valueA = clienteA?.cedula || "";
        valueB = clienteB?.cedula || "";
        break;
      case "nombre":
        valueA = clienteA.nombre || "";
        valueB = clienteB.nombre || "";
        break;
      case "plan":
        valueA = planes[clienteA?.id_plan_servicio] || "";
        valueB = planes[clienteB?.id_plan_servicio] || "";
        break;
      case "fecha_factura":
        valueA = facturaA?.fecha_vencimiento || "";
        valueB = facturaB?.fecha_vencimiento || "";
        break;
      case "fecha_pago":
        valueA = a.fecha_pago || "";
        valueB = b.fecha_pago || "";
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // **Paginación: Calcular pagos por página**
  const indexOfLastPago = currentPage * pagosPerPage;
  const indexOfFirstPago = indexOfLastPago - pagosPerPage;
  const currentPagos = sortedPagos.slice(indexOfFirstPago, indexOfLastPago);

  // **Función para cambiar de página**
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container className="mt-4">
      <Card style={{ borderRadius: "15px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", border: "none", padding: "20px" }}>
        <h2 className="text-center mb-4 text-primary">📜 Registro de Pagos</h2>
        <div className="d-flex justify-content-end mb-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/dashboard/payments/register")} style={{ fontSize: "14px", padding: "8px 16px" }}>
            <FaPlus /> Añadir Pago
          </Button>
        </div>
        <div className="d-flex justify-content-center mb-3">
          <InputGroup style={{ width: "370px", marginRight: "10px" }}>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control type="text" placeholder="Buscar cédula, nombre o apellido" value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} />
          </InputGroup>
          <Form.Select style={{ width: "300px", marginRight: "10px" }} value={filtroPlan} onChange={(e) => setFiltroPlan(e.target.value)}>
            <option value="">Todos los Planes</option>
            {Object.values(planes).map((plan, index) => (
              <option key={index} value={plan}>{plan}</option>
            ))}
          </Form.Select>
          <Form.Control type="date" style={{ width: "270px", marginRight: "10px" }} value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} />
          <Form.Control type="date" style={{ width: "270px" }} value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} />
        </div>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table striped bordered hover responsive className="text-center">
            <thead className="bg-primary text-white">
              <tr>
                <th onClick={() => handleSort("cedula")} style={{ cursor: "pointer" }}>
                  Cédula
                  {sortField === "cedula" ? (
                    sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSortUp style={{ opacity: 0.5 }} />
                  )}
                </th>
                <th onClick={() => handleSort("nombre")} style={{ cursor: "pointer" }}>
                  Nombre Completo
                  {sortField === "nombre" ? (
                    sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSortUp style={{ opacity: 0.5 }} />
                  )}
                </th>
                <th>Direccion Contrato</th>
                <th onClick={() => handleSort("plan")} style={{ cursor: "pointer" }}>
                  Nombre del Plan
                  {sortField === "plan" ? (
                    sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSortUp style={{ opacity: 0.5 }} />
                  )}
                </th>
                <th onClick={() => handleSort("fecha_factura")} style={{ cursor: "pointer" }}>
                  Fecha Factura
                  {sortField === "fecha_factura" ? (
                    sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSortUp style={{ opacity: 0.5 }} />
                  )}
                </th>
                <th onClick={() => handleSort("fecha_pago")} style={{ cursor: "pointer" }}>
                  Fecha de Pago
                  {sortField === "fecha_pago" ? (
                    sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSortUp style={{ opacity: 0.5 }} />
                  )}
                </th>
                <th onClick={() => handleSort("monto")}>
                  Monto
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPagos.length > 0 ? (
                currentPagos.map((pago) => {
                  const factura = facturas[pago.id_factura] || {}; // 🔹 Asegurar que no es undefined
                  const contrato = contratos[factura.id_contrato] || {}; // 🔹 Asegurar que no es undefined
                  const cliente = clientes[contrato.id_cliente] || {}; // 🔹 Asegurar que no es undefined
                  const nombrePlan = planes[contrato.id_plan_servicio] || "No asignado"; // 🔹 Asegurar que no es undefined
                  return (
                    <tr key={pago.id_pago}>
                      <td>{cliente?.cedula}</td>
                      <td>{`${cliente?.nombre} ${cliente?.apellido}`}</td>
                      <td>{contrato?.direccion}</td>
                      <td>{nombrePlan}</td>
                      <td>{formatearFechaFactura(factura?.fecha_vencimiento)}</td>
                      <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                      <td><strong>${Number(pago.monto).toFixed(2)}</strong></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">No hay pagos registrados.</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}

        {/* Paginador */}
        <div className="d-flex justify-content-end mt-3">
          <Pagination>
            <Pagination.Prev
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {Array.from({ length: Math.ceil(pagosFiltrados.length / pagosPerPage) }, (_, index) => (
              <Pagination.Item
                key={index + 1}
                active={index + 1 === currentPage}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(pagosFiltrados.length / pagosPerPage)}
            />
          </Pagination>
        </div>
      </Card>
      <ToastContainer />
    </Container>
  );
};

export default ListarPagos;
