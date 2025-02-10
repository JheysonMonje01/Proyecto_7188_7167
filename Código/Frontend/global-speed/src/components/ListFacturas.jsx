import { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrashAlt, FaCloudDownloadAlt, FaSearch, FaPlus, FaSortUp, FaSortDown } from "react-icons/fa";
import { Button, Spinner, Table, Badge, Form, InputGroup, Row, Col, Alert, Pagination } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const ListarFacturas = () => {
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState({});
  const [contratos, setContratos] = useState({});
  const [planes, setPlanes] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔍 Estados de Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const facturasPerPage = 5; // Número de facturas por página

  // Estado de ordenamiento
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const navigate = useNavigate();

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5002/facturacion/facturas");
      const facturasData = response.data;
      const uniqueClientIds = [...new Set(facturasData.map((c) => c.id_cliente))];
      const uniqueContratoIds = [...new Set(facturasData.map((c) => c.id_contrato))];

      const clientesData = {};
      const planesData = {};
      const contratoData={};

      await Promise.all(
        uniqueContratoIds.map(async (id_contrato) => {
          try {
            const contratoResponse = await axios.get(`http://127.0.0.1:5001/contratos/contrato/${id_contrato}`);
            const contrato = contratoResponse.data;
            contratoData[id_contrato] = contrato;

            if (contrato.id_plan_servicio) {
              try {
                const planResponse = await axios.get(`http://127.0.0.1:5001/plan_servicios/${contrato.id_plan_servicio}`);
                planesData[contrato.id_plan_servicio] = planResponse.data.nombre;
              } catch (error) {
                console.error(`Error al obtener el plan ${contrato.id_plan_servicio}:`, error);
              }
            }

          } catch (error) {
            console.error(`Error al obtener contrato ${id_contrato}:`, error);
          }
        })
      );

      await Promise.all(
        uniqueClientIds.map(async (id_cliente) => {
          try {
            const clienteResponse = await axios.get(`http://127.0.0.1:5001/clientes/${id_cliente}`);
            const cliente = clienteResponse.data;
            clientesData[id_cliente] = cliente;

          } catch (error) {
            console.error(`Error al obtener cliente ${id_cliente}:`, error);
          }
        })
      );

      setContratos(contratoData);
      setClientes(clientesData);
      setPlanes(planesData);
      setFacturas(facturasData);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      toast.error("Error al cargar la lista de facturas.");
    } finally {
      setLoading(false);
    }
  };

  const obtenerNombrePlan = (idContrato) => {
    const contrato = contratos[idContrato];
    return contrato ? planes[contrato.id_plan_servicio] || "No asignado" : "No asignado";
  };

  // 🎨 **Asignar Color de Estado**
  const obtenerColorEstado = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "dark"; // Amarillo
      case "cancelado":
        return "light"; // Verde claro
      case "vencido":
        return "light"; // Rojo claro
      default:
        return "secondary"; // Gris en caso de estado desconocido
    }
  };

  const obtenerBgEstado = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning"; // Amarillo
      case "cancelado":
        return "success"; // Verde
      case "vencido":
        return "danger"; // Rojo
      default:
        return "secondary"; // Gris en caso de estado desconocido
    }
  };

  const eliminarFactura = (idFactura) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`http://127.0.0.1:5002/facturacion/facturas/${idFactura}`)
          .then(() => {
            setFacturas(facturas.filter((factura) => factura.id_factura !== idFactura));
            Swal.fire("Eliminado", "La factura ha sido eliminada.", "success");
          })
          .catch((error) => {
            console.error("Error al eliminar la factura:", error);
            Swal.fire("Error", "No se pudo eliminar la factura.", "error");
          });
      }
    });
  };

  const handleDownload = async (id_factura) => {
    console.log("id_factura: ", id_factura );
    console.log("Direccion: ", contratos[facturas.id_contrato]?.direccion)
    try {
      const response = await axios.get(`http://127.0.0.1:5002/facturacion/facturas/${id_factura}`, {
        responseType: "blob",
      });

      if (response.status !== 200) {
        toast.error("No se encontró la factura.");
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Factura_${id_factura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Factura descargada con éxito.");
    } catch (error) {
      console.error("Error al descargar la factura:", error);
      toast.error("Error al descargar la factura.");
    }
  };

  // 🔍 **Filtro de Facturas**
  const facturasFiltradas = facturas.filter((factura) => {
    const cliente = clientes[factura.id_cliente] || {};
    const nombrePlan = obtenerNombrePlan(factura.id_cliente);

    return (
      (searchTerm === "" ||
        cliente.cedula?.includes(searchTerm) ||
        cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.apellido?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedPlan === "" || nombrePlan === selectedPlan) &&
      (selectedDate === "" || factura.creado_en.startsWith(selectedDate)) &&
      (selectedEstado === "" || factura.estado.toLowerCase() === selectedEstado.toLowerCase())
    );
  });

  // **Ordenamiento**
  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedFacturas = [...facturasFiltradas].sort((a, b) => {
    if (!sortField) return 0;

    const clienteA = clientes[a.id_cliente] || {};
    const clienteB = clientes[b.id_cliente] || {};
    let valueA, valueB;

    switch (sortField) {
      case "cedula":
        valueA = clienteA.cedula || "";
        valueB = clienteB.cedula || "";
        break;
      case "apellido":
        valueA = clienteA.apellido || "";
        valueB = clienteB.apellido || "";
        break;
      case "nombre":
        valueA = clienteA.nombre || "";
        valueB = clienteB.nombre || "";
        break;
      case "plan_servicio":
        valueA = obtenerNombrePlan(a.id_cliente) || "";
        valueB = obtenerNombrePlan(b.id_cliente) || "";
        break;
      case "monto":
        valueA = a.monto || 0;
        valueB = b.monto || 0;
        break;
      case "iva":
        valueA = a.iva || 0;
        valueB = b.iva || 0;
        break;
      case "creado_en":
        valueA = (a.creado_en) || "";
        valueB = (b.creado_en) || "";
        break;
      case "fecha_vencimiento":
        valueA = (a.fecha_vencimiento) || "";
        valueB = (b.fecha_vencimiento) || "";
        break;
      case "estado":
        valueA = a.estado || "";
        valueB = b.estado || "";
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // **Paginación: Calcular facturas por página**
  const indexOfLastFactura = currentPage * facturasPerPage;
  const indexOfFirstFactura = indexOfLastFactura - facturasPerPage;
  const currentFacturas = sortedFacturas.slice(indexOfFirstFactura, indexOfLastFactura);

  // **Función para cambiar de página**
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-lg p-4 bg-light">
        <h1 className="text-center mb-4 title text-primary">📜 Lista de Facturas</h1>

        {/* Botón para agregar factura */}
        <div className="d-flex justify-content-end mb-3">
          <Button variant="success" onClick={() => navigate("/dashboard/facturas/crear")}>
            <FaPlus className="me-2" /> Agregar Factura
          </Button>
        </div>

        {/* 🔍 Filtros con Mismo Tamaño */}
        <Row className="mb-3 g-2">
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar cédula, nombre o apellido"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ height: "40px", fontSize: "14px" }}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              style={{ height: "40px", fontSize: "14px" }}
            >
              <option value="">Todos los Planes</option>
              {Object.values(planes).map((plan, index) => (
                <option key={index} value={plan}>{plan}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ height: "40px", fontSize: "14px" }}
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              style={{ height: "40px", fontSize: "14px" }}
            >
              <option value="">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Vencido">Vencido</option>
            </Form.Select>
          </Col>
        </Row>

        {/* 📝 Tabla de Facturas */}
        {loading ? (
          <div className="d-flex justify-content-center my-4">
            <Spinner animation="grow" variant="primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        ) : (
          <>
            {facturasFiltradas.length > 0 ? (
              <Table striped bordered hover responsive className="shadow-lg">
                <thead className="bg-primary text-white">
                  <tr className="text-center">
                    <th>Direccion Contrato</th>
                    <th onClick={() => handleSort("cedula")} style={{ cursor: "pointer" }}>
                      Cédula
                      {sortField === "cedula" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("apellido")} style={{ cursor: "pointer" }}>
                      Apellido
                      {sortField === "apellido" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("nombre")} style={{ cursor: "pointer" }}>
                      Nombre
                      {sortField === "nombre" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("plan_servicio")} style={{ cursor: "pointer" }}>
                      Plan de Servicio
                      {sortField === "plan_servicio" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("monto")} style={{ cursor: "pointer" }}>
                      Monto
                      {sortField === "monto" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("iva")} style={{ cursor: "pointer" }}>
                      IVA
                      {sortField === "iva" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("creado_en")} style={{ cursor: "pointer" }}>
                      Fecha Creación
                      {sortField === "creado_en" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("fecha_vencimiento")} style={{ cursor: "pointer" }}>
                      Fecha Vencimiento
                      {sortField === "fecha_vencimiento" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th onClick={() => handleSort("estado")} style={{ cursor: "pointer" }}>
                      Estado
                      {sortField === "estado" ? (
                        sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSortUp style={{ opacity: 0.5 }} />
                      )}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFacturas.map((factura) => (
                    <tr key={factura.id_factura} className="text-center align-middle">
                      <td>{contratos[factura.id_contrato]?.direccion  || "N/A"} </td>
                      <td>{clientes[factura.id_cliente]?.cedula || "N/A"}</td>
                      <td>{clientes[factura.id_cliente]?.apellido || "Desconocido"}</td>
                      <td>{clientes[factura.id_cliente]?.nombre || "Desconocido"}</td>
                      <td>{obtenerNombrePlan(factura.id_contrato)}</td>
                      <td><strong>${Number(factura.monto).toFixed(2)}</strong></td>
                      <td><strong>${Number(factura.iva).toFixed(2)}</strong></td>
                      <td>{new Date(factura.creado_en).toLocaleDateString()}</td>
                      <td>{new Date(factura.fecha_vencimiento).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={obtenerBgEstado(factura.estado)} text={obtenerColorEstado(factura.estado)}>{factura.estado}</Badge>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm" onClick={() => eliminarFactura(factura.id_factura)}><FaEdit /></Button>{" "}
                        <Button variant="outline-danger" size="sm" onClick={() => eliminarFactura(factura.id_factura)}><FaTrashAlt /></Button>{" "}
                        <Button variant="info" size="sm" onClick={() => handleDownload(factura.id_factura)}><FaCloudDownloadAlt /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="info">No hay datos disponibles.</Alert>
            )}
          </>
        )}

        {/* Paginador */}
        <div className="d-flex justify-content-end mt-3">
          <Pagination>
            <Pagination.Prev
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {Array.from({ length: Math.ceil(facturasFiltradas.length / facturasPerPage) }, (_, index) => (
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
              disabled={currentPage === Math.ceil(facturasFiltradas.length / facturasPerPage)}
            />
          </Pagination>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default ListarFacturas;
