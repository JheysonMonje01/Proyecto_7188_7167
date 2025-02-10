import { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Card, Container, Nav, InputGroup } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import { FaUser, FaEnvelope, FaPhone, FaEye, FaEyeSlash, FaSearch } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const RegisterUser = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    cedula: "",
    correo: "",
    contrasenia: "",
    telefono: "",
    id_rol: null
  });
  const [userRole, setUserRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      axios.get(`http://127.0.0.1:5000/api/usuario/${userId}`)
        .then(response => {
          const roleId = response.data.id_rol;
          setUserRole(roleId);

          axios.get("http://127.0.0.1:5000/api/roles")
            .then(roleResponse => {
              setRoles(roleResponse.data);
              let allowedRoles = [];

              if (roleId === 1) { // Superusuario
                allowedRoles = roleResponse.data.filter(role => role.id_rol !== 1);
              } else if (roleId === 2) { // Administrador
                allowedRoles = roleResponse.data.filter(role => role.id_rol === 3 || role.id_rol === 4);
              }

              setFilteredRoles(allowedRoles);
              if (allowedRoles.length > 0) {
                setSelectedRole(allowedRoles[0]);
                setFormData(prevData => ({ ...prevData, id_rol: allowedRoles[0].id_rol }));
              }
            })
            .catch(() => {
              toast.error("Error al obtener roles");
            });
        })
        .catch(() => {
          toast.error("Error al obtener el rol del usuario");
        });
    }
  }, []);

  const formatearNumero = (numero) => {
    if (/^0\d{9}$/.test(numero)) {
      return `+593${numero.replace(/^0/, "")}`;
    }
    return numero;
  };

  const validarContrasenia = (contrasenia) => {
    if (contrasenia.length < 8) return "Debe tener al menos 8 caracteres.";
    if (!/[0-9]/.test(contrasenia)) return "Debe contener al menos un número.";
    if (!/[A-Z]/.test(contrasenia)) return "Debe contener al menos una mayúscula.";
    if (!/[a-z]/.test(contrasenia)) return "Debe contener al menos una minúscula.";
    if (!/[^A-Za-z0-9]/.test(contrasenia)) return "Debe contener al menos un carácter especial.";
    return "";
  };

  const validarCorreo = (correo) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo) ? "" : "Formato de correo inválido.";
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setFormData({ ...formData, id_rol: role.id_rol });
  };

  const handleSearchClient = async () => {
    if (!formData.cedula) {
      toast.error("Ingrese una cédula para buscar");
      return;
    }

    try {
        const clientResponse = await axios.get(`http://127.0.0.1:5001/clientes/search/cedula?cedula=${formData.cedula}`);
        const clients = clientResponse.data;
  
        if (clients.length > 0) {
          const clientData = clients[0]; // Asumiendo que se devuelve una lista de clientes
          setFormData(prevData => ({
            ...prevData,
            correo: clientData.correo,
            telefono: clientData.telefono
          }));
        } else {
          toast.error("Cliente no encontrado");
        }
      } catch (error) {
        toast.error("Error al buscar cliente");
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const contraseniaError = validarContrasenia(formData.contrasenia);
    if (contraseniaError) {
      toast.error(contraseniaError);
      return;
    }

    const correoError = validarCorreo(formData.correo);
    if (correoError) {
      toast.error(correoError);
      return;
    }

    if (!/^0\d{9}$/.test(formData.telefono)) {
      toast.error("El teléfono debe comenzar con 0 y tener 10 dígitos.");
      return;
    }

    try {
      const existingUsers = await axios.get("http://127.0.0.1:5000/api/usuarios");
      const isEmailTaken = existingUsers.data.some(user => user.correo === formData.correo);
      const isPhoneTaken = existingUsers.data.some(user => user.telefono === formData.telefono);

      if (isEmailTaken) {
        toast.error("El correo ya está registrado");
        return;
      }
      if (isPhoneTaken) {
        toast.error("El teléfono ya está registrado");
        return;
      }

      const { isConfirmed } = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Quieres registrar este usuario?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, registrar"
      });

      if (!isConfirmed) return;

      const formattedPhone = formatearNumero(formData.telefono);
      const response = await axios.post("http://127.0.0.1:5000/auth/register", { ...formData, telefono: formattedPhone });

      if (response.status === 201) {  // Suponiendo que el backend devuelve 201 al registrar correctamente
        Swal.fire("Registrado!", "El usuario ha sido registrado exitosamente.", "success");
      }

      setFormData({ cedula: "", correo: "", contrasenia: "", telefono: "", id_rol: selectedRole.id_rol });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al registrar usuario");
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex flex-column align-items-center pt-3">
      <Nav className="bg-white shadow-sm p-3 rounded-pill d-flex justify-content-center w-50 mb-4">
        {filteredRoles.map(role => (
          <Nav.Item key={role.id_rol}>
            <Nav.Link
              className={`mx-3 px-4 py-2 rounded-pill ${selectedRole?.id_rol === role.id_rol ? "fw-bold text-white bg-primary shadow-lg" : "text-dark"}`}
              onClick={() => handleRoleSelection(role)}
            >
              {role.rol.charAt(0).toUpperCase() + role.rol.slice(1)}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <Card className="w-50 shadow-lg rounded-5 border-0 bg-white p-5 text-center">
        <Card.Body>
          <h2 className="mb-4 text-primary fw-bold">Registro de {selectedRole?.rol}</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold"><FaSearch className="me-2" />Cédula</Form.Label>
              <InputGroup>
                <Form.Control type="text" name="cedula" value={formData.cedula} onChange={handleChange} required />
                <Button variant="outline-secondary" onClick={handleSearchClient}>
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold"><FaEnvelope className="me-2" />Correo</Form.Label>
              <Form.Control type="email" name="correo" value={formData.correo} onChange={handleChange} required disabled />
            </Form.Group>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold"><FaUser className="me-2" />Contraseña</Form.Label>
              <InputGroup>
                <Form.Control type={showPassword ? "text" : "password"} name="contrasenia" value={formData.contrasenia} onChange={handleChange} required />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold"><FaPhone className="me-2" />Teléfono</Form.Label>
              <Form.Control type="text" name="telefono" value={formData.telefono} onChange={handleChange} required disabled />
            </Form.Group>
            <Button type="submit" className="w-100 mt-4 btn-primary rounded-pill shadow-lg fw-bold">Registrar</Button>
          </Form>
        </Card.Body>
      </Card>
      <ToastContainer />
    </Container>
  );
};

export default RegisterUser;
