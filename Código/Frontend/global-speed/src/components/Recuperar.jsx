import { useState } from "react";
import { Form, Button, Alert, Card, Container, Row, Col } from "react-bootstrap";
import { solicitarCodigo, validarCodigo, actualizarContrasenia } from "../utils/api";
import { FaEnvelope, FaKey, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import "../styles/RecuperacionForm.css";
import { useNavigate } from "react-router-dom";

const RecuperacionForm = () => {
  const [contacto, setContacto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasenia, setNuevaContrasenia] = useState("");
  const [confirmarContrasenia, setConfirmarContrasenia] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const validarContrasenia = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]{8,}$/;
    return regex.test(password);
  };

  const formatearNumero = (numero) => {
    if (/^\d{9,10}$/.test(numero)) {
      // Verificar si es un número válido de Ecuador
      return `+593${numero.replace(/^0/, "")}`;
    }
    return numero; // Si no cumple el formato, devolver como está
  };

  const handleSolicitarCodigo = async () => {
    setError("");
    setSuccess("");
    try {
      const contactoFormateado = formatearNumero(contacto);
      await solicitarCodigo({ contacto: contactoFormateado });
      setSuccess("Código enviado. Revisa tu correo o WhatsApp.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Error al solicitar el código.");
    }
  };

  const handleValidarCodigo = async () => {
    setError("");
    setSuccess("");
    try {
      const contactoFormateado = formatearNumero(contacto);
      await validarCodigo({ contacto: contactoFormateado, codigo });
      setSuccess("Código válido. Ahora puedes actualizar tu contraseña.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Error al validar el código.");
    }
  };

  const handleActualizarContrasenia = async () => {
    setError("");
    setSuccess("");

    if (!contacto || !codigo) {
      setError("Debe proporcionar el contacto y el código.");
      return;
    }

    if (!nuevaContrasenia || !confirmarContrasenia) {
      setError("Ambos campos de contraseña son obligatorios.");
      return;
    }

    if (nuevaContrasenia !== confirmarContrasenia) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!validarContrasenia(nuevaContrasenia)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales."
      );
      return;
    }

    try {
      const contactoFormateado = formatearNumero(contacto);
      await actualizarContrasenia({
        contacto: contactoFormateado,
        codigo,
        nueva_contrasenia: nuevaContrasenia,
        confirmacion_contrasenia: confirmarContrasenia,
      });
      setSuccess("Contraseña actualizada correctamente.");

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Error al actualizar la contraseña.");
    }
  };

  return (
    <Container className="recuperacion-form-container">
      <Row className="justify-content-center">
        <Col md={4}>
          <Card className="recuperacion-form-card">
            <Card.Body>
                {/* Flecha de retroceso */}
              <div className="back-arrow" onClick={() => navigate(-1)}>
                <FaArrowLeft />
              </div>
              <h3 className="recuperacion-form-title">Recuperación de Contraseña</h3>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              {step === 1 && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaEnvelope className="recuperacion-form-icon" /> Correo o WhatsApp
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu correo o número"
                      value={contacto}
                      onChange={(e) => setContacto(e.target.value)}
                    />
                  </Form.Group>
                  <div className="recuperacion-form-button-container">
                    <Button
                      className="recuperacion-form-button"
                      onClick={handleSolicitarCodigo}
                    >
                      Solicitar Código
                    </Button>
                  </div>
                </Form>
              )}
              {step === 2 && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaKey className="recuperacion-form-icon" /> Código de Verificación
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa el código"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                    />
                  </Form.Group>
                  <div className="recuperacion-form-button-container">
                    <Button
                      className="recuperacion-form-button"
                      onClick={handleValidarCodigo}
                    >
                      Validar Código
                    </Button>
                  </div>
                </Form>
              )}
              {step === 3 && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaLock className="recuperacion-form-icon" /> Nueva Contraseña
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa tu nueva contraseña"
                        value={nuevaContrasenia}
                        onChange={(e) => setNuevaContrasenia(e.target.value)}
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
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaLock className="recuperacion-form-icon" /> Confirmar Contraseña
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirma tu nueva contraseña"
                        value={confirmarContrasenia}
                        onChange={(e) => setConfirmarContrasenia(e.target.value)}
                      />
                      <span
                        className="password-toggle-icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: "10px",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                        }}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                  </Form.Group>
                  <div className="recuperacion-form-button-container">
                    <Button
                      className="recuperacion-form-button"
                      onClick={handleActualizarContrasenia}
                    >
                      Actualizar Contraseña
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RecuperacionForm;
