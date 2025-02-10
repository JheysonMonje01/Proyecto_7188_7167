import { useState, useEffect, useCallback } from "react";
import { Form, Button, Container, Row, Col} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { login, getConfiguracionLogin } from "../utils/api";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import loginImage from "../assets/images/login.jpg"; // Importa la imagen correctamente
import PropTypes from "prop-types";
import Swal from 'sweetalert2';
import "../styles/LoginForm.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { obtenerUsuarioPorCorreo, obtenerRolPorId } from "../utils/api";

const LoginForm = ({ onLogin }) => {
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoverLink, setShowRecoverLink] = useState(false);
  const [intentosMaximos, setIntentosMaximos] = useState(null);
  const [intentosRestantes, setIntentosRestantes] = useState(null);
  const [tiempoBloqueo, setTiempoBloqueo] = useState(null);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  
  const navigate = useNavigate();
  //const timerIntervalRef = useRef(null);
  

  // ✅ Mover resetearIntentos antes del useEffect
  const resetearIntentos = useCallback(() => {
    setIntentosRestantes(intentosMaximos);
    localStorage.setItem("intentosRestantes", intentosMaximos);
  }, [intentosMaximos]);

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Se ha iniciado sesión correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error,
        confirmButtonText: "Entendido",
      });
    }
  }, [error]);

  useEffect(() => {
    const fetchConfiguracion = async () => {
      try {
        const config = await getConfiguracionLogin();
        setIntentosMaximos(config.intentos_login);
        setIntentosRestantes(parseInt(localStorage.getItem("intentosRestantes")) || config.intentos_login);
        setTiempoBloqueo(config.tiempo_bloqueo_login);

        const storedBloqueo = localStorage.getItem("bloqueadoHasta");
        if (storedBloqueo) {
          const bloqueoTime = new Date(storedBloqueo);
          const ahora = new Date();
          if (bloqueoTime > ahora) {
            setBloqueadoHasta(bloqueoTime);
            setTiempoRestante(Math.ceil((bloqueoTime - ahora) / 1000));
          } else {
            localStorage.removeItem("bloqueadoHasta");
            resetearIntentos(); // 🚀 Reiniciar intentos al desbloquear
          }
        }
      } catch (err) {
        console.error("Error obteniendo configuración:", err);
      }
    };
    fetchConfiguracion();
  }, [resetearIntentos]); // ✅ Ahora resetearIntentos está disponible y no da error

  useEffect(() => {
    if (bloqueadoHasta && tiempoRestante > 0) {
      const interval = setInterval(() => {
        const ahora = new Date();
        const segundosRestantes = Math.ceil((bloqueadoHasta - ahora) / 1000);

        if (segundosRestantes <= 0) {
          clearInterval(interval);
          setBloqueadoHasta(null);
          setTiempoRestante(null);
          localStorage.removeItem("bloqueadoHasta");
          resetearIntentos(); // 🚀 Restablecer intentos cuando finaliza el bloqueo
          Swal.close();
        } else {
          setTiempoRestante(segundosRestantes);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [bloqueadoHasta, tiempoRestante, resetearIntentos]);

  const validarCorreo = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowRecoverLink(false);
    setSuccess(false);

    if (!correo || !contrasenia) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (!validarCorreo(correo)) {
      setError("El correo no tiene un formato válido.");
      return;
    }

    if (bloqueadoHasta && new Date() < bloqueadoHasta) {
      return;
    }

    try {
      const userData = await login({ correo, contrasenia }); // 🔹 Obtiene los datos del usuario autenticado
    
      if (!userData) {
        throw new Error("No se pudo obtener la información del usuario.");
      }
      const usuario = await obtenerUsuarioPorCorreo(correo);
      const rolData = await obtenerRolPorId(usuario.id_rol);

      setSuccess(true);
      setTimeout(() => {
        localStorage.setItem("correo", correo);
        localStorage.removeItem("intentosRestantes");

      // Obtener usuario y rol
        
        console.log("Usuario autenticado:", usuario);
        console.log("Rol del usuario:", rolData);

        // Guardar ID del usuario en localStorage
        localStorage.setItem("userId", usuario.id_usuario);

        // Determinar la ruta de redirección según el rol
        if (usuario.id_rol === 3) {
          navigate("/dashboard-cliente"); // Cliente
        } else if ([1, 2].includes(usuario.id_rol)) {
          navigate("/dashboard"); // Admin o usuario con acceso permitido
        } else {
          toast.error("No tienes permisos para acceder al sistema.");
          navigate("/login");
        }
        onLogin(); // Notifica al componente principal
      }, 2000);
    } catch (err) {
      setError(err.message || "Credenciales incorrectas.");
      setCorreo("");
      setContrasenia("");
      setShowRecoverLink(true);

      if (intentosRestantes !== null) {
        const nuevosIntentos = intentosRestantes - 1;
        setIntentosRestantes(nuevosIntentos);
        localStorage.setItem("intentosRestantes", nuevosIntentos);

        if (nuevosIntentos <= 0) {
          const tiempoDesbloqueo = new Date();
          tiempoDesbloqueo.setMinutes(tiempoDesbloqueo.getMinutes() + tiempoBloqueo);
          setBloqueadoHasta(tiempoDesbloqueo);
          setTiempoRestante(tiempoBloqueo * 60);
          localStorage.setItem("bloqueadoHasta", tiempoDesbloqueo);
        }
        
      }
    }
  };

  useEffect(() => {
    if (tiempoRestante !== null) {
      if (tiempoRestante === 0) {
        Swal.close();
        return;
      }

      if (!Swal.isVisible()) {
        Swal.fire({
          title: 'Bloqueado',
          html: `Inténtelo en <b>${tiempoRestante}</b> segundos.`,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
      } else {
        Swal.getHtmlContainer().innerHTML = `Inténtelo en <b>${tiempoRestante}</b> segundos.`;
      }
    }
  }, [tiempoRestante]);


  useEffect(() => {
    if (intentosRestantes !== null && intentosRestantes > 0) {
      toast.warn(`Intentos restantes: ${intentosRestantes}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: "custom-toast", // Agregar clase personalizada
        bodyClassName: "custom-toast-body", // Personalizar el cuerpo del mensaje
      });
    }
  }, [intentosRestantes]);
  return (
    <Container fluid className="login-container">
      <ToastContainer />
      <Row className="vh-100">
        <Col md={6} className="login-image-container">
          <img
            src={loginImage} // Uso correcto de la imagen importada
            alt="Login Illustration"
            className="login-image"
          />
        </Col>
        <Col md={6} className="login-form-container">
          <div className="form-wrapper">
            <h3 className="text-center mb-4">Iniciar Sesión</h3>
            

            <Form onSubmit={handleSubmit} className="login-form">
              <Form.Group className="mb-3" controlId="formCorreo">
                <Form.Label>
                  <FaEnvelope className="login-form-icon" /> Correo
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formContrasenia">
                <Form.Label>
                  <FaLock className="login-form-icon" /> Contraseña
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={contrasenia}
                    onChange={(e) => setContrasenia(e.target.value)}
                    required
                  />
                  <span
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "10px",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </Form.Group>
              <Button className="w-100 mb-3" variant="primary" type="submit" disabled={bloqueadoHasta && new Date() < bloqueadoHasta}>
                Iniciar Sesión
              </Button>
            </Form>
            {showRecoverLink && (
              <div className="text-center mt-3">
                <p className="mb-1">¿Olvidaste tu contraseña?</p>
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/recuperacion")}
                >
                  Recuperar
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

LoginForm.propTypes = {
  onLogin: PropTypes.func.isRequired, // Especifica que onLogin es una función obligatoria
};

export default LoginForm;