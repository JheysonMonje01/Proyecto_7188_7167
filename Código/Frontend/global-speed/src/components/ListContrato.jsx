/*import { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaUpload, FaDownload } from "react-icons/fa";

const ContratosList = () => {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState({});
  const [planes, setPlanes] = useState({});
  const [listaPlanes, setListaPlanes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(""); // Nuevo filtro de planes
  const [dateRange, setDateRange] = useState(""); // Dejamos un solo filtro de fecha

  useEffect(() => {
    cargarContratos();
    cargarPlanes();
  }, []);

  const cargarContratos = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/contratos/");
      const contratosData = response.data;

      // Obtener todos los clientes únicos de la lista de contratos
      const uniqueClientIds = [...new Set(contratosData.map((c) => c.id_cliente))];

      const clientesData = {};
      const planesData = {};

      await Promise.all(
        uniqueClientIds.map(async (id_cliente) => {
          try {
            const clienteResponse = await axios.get(`http://127.0.0.1:5001/clientes/${id_cliente}`);
            const cliente = clienteResponse.data;
            clientesData[id_cliente] = cliente;

            // Obtener nombre del plan
            if (cliente.id_plan_servicio) {
              try {
                const planResponse = await axios.get(`http://127.0.0.1:5001/plan_servicios/${cliente.id_plan_servicio}`);
                planesData[cliente.id_plan_servicio] = planResponse.data.nombre;
              } catch (error) {
                console.error(`Error al obtener datos del plan ${cliente.id_plan_servicio}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error al obtener datos del cliente ${id_cliente}:`, error);
          }
        })
      );

      setClientes(clientesData);
      setPlanes(planesData);
      setContratos(contratosData);
    } catch (error) {
      console.error("Error al cargar contratos:", error);
      toast.error("Error al cargar la lista de contratos.");
    }
  };

  const cargarPlanes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/plan_servicios/planes");
      setListaPlanes(response.data); // Guardamos la lista de planes para el filtro
    } catch (error) {
      console.error("Error al cargar la lista de planes:", error);
      toast.error("Error al obtener la lista de planes.");
    }
  };

  const handleDownload = async (id_cliente) => {
    try {
      const cliente = clientes[id_cliente];
      if (!cliente) {
        toast.error("No se encontraron datos del cliente.");
        return;
      }

      const nombreArchivo = `Contrato_${cliente.apellido}_${cliente.nombre}`.replace(/\s+/g, "_") + ".pdf";

      const response = await axios.get(`http://127.0.0.1:5001/contratos/${id_cliente}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombreArchivo);
      document.body.appendChild(link);
      link.click();
      toast.success("Descarga en proceso...");
    } catch (error) {
      console.error("Error al descargar contrato:", error);
      toast.error("Error al descargar el contrato.");
    }
  };

  const handleUpload = async (event, id_cliente) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("archivo", file);

    try {
      await axios.put(`http://127.0.0.1:5001/contratos/${id_cliente}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Contrato actualizado con éxito.");
      cargarContratos();
    } catch (error) {
      console.error("Error al subir el contrato:", error);
      toast.error("Error al subir el contrato.");
    }
  };

  const contratosFiltrados = contratos.filter((contrato) => {
    const cliente = clientes[contrato.id_cliente] || {};
    const planNombre = planes[cliente.id_plan_servicio] || "N/A";

    return (
      (!selectedPlan || planNombre === selectedPlan) && // Filtrar por plan si hay un plan seleccionado
      (!searchTerm || cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       cliente.apellido?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!dateRange || (contrato.creado_en && new Date(contrato.creado_en).toISOString().slice(0, 10) === dateRange))
    );
  });

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-lg p-4">
        <h1 className="text-center mb-4 title">Lista de Contratos</h1>
        <div className="d-flex gap-2 mb-3">
          <Form.Control
            type="text"
            placeholder="🔍 Buscar por nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Form.Control
            type="date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />
          <Form.Select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
            <option value="">Todos los Planes</option>
            {listaPlanes.map((plan) => (
              <option key={plan.id} value={plan.nombre}>
                {plan.nombre}
              </option>
            ))}
          </Form.Select>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr className="table-dark text-white">
              <th>Apellido</th>
              <th>Nombre</th>
              <th>Plan de Servicio</th>
              <th>Fecha Creación</th>
              <th>Última Actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contratosFiltrados.map((contrato) => {
              const cliente = clientes[contrato.id_cliente] || {};
              const planNombre = planes[cliente.id_plan_servicio] || "N/A";
              return (
                <tr key={contrato.id_contrato}>
                  <td>{cliente.apellido || "N/A"}</td>
                  <td>{cliente.nombre || "N/A"}</td>
                  <td>{planNombre || "N/A"}</td>
                  <td>{contrato.creado_en ? new Date(contrato.creado_en).toLocaleDateString() : "N/A"}</td>
                  <td>{contrato.actualizado_en ? new Date(contrato.actualizado_en).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <Button variant="primary" size="sm" className="me-2" onClick={() => handleDownload(contrato.id_cliente)}>
                      <FaDownload />
                    </Button>
                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleUpload(e, contrato.id_cliente)}
                      style={{ display: "none" }}
                      id={`upload-${contrato.id_cliente}`}
                    />
                    <label htmlFor={`upload-${contrato.id_cliente}`} className="btn btn-warning btn-sm">
                      <FaUpload />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ContratosList;*/
import { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Form, Pagination, Alert } from "react-bootstrap";
import { toast,ToastContainer } from "react-toastify";
import { FaCloudDownloadAlt, FaCloudUploadAlt, FaSortUp, FaSortDown } from "react-icons/fa";

const ContratosList = () => {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState({});
  const [planes, setPlanes] = useState({});
  const [listaPlanes, setListaPlanes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const itemsPerPage = 3; // Cantidad de contratos por página

  useEffect(() => {
    cargarContratos();
    cargarPlanes();
  }, []);

  const cargarContratos = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/contratos/");
      const contratosData = response.data;
  
      const clientesData = {};
      const planesData = {};
      
      await Promise.all(
        contratosData.map(async (contrato) => {
          const { id_cliente, id_plan_servicio } = contrato; // Extraemos el id del cliente y plan desde el contrato
  
          // ✅ Obtener datos del cliente si aún no se han cargado
          if (!clientesData[id_cliente]) {
            try {
              const clienteResponse = await axios.get(`http://127.0.0.1:5001/clientes/${id_cliente}`);
              clientesData[id_cliente] = clienteResponse.data;
            } catch (error) {
              console.error(`Error al obtener datos del cliente ${id_cliente}:`, error);
            }
          }
  
          // ✅ Obtener datos del plan si aún no se han cargado y el contrato tiene un plan asociado
          if (id_plan_servicio && !planesData[id_plan_servicio]) {
            try {
              const planResponse = await axios.get(`http://127.0.0.1:5001/plan_servicios/${id_plan_servicio}`);
              planesData[id_plan_servicio] = planResponse.data.nombre;
            } catch (error) {
              console.error(`Error al obtener datos del plan ${id_plan_servicio}:`, error);
            }
          }
        })
      );
  
      setClientes(clientesData);
      setPlanes(planesData);
      setContratos(contratosData);
    } catch (error) {
      console.error("Error al cargar contratos:", error);
      toast.error("Error al cargar la lista de contratos.");
    }
  };
  

  const cargarPlanes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/plan_servicios/planes");
      setListaPlanes(response.data);
    } catch (error) {
      console.error("Error al cargar la lista de planes:", error);
      toast.error("Error al obtener la lista de planes.");
    }
  };

  const handleDownload = async (id_contrato) => {
    try {
      // Buscar el contrato correspondiente en la lista de contratos
      const contrato = contratos.find((c) => c.id_contrato === id_contrato);
  
      if (!contrato) {
        toast.error("No se encontraron datos del contrato.");
        return;
      }
  
      // Obtener datos del cliente
      const cliente = clientes[contrato.id_cliente];
      if (!cliente) {
        toast.error("No se encontraron datos del cliente.");
        return;
      }
  
      // Generar el nombre del archivo con la dirección del contrato
      const direccionSanitizada = contrato.direccion.replace(/\s+/g, "_").replace(/[,/]/g, "");
      const nombreArchivo = `Contrato_${cliente.apellido}_${cliente.nombre}_${direccionSanitizada}.pdf`;
  
      // Hacer la solicitud al backend para descargar el contrato
      const response = await axios.get(`http://127.0.0.1:5001/contratos/download/${id_contrato}`, {
        responseType: "blob", // Importante para manejar archivos binarios
      });
  
      // Crear un enlace de descarga para el archivo PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombreArchivo);
      document.body.appendChild(link);
      link.click();  // Iniciar la descarga
      document.body.removeChild(link); // Limpiar el DOM
      toast.success("Descarga en proceso...");
    } catch (error) {
      console.error("Error al descargar contrato:", error);
      toast.error("Error al descargar el contrato.");
    }
  };
  
  
  const handleUpload = async (event, id_contrato) => {
    const file = event.target.files[0];
    if (!file) {
      toast.error("No se seleccionó ningún archivo.");
      return;
    }
  
    const formData = new FormData();
    formData.append("archivo", file);
  
    console.log("📂 Subiendo contrato para ID:", id_contrato);
    console.log("📄 Archivo seleccionado:", file.name);
  
    try {
      const response = await axios.put(`http://127.0.0.1:5001/contratos/${id_contrato}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      console.log("✅ Respuesta del servidor:", response.data);
      toast.success("Contrato actualizado con éxito.");
      cargarContratos();
    } catch (error) {
      console.error("❌ Error al subir el contrato:", error.response ? error.response.data : error);
      toast.error("Error al subir el contrato.");
    }
  };
  
  

  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const contratosFiltrados = contratos.filter((contrato) => {
    const cliente = clientes[contrato.id_cliente] || {};
    const planNombre = planes[cliente.id_plan_servicio] || "N/A";

    return (
      (!selectedPlan || planNombre === selectedPlan) &&
      (!searchTerm || cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       cliente.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       cliente.cedula?.includes(searchTerm)) &&
      (!dateRange || (contrato.creado_en && new Date(contrato.creado_en).toISOString().slice(0, 10) === dateRange))
    );
  }).sort((a, b) => {
    if (!sortField) return 0;
    const clienteA = clientes[a.id_cliente] || {};
    const clienteB = clientes[b.id_cliente] || {};
    let valueA, valueB;

    switch (sortField) {
      case "cedula":
        valueA = clienteA.cedula || "";
        valueB = clienteB.cedula || "";
        break;
      case "nombre":
        valueA = clienteA.nombre || "";
        valueB = clienteB.nombre || "";
        break;
      case "apellido":
        valueA = clienteA.apellido || "";
        valueB = clienteB.apellido || "";
        break;
      case "creado_en":
        valueA = a.creado_en || "";
        valueB = b.creado_en || "";
        break;
      case "actualizado_en":
        valueA = a.actualizado_en || "";
        valueB = b.actualizado_en || "";
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginación: Cálculo de los contratos a mostrar en la página actual
  const totalPages = Math.ceil(contratosFiltrados.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const contratosPaginados = contratosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-lg p-4 bg-light">
        <h1 className="text-center mb-4 title text-primary">📜 Lista de Contratos</h1>

        {/* Filtros alineados y del mismo tamaño */}
        <div className="d-flex gap-3 mb-3">
          <Form.Control
            type="text"
            placeholder="🔍 Buscar por cédula, nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control-lg"
          />
          <Form.Control
            type="date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-control-lg"
          />
          <Form.Select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="form-control-lg"
          >
            <option value="">Todos los Planes</option>
            {listaPlanes.map((plan) => (
              <option key={plan.id} value={plan.nombre}>
                {plan.nombre}
              </option>
            ))}
          </Form.Select>
        </div>

        {contratosFiltrados.length > 0 ? (
          <Table
            striped
            bordered
            hover
            className="text-center"
            style={{ backgroundColor: "#e3f2fd", borderRadius: "10px", overflow: "hidden" }}
          >
            <thead style={{ backgroundColor: "#1976d2", color: "white" }}>
              <tr>
                <th onClick={() => handleSort("cedula")} style={{ cursor: "pointer" }}>
                  Cédula
                  <FaSortUp style={{ marginLeft: "5px", opacity: sortField === "cedula" && sortDirection === "asc" ? 1 : 0.5 }} />
                  <FaSortDown style={{ marginLeft: "5px", opacity: sortField === "cedula" && sortDirection === "desc" ? 1 : 0.5 }} />
                </th>
                <th onClick={() => handleSort("apellido")} style={{ cursor: "pointer" }}>
                  Apellido
                  <FaSortUp style={{ marginLeft: "5px", opacity: sortField === "apellido" && sortDirection === "asc" ? 1 : 0.5 }} />
                  <FaSortDown style={{ marginLeft: "5px", opacity: sortField === "apellido" && sortDirection === "desc" ? 1 : 0.5 }} />
                </th>
                <th onClick={() => handleSort("nombre")} style={{ cursor: "pointer" }}>
                  Nombre
                  <FaSortUp style={{ marginLeft: "5px", opacity: sortField === "nombre" && sortDirection === "asc" ? 1 : 0.5 }} />
                  <FaSortDown style={{ marginLeft: "5px", opacity: sortField === "nombre" && sortDirection === "desc" ? 1 : 0.5 }} />
                </th>
                <th>Plan de Servicio</th>
                <th>Direccion</th>
                <th onClick={() => handleSort("creado_en")} style={{ cursor: "pointer" }}>
                  Fecha Creación
                  <FaSortUp style={{ marginLeft: "5px", opacity: sortField === "creado_en" && sortDirection === "asc" ? 1 : 0.5 }} />
                  <FaSortDown style={{ marginLeft: "5px", opacity: sortField === "creado_en" && sortDirection === "desc" ? 1 : 0.5 }} />
                </th>
                <th onClick={() => handleSort("actualizado_en")} style={{ cursor: "pointer" }}>
                  Última Actualización
                  <FaSortUp style={{ marginLeft: "5px", opacity: sortField === "actualizado_en" && sortDirection === "asc" ? 1 : 0.5 }} />
                  <FaSortDown style={{ marginLeft: "5px", opacity: sortField === "actualizado_en" && sortDirection === "desc" ? 1 : 0.5 }} />
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratosPaginados.map((contrato) => {
                const cliente = clientes[contrato.id_cliente] || {};
                const planNombre = planes[contrato.id_plan_servicio] || "N/A";
                return (
                  <tr key={contrato.id_contrato}>
                    <td>{cliente.cedula || "N/A"}</td>
                    <td>{cliente.apellido || "N/A"}</td>
                    <td>{cliente.nombre || "N/A"}</td>
                    <td>{planNombre || "N/A"}</td>
                    <td>{contrato.direccion || "N/A"}</td>
                    <td>{contrato.creado_en ? new Date(contrato.creado_en).toLocaleDateString() : "N/A"}</td>
                    <td>{contrato.actualizado_en ? new Date(contrato.actualizado_en).toLocaleDateString() : "N/A"}</td>
                    <td className="d-flex justify-content-center gap-2">
                      <Button variant="info" size="sm" onClick={() => handleDownload(contrato.id_contrato)}>
                        <FaCloudDownloadAlt />
                      </Button>
                      <label className="btn btn-warning btn-sm">
                        <FaCloudUploadAlt />
                        <input type="file" accept="application/pdf" onChange={(e) => handleUpload(e, contrato.id_contrato)} hidden />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Alert variant="info">No hay datos disponibles.</Alert>
        )}

        {/* Paginación alineada a la derecha */}
        <div className="d-flex justify-content-end mt-3">
          <Pagination>
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {[...Array(totalPages)].map((_, index) => (
              <Pagination.Item
                key={index + 1}
                active={index + 1 === currentPage}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
          <ToastContainer />
        </div>
      </div>
    </div>
  );
};

export default ContratosList;
