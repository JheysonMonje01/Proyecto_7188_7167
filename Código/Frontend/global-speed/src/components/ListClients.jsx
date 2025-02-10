/*
import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { validarCedula, validarRuc, validarTelefono, validarCorreo } from "../utils/validations";

const EditClientModal = ({ cliente, show, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    correo: "",
  });

  const [errors, setErrors] = useState({});

  // 🚀 Actualiza `formData` cuando `cliente` cambia
  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    // Validaciones
    if (name === "telefono") {
      let error = validarTelefono(value);
      if (error) {
        newErrors.telefono = error;
      } else {
        delete newErrors.telefono;
      }
    }

    if (name === "cedula") {
      let error = "";
      if (value.length === 10) {
        error = validarCedula(value);
      } else if (value.length === 13) {
        error = validarRuc(value);
      } else {
        error = "Debe ingresar una cédula (10 dígitos) o un RUC (13 dígitos).";
      }
      if (error) {
        newErrors.cedula = error;
      } else {
        delete newErrors.cedula;
      }
    }

    if (name === "nombre" || name === "apellido") {
      if (/[0-9]/.test(value)) {
        newErrors[name] = "El nombre y apellido no deben contener números.";
      } else {
        delete newErrors[name];
      }
    }

    if (name === "correo") {
      let error = validarCorreo(value);
      if (error) {
        newErrors.correo = error;
      } else {
        delete newErrors.correo;
      }
    }

    setErrors(newErrors);
    setFormData({ ...formData, [name]: value });
  };

  const verificarClienteDuplicado = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/verificar-duplicado", {
        params: {
          cedula: formData.cedula,
          correo: formData.correo,
          telefono: formData.telefono
        }
      });

      return response.data; // Devuelve los datos del cliente si existe
    } catch (error) {
      console.error("Error verificando cliente duplicado:", error);
      return null; // Si hay un error, asumimos que no hay duplicados
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }

    const clienteDuplicado = await verificarClienteDuplicado();

    if (clienteDuplicado && clienteDuplicado.id_cliente !== cliente.id_cliente) {
      let mensajeError = "El cliente ya existe con la misma ";
      let camposDuplicados = [];

      if (clienteDuplicado.cedula === formData.cedula) camposDuplicados.push("Cédula");
      if (clienteDuplicado.correo === formData.correo) camposDuplicados.push("Correo");
      if (clienteDuplicado.telefono === formData.telefono) camposDuplicados.push("Teléfono");

      if (camposDuplicados.length === 3) {
        mensajeError += "Cédula, Correo y Teléfono.";
      } else {
        mensajeError += `${camposDuplicados.join(" y ")}.`;
      }

      toast.error(mensajeError);
      return;
    }

    try {
      await axios.put(`http://127.0.0.1:5001/clientes/${cliente.id_cliente}`, formData);
      toast.success("✅ Cliente actualizado con éxito.");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      toast.error("❌ Error al actualizar el cliente.");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" name="nombre" value={formData.nombre} onChange={handleChange} required isInvalid={!!errors.nombre} />
            <Form.Control.Feedback type="invalid">{errors.nombre}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Apellido</Form.Label>
            <Form.Control type="text" name="apellido" value={formData.apellido} onChange={handleChange} required isInvalid={!!errors.apellido} />
            <Form.Control.Feedback type="invalid">{errors.apellido}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Cédula / RUC</Form.Label>
            <Form.Control type="text" name="cedula" value={formData.cedula} onChange={handleChange} required maxLength="13" isInvalid={!!errors.cedula} />
            <Form.Control.Feedback type="invalid">{errors.cedula}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Teléfono</Form.Label>
            <Form.Control type="text" name="telefono" value={formData.telefono} onChange={handleChange} required maxLength="10" isInvalid={!!errors.telefono} />
            <Form.Control.Feedback type="invalid">{errors.telefono}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Correo</Form.Label>
            <Form.Control type="email" name="correo" value={formData.correo} onChange={handleChange} required isInvalid={!!errors.correo} />
            <Form.Control.Feedback type="invalid">{errors.correo}</Form.Control.Feedback>
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-3 w-100">
            Guardar Cambios
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

EditClientModal.propTypes = {
  cliente: PropTypes.shape({
    id_cliente: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    apellido: PropTypes.string.isRequired,
    cedula: PropTypes.string.isRequired,
    telefono: PropTypes.string.isRequired,
    correo: PropTypes.string.isRequired,
  }),
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditClientModal;

/*
import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import EditClientModal from "./EditClientModal"; // Componente del modal
import "../styles/ListClients.css";

const ListClients = () => {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/");
      setClientes(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      toast.error("❌ Error al obtener la lista de clientes.");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cedula.includes(searchTerm)
  );

  const handleEdit = (cliente) => {
    setSelectedClient(cliente);
    setShowModal(true);
  };

  const handleDelete = async (id_cliente) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:5001/clientes/${id_cliente}`);
          toast.success("✅ Cliente eliminado con éxito.");
          fetchClientes();
        } catch (error) {
          console.error("Error al eliminar cliente:", error);
          toast.error("❌ Error al eliminar el cliente.");
        }
      }
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="title">Lista de Clientes</h2>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Buscar por nombre, apellido o cédula..."
        value={searchTerm}
        onChange={handleSearch}
      />

      {loading ? (
        <div className="loading-container">
          <span className="spinner-border text-primary"></span> Cargando clientes...
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped shadow-lg">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Plan de Servicio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id_cliente}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.cedula}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.correo}</td>
                    <td>{cliente.direccion}</td>
                    <td>{cliente.plan_servicio || "No asignado"}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(cliente)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(cliente.id_cliente)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    ❌ No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      // Modal de Edición 
      {showModal && (
        <EditClientModal
          cliente={selectedClient}
          show={showModal}
          onClose={() => setShowModal(false)}
          onUpdate={fetchClientes}
        />
      )}
    </div>
  );
};

export default ListClients;
*/

import { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Form, Badge, Pagination, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FaTrashAlt, FaEdit, FaUserPlus, FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import EditClientModal from "./EditClientModal"; // Asegúrate de que la ruta sea correcta
import "../styles/ListClients.css";
import { useNavigate } from "react-router-dom";

const ClientList = () => {
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("Todos");
  const [selectedEstado, setSelectedEstado] = useState("Todos");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 2;

  useEffect(() => {
    cargarPlanes();
  }, []);

  useEffect(() => {
    if (Object.keys(planes).length > 0) {
      cargarClientes();
    }
  }, [planes]);

  const cargarPlanes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/plan_servicios/planes");
      const planesData = response.data.reduce((acc, plan) => {
        acc[plan.id_plan_servicio] = plan.nombre;
        return acc;
      }, {});
      setPlanes(planesData);
    } catch (error) {
      console.error("Error al cargar planes:", error);
      toast.error("Error al cargar los planes de servicio.");
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/");
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar la lista de clientes.");
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedClients = [...clientes].sort((a, b) => {
    if (!sortColumn) return 0;

    const valueA = a[sortColumn] || "";
    const valueB = b[sortColumn] || "";

    if (typeof valueA === "string") {
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else {
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    }
  });

  const handleDelete = async (id_cliente) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:5001/clientes/${id_cliente}`);
          toast.success("Cliente eliminado correctamente.");
          cargarClientes();
        } catch (error) {
          console.error("Error al eliminar cliente:", error);
          toast.error("Error al eliminar el cliente.");
        }
      }
    });
  };

  const handleEdit = (cliente) => {
    setSelectedClient(cliente);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const handleUpdate = () => {
    cargarClientes();
  };

  // **Filtro de Clientes**
  const filteredClients = sortedClients.filter((cliente) => {
    const matchesSearch = `${cliente.nombre} ${cliente.apellido} ${cliente.cedula} ${cliente.direccion}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesPlan = selectedPlan === "Todos" || planes[cliente.id_plan_servicio] === selectedPlan;

    const matchesEstado =
      selectedEstado === "Todos" ||
      (selectedEstado === "Activo" && cliente.estado) ||
      (selectedEstado === "Inactivo" && !cliente.estado);

    return matchesSearch && matchesPlan && matchesEstado;
  });

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  // **Paginación: Calcular clientes por página**
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);

  // **Función para cambiar de página**
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-lg p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="title">Lista de Clientes</h1>
          <Button variant="success" className="btn-add-client" onClick={() => navigate("/dashboard/clients/register")}>
            <FaUserPlus className="me-2" /> Agregar Cliente
          </Button>
        </div>

        {/* Filtros */}
        <div className="row mb-3">
          {/* Filtro de búsqueda con lupa */}
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text"><FaSearch /></span>
              <Form.Control
                type="text"
                className="filter-input"
                placeholder="Buscar por nombre, apellido, cédula o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro por Plan - Mismo tamaño */}
          <div className="col-md-4">
            <Form.Select className="filter-input" value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
              <option value="Todos">Todos los Planes</option>
              {Object.values(planes).map((plan, index) => (
                <option key={index} value={plan}>{plan}</option>
              ))}
            </Form.Select>
          </div>

          {/* Filtro por Estado - Mismo tamaño */}
          <div className="col-md-4">
            <Form.Select className="filter-input" value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </Form.Select>
          </div>
        </div>

        <div className="table-responsive mt-3">
          {filteredClients.length > 0 ? (
            <Table className="custom-table">
              <thead>
                <tr>
                  {["cedula", "nombre", "apellido", "telefono", "correo", "direccion", "Plan de Servicio"].map((col) => (
                    <th key={col} className="sortable" onClick={() => handleSort(col)}>
                      {col.charAt(0).toUpperCase() + col.slice(1)} {renderSortIcon(col)}
                    </th>
                  ))}
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map((cliente) => (
                  <tr key={cliente.id_cliente}>
                    <td>{cliente.cedula}</td>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.correo}</td>
                    <td>{cliente.direccion}</td>
                    <td>
                      {cliente.id_plan_servicio && planes[cliente.id_plan_servicio]
                        ? planes[cliente.id_plan_servicio]
                        : "No asignado"}
                    </td>
                    <td className="text-center">
                      {cliente.estado ? (
                        <Badge bg="success" className="estado-badge">ACTIVO</Badge>
                      ) : (
                        <Badge bg="secondary" className="estado-badge">INACTIVO</Badge>
                      )}
                    </td>
                    <td className="text-center">
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(cliente)}>
                        <FaEdit size={16} />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.id_cliente)}>
                        <FaTrashAlt size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">No hay datos disponibles.</Alert>
          )}
        </div>

        {/* Paginador */}
        <Pagination className="d-flex justify-content-end mt-3">
          <Pagination.Prev
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {Array.from({ length: Math.ceil(filteredClients.length / clientsPerPage) }, (_, index) => (
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
            disabled={currentPage === Math.ceil(filteredClients.length / clientsPerPage)}
          />
        </Pagination>

      </div>
      {selectedClient && (
        <EditClientModal
          cliente={selectedClient}
          show={showModal}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default ClientList;
