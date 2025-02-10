import { useState, useEffect } from "react";
import { Table, Container, Button, Badge, Spinner, Row, Col, Card, Form, InputGroup, Pagination,Modal } from "react-bootstrap";
import { FaUser, FaUserPlus, FaUserTie, FaEdit, FaTrash, FaSearch, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import PropTypes from "prop-types";


const ListarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPerPage = 5; // Número de usuarios por página
  const navigate = useNavigate();
  const [setRolesDisponibles] = useState([]);

  const [errorTelefono, setErrorTelefono] = useState(""); // Estado para errores del teléfono
  const [errorCorreo, setErrorCorreo] = useState(""); // Estado para errores del correo
  const [usuarioOriginal, setUsuarioOriginal] = useState(null); // Guardamos datos originales
  // Estados para los filtros
  const [filtroCorreo, setFiltroCorreo] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [nuevaContrasenia, setNuevaContrasenia] = useState(""); // Estado para la contraseña nueva
  const [errorContrasenia, setErrorContrasenia] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar u ocultar la contraseña
   // Estado para modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioAutenticadoId, setUsuarioAutenticadoId] = useState(null);
  
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUsuarioAutenticadoId(parseInt(userId, 10)); // Convertirlo a número
      console.log("Usuario autenticado ID en ListarUsuarios:", userId);
    } else {
      console.warn("No se encontró el userId en localStorage");
    }
    fetchUsuarios();
    fetchRolesDisponibles();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/usuarios");
      setUsuarios(response.data);
      const rolesData = {};
      for (const usuario of response.data) {
        if (!rolesData[usuario.id_rol]) {
          rolesData[usuario.id_rol] = await fetchRol(usuario.id_rol);
        }
      }
      setRoles(rolesData);
    } catch (error) {
      Swal.fire({ title: "Error", text: "No se pudieron cargar los usuarios", icon: "error", timer: 1500, showConfirmButton: false });
      console.error("Error al obtener los usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRol = async (id_rol) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/rol/${id_rol}`);
      return response.data.rol.toUpperCase();
    } catch (error) {
      console.error(`Error al obtener el rol ${id_rol}:`, error);
      return "DESCONOCIDO";
    }
  };
  // Función para abrir modal de edición
  const handleEdit = (usuario) => {
    // Crear una copia del usuario seleccionado
    let usuarioEdit = { ...usuario };

    // Si el número de teléfono empieza con +593, cambiarlo a 0
    if (usuarioEdit.telefono.startsWith("+593")) {
        usuarioEdit.telefono = "0" + usuarioEdit.telefono.slice(4);
    }
    setUsuarioOriginal(usuario);
    setUsuarioEditando(usuarioEdit);
    setErrorCorreo(""); // Limpiar mensajes de error
    setErrorTelefono(""); // Limpiar mensajes de error
    setErrorContrasenia("");
    setNuevaContrasenia(""); // Limpiar el campo de contraseña
    setShowEditModal(true);
  };

  const fetchRolesDisponibles = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/roles"); // Ajusta la URL si es diferente
      setRolesDisponibles(response.data);
    } catch (error) {
      console.error("Error al obtener los roles:", error);
    }
  };

  // **Cerrar modal y restaurar datos originales**
  const handleCloseModal = () => {
    if (usuarioOriginal) {
      setUsuarioEditando({ ...usuarioOriginal }); // Restaurar valores originales
    }
    setShowEditModal(false);
    setErrorCorreo(""); // Limpiar mensajes de error al cerrar
    setErrorTelefono(""); // Limpiar mensajes de error al cerrar
    setErrorContrasenia("");
    setNuevaContrasenia(""); // Limpiar campo de contraseña
  };

  // **Validación de contraseña**
  const validarContrasenia = (contrasenia) => {
    if (contrasenia.length < 8) return "Debe tener al menos 8 caracteres.";
    if (!/[0-9]/.test(contrasenia)) return "Debe contener al menos un número.";
    if (!/[A-Z]/.test(contrasenia)) return "Debe contener al menos una mayúscula.";
    if (!/[a-z]/.test(contrasenia)) return "Debe contener al menos una minúscula.";
    if (!/[^A-Za-z0-9]/.test(contrasenia)) return "Debe contener al menos un carácter especial.";
    return "";
  };

  // Función para actualizar usuario
  const handleUpdate = async () => {
    if (!usuarioEditando) return;
  
    // Crear una copia de los datos editados
    const dataActualizada = { ...usuarioEditando };

    // Validar que el correo no esté vacío y tenga un formato válido
    if (!dataActualizada.correo.trim()) {
        setErrorCorreo("El correo no puede estar vacío.");
        return;
    } else if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(dataActualizada.correo)) {
        setErrorCorreo("Ingrese un correo válido.");
        return;
    } else {
        setErrorCorreo(""); // Borrar error si el correo es válido
    }

    // Validar que el teléfono no esté vacío y tenga exactamente 10 dígitos
    if (!dataActualizada.telefono.trim()) {
        setErrorTelefono("El teléfono no puede estar vacío.");
        return;
    } else if (!/^[0-9]{10}$/.test(dataActualizada.telefono)) {
        setErrorTelefono("El teléfono debe tener 10 dígitos y comenzar con 0.");
        return;
    } else {
        setErrorTelefono(""); // Borrar error si el teléfono es válido
    }
  
    // Si hay una nueva contraseña, se envía al backend
    if (nuevaContrasenia.trim()) {
      const error = validarContrasenia(nuevaContrasenia);
      if (error) {
        setErrorContrasenia(error);
        return;
      } else {
        setErrorContrasenia("");
        dataActualizada.contrasenia = nuevaContrasenia;
      }
    }

    // Convertir "0" a "+593" antes de enviarlo al backend
    if (dataActualizada.telefono.startsWith("0")) {
        dataActualizada.telefono = "+593" + dataActualizada.telefono.slice(1);
    }

    // Validar si el correo ya existe en otro usuario
    const correoExiste = usuarios.some(
        (usuario) => usuario.correo === dataActualizada.correo && usuario.id_usuario !== dataActualizada.id_usuario
      );
  
      if (correoExiste) {
        setErrorCorreo("Este correo ya está registrado.");
        return;
      } else {
        setErrorCorreo(""); // Borrar error si no hay duplicado
      }
  
      // Validar si el teléfono ya existe en otro usuario
      const telefonoExiste = usuarios.some(
        (usuario) => usuario.telefono === dataActualizada.telefono && usuario.id_usuario !== dataActualizada.id_usuario
      );
  
      if (telefonoExiste) {
        setErrorTelefono("Este teléfono ya está registrado.");
        return;
      } else {
        setErrorTelefono(""); // Borrar error si no hay duplicado
      }
    
    
    console.log("Datos enviados para actualizar el usuario: ", dataActualizada);
    try {
      // Enviar datos al backend
      await axios.put(`http://127.0.0.1:5000/api/usuario/${usuarioEditando.id_usuario}`, dataActualizada);
  
      // Mostrar mensaje de éxito
      Swal.fire({
        title: "Actualizado",
        text: "Usuario actualizado correctamente",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
  
      // Recargar la lista de usuarios para reflejar los cambios
      fetchUsuarios();
  
      // Cerrar el modal
      setShowEditModal(false);
  
      // Limpiar el campo de contraseña después de actualizar
      setNuevaContrasenia("");
    } catch (error) {
      // Manejar errores y mostrar alerta
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el usuario",
        icon: "error",
        timer: 1500,
        showConfirmButton: false
      });
      console.error("Error al actualizar usuario:", error);
    }
  };
  
  /*const handleEdit = (usuario) => {
    Swal.fire({ title: "Editar Usuario", text: `Editar usuario: ${usuario.correo}`, icon: "info", timer: 1500, showConfirmButton: false });
  };*/

  const handleDelete = async (id_usuario) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:5000/api/usuario/${id_usuario}`);
          Swal.fire({ title: "Eliminado", text: "Usuario eliminado correctamente", icon: "success", timer: 1500, showConfirmButton: false });
          fetchUsuarios();
        } catch (error) {
          Swal.fire({ title: "Error", text: "No se pudo eliminar el usuario", icon: "error", timer: 1500, showConfirmButton: false });
        }
      }
    });
  };
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTelefono = (telefono) => {
    if (!telefono) return ""; // Si no hay número, devolver vacío

    // Si el número empieza con +593, cambiarlo a 0
    if (telefono.startsWith("+593")) {
        return "0" + telefono.slice(4);
    }

    return telefono; // Devolver el número sin modificar si no empieza con +593
  };


  // **Filtrar usuarios**
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const matchesCorreo = usuario.correo.toLowerCase().includes(filtroCorreo.toLowerCase());
    const matchesRol = filtroRol === "" || roles[usuario.id_rol]?.toLowerCase().includes(filtroRol.toLowerCase());
    const matchesEstado = filtroEstado === "" || (filtroEstado === "Activo" && usuario.estado) || (filtroEstado === "Inactivo" && !usuario.estado);
    return matchesCorreo && matchesRol && matchesEstado;
  });

  // **Paginación: Calcular usuarios por página**
  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = usuariosFiltrados.slice(indexOfFirstUsuario, indexOfLastUsuario);

  // **Función para cambiar de página**
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <h2 className="text-primary fw-bold">
            <FaUser className="me-2" /> Listado de Usuarios
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-end mb-3">
        <Col md="auto">
          <Button variant="primary" className="me-2 px-4 py-2 shadow fw-bold rounded-3" onClick={() => navigate("/crear-usuario")}>
            <FaUserPlus className="me-2" /> Crear Usuario
          </Button>
          <Button variant="info" className="px-4 py-2 shadow fw-bold text-white rounded-3" onClick={() => navigate("/crear-rol")}>
            <FaUserTie className="me-2" /> Crear Rol
          </Button>
        </Col>
      </Row>
      <Row className="justify-content-center mb-3">
        <Col md={4}>
          <InputGroup style={{ width: "100%" }}>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por correo"
              value={filtroCorreo}
              onChange={(e) => setFiltroCorreo(e.target.value)}
              style={{ height: "40px", fontSize: "14px" }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={{ height: "40px", fontSize: "14px", width: "100%" }}
          >
            <option value="">Todos los Roles</option>
            {Object.values(roles).map((rol, index) => (
              <option key={index} value={rol}>{rol}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ height: "40px", fontSize: "14px", width: "100%" }}
          >
            <option value="">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Form.Select>
        </Col>
      </Row>
      <Card className="shadow-lg p-4 border-0 rounded-4">
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="alert alert-warning text-center">No hay usuarios registrados.</div>
        ) : (
          <div className="table-responsive">
            <Table className="table align-middle table-hover borderless">
              <thead className="bg-primary text-white rounded-top">
                <tr>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Creado</th>
                  <th className="p-3">Actualizado</th>
                  <th className="p-3 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
  {currentUsuarios.map((usuario) => {
    const esUsuarioAutenticado = usuario.id_usuario === usuarioAutenticadoId;
    const esSuperUsuario = roles[usuario.id_rol] === "SUPERUSUARIO";
    const esAdministrador = roles[usuario.id_rol] === "ADMINISTRADOR";
    const esUsuario = roles[usuario.id_rol] === "USUARIO";

    return (
      <tr key={usuario.id_usuario} className="rounded-3 shadow-sm">
        <td className="fw-semibold">{usuario.correo}</td>
        <td className="fw-semibold">{formatTelefono(usuario.telefono)}</td>
        <td className="fw-bold text-uppercase">{roles[usuario.id_rol] || "Cargando..."}</td>
        <td>
          <Badge bg={usuario.estado ? "primary" : "danger"} className="px-3 py-2 rounded-pill">
            {usuario.estado ? "ACTIVO" : "INACTIVO"}
          </Badge>
        </td>
        <td className="text-muted">{formatDate(usuario.creado_en)}</td>
        <td className="text-muted">{formatDate(usuario.actualizado_en)}</td>
        <td className="text-end">
          <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>

            {/* 🔹 PERMISO DE EDICIÓN */}
            
              <Button
                variant="outline-primary"
                size="sm"
                className="px-2 rounded-circle shadow-sm"
                onClick={() => handleEdit(usuario)}
              >
                <FaEdit />
              </Button>
            

            {/* 🔹 PERMISO DE ELIMINACIÓN */}
            {((esSuperUsuario && !esUsuarioAutenticado) || // Superusuario elimina a todos menos a sí mismo
              (esAdministrador && usuario.id_rol === 3)) && ( // Admin elimina solo usuarios normales
              <Button
                variant="outline-danger"
                size="sm"
                className="px-2 rounded-circle shadow-sm"
                onClick={() => handleDelete(usuario.id_usuario)}
              >
                <FaTrash />
              </Button>
            )}

          </div>
        </td>
      </tr>
    );
  })}
</tbody>

            </Table>
          </div>
        )}

        {/* Paginador */}
        <div className="d-flex justify-content-end mt-3">
          <Pagination>
            <Pagination.Prev
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {Array.from({ length: Math.ceil(usuariosFiltrados.length / usuariosPerPage) }, (_, index) => (
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
              disabled={currentPage === Math.ceil(usuariosFiltrados.length / usuariosPerPage)}
            />
          </Pagination>
        </div>
      </Card>

      {/* Modal de Edición */}
      <Modal show={showEditModal} onHide={handleCloseModal} centered>
  <Modal.Header closeButton className="bg-light">
    <Modal.Title className="fw-bold text-primary">Editar Usuario</Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-4">
    <Form>
    <Form.Group className="mb-3">
  <Form.Label className="fw-semibold">Correo</Form.Label>
  <Form.Control 
    type="email" 
    value={usuarioEditando?.correo} 
    onChange={(e) => {
      setUsuarioEditando({ ...usuarioEditando, correo: e.target.value });
      setErrorCorreo(""); // Borrar error si el usuario edita el campo
    }} 
    className={`rounded-3 ${errorCorreo ? "is-invalid" : ""}`} 
  />
  {errorCorreo && <div className="invalid-feedback">{errorCorreo}</div>}
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label className="fw-semibold">Teléfono</Form.Label>
  <Form.Control 
    type="text" 
    value={usuarioEditando?.telefono || ""} 
    onChange={(e) => {
      const input = e.target.value;

      // Permitir solo números
      if (!/^\d*$/.test(input)) return;

      // Asegurar que el número no tenga más de 10 dígitos
      if (input.length > 10) return;

      // Actualizar el estado del usuario
      setUsuarioEditando({ ...usuarioEditando, telefono: input });
      setErrorTelefono(""); // Borrar error si el usuario edita el campo

      // Validación de número correcto
      if (!input.startsWith("0")) {
        setErrorTelefono("El número debe comenzar con 0.");
      } else if (input.length !== 10) {
        setErrorTelefono("El número debe tener 10 dígitos.");
      } else {
        setErrorTelefono(""); // Si es válido, borrar error
      }
    }}  
    className={`rounded-3 ${errorTelefono ? "is-invalid" : ""}`} 
  />
  {errorTelefono && <div className="invalid-feedback">{errorTelefono}</div>}
</Form.Group>
<Form.Group className="mb-3">
  <Form.Label className="fw-semibold">Contraseña (opcional)</Form.Label>
  <div className="input-group">
    <Form.Control
      type={showPassword ? "text" : "password"}
      placeholder="Nueva contraseña"
      value={nuevaContrasenia}
      onChange={(e) => {
        setNuevaContrasenia(e.target.value);
        setErrorContrasenia(validarContrasenia(e.target.value)); // Validación en tiempo real
      }}
      className={`rounded-start-3 ${errorContrasenia ? "is-invalid" : ""}`} // Bordes redondeados solo a la izquierda
    />
    <Button
      variant="outline-secondary"
      className="rounded-end-3 px-3 d-flex align-items-center"
      onClick={() => setShowPassword(!showPassword)}
      style={{ borderLeft: "none" }} // Eliminar borde izquierdo para que se una al input
    >
      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </Button>
  </div>
  {errorContrasenia && (
    <div className="text-danger mt-1" style={{ fontSize: "0.85rem" }}>
      {errorContrasenia}
    </div>
  )}
</Form.Group>


</Form>
  </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between p-3">
        <Button variant="outline-secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleUpdate} className="px-4 py-2 rounded-3 fw-semibold shadow-sm">
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );

};
ListarUsuarios.propTypes = {
  usuarioAutenticado: PropTypes.object,
  rolUsuario: PropTypes.string
};


export default ListarUsuarios;
