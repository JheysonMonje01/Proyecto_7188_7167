import { useState, useEffect } from "react";
import { Button, Form, Container, Card } from "react-bootstrap";
import { FaCog } from "react-icons/fa"; // Icono de configuración
import Swal from "sweetalert2"; // Importar SweetAlert2
import axios from "axios";

const Configuracion = () => {
  const [config, setConfig] = useState({
    porcentaje_iva: 0,
    intentos_login: 1,
    tiempo_bloqueo_login: 1,
    intervalo_monitoreo: 1,
    actualizado_por: 1, // Simulación de usuario actual
  });

  const [editable, setEditable] = useState(false); // Estado del modo edición

  useEffect(() => {
    fetchConfiguracion();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/configuracion/configuracion");
      setConfig(response.data);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar la configuración",
        icon: "error",
        timer: 1000,
        showConfirmButton: false,
      });
      console.error("Error al obtener la configuración:", error);
    }
  };

  const handleInputChange = (field, value) => {
    let newValue = parseFloat(value);

    switch (field) {
      case "porcentaje_iva":
        if (newValue < 0 || newValue > 100) {
          Swal.fire("Valor no válido", "El porcentaje de IVA debe estar entre 0 y 100.", "warning");
          return;
        }
        break;
      case "intentos_login":
        if (newValue < 1 || newValue > 5) {
          Swal.fire("Valor no válido", "Los intentos de login deben estar entre 1 y 5.", "warning");
          return;
        }
        break;
      case "tiempo_bloqueo_login":
      case "intervalo_monitoreo":
        if (newValue < 1 || newValue > 60) {
          Swal.fire("Valor no válido", "El valor debe estar entre 1 y 60 minutos.", "warning");
          return;
        }
        break;
      default:
        break;
    }

    setConfig({ ...config, [field]: newValue });
  };

  const handleSave = async () => {
    try {
      await axios.put("http://127.0.0.1:5001/configuracion/configuracion", config);
      Swal.fire({
        title: "Guardado",
        text: "Configuración actualizada correctamente",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar la configuración",
        icon: "error",
        timer: 1000,
        showConfirmButton: false,
      });
      console.error("Error al actualizar la configuración:", error);
    }
  };

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card className="shadow-lg p-4 border-0" style={{ 
        maxWidth: "450px", width: "100%", 
        borderRadius: "20px", background: "#F9FAFB",
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)" 
      }}>
        <Card.Body>
          <h3 className="text-primary text-center mb-4 fw-bold d-flex align-items-center justify-content-center">
            <FaCog className="me-2" /> Configuración del Sistema
          </h3>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fw-bold fs-5 text-secondary">Modo Edición</span>
            <div className="d-flex align-items-center">
              <FaCog size={20} className={`me-2 ${editable ? "text-primary" : "text-secondary"}`} />
              <Form.Check 
                type="switch"
                id="edit-config"
                checked={editable}
                onChange={() => setEditable(!editable)}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
          </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-muted">Porcentaje de IVA (%)</Form.Label>
              <Form.Control
                type="number"
                className={`rounded-pill shadow-sm ${editable ? 'bg-white border-primary text-dark' : 'bg-light'}`}
                style={{ transition: "0.3s ease-in-out", height: "50px", fontSize: "16px" }}
                value={config.porcentaje_iva}
                disabled={!editable}
                onChange={(e) => handleInputChange("porcentaje_iva", e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-muted">Intentos de Login</Form.Label>
              <Form.Control
                type="number"
                className={`rounded-pill shadow-sm ${editable ? 'bg-white border-primary text-dark' : 'bg-light'}`}
                style={{ transition: "0.3s ease-in-out", height: "50px", fontSize: "16px" }}
                value={config.intentos_login}
                disabled={!editable}
                onChange={(e) => handleInputChange("intentos_login", e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-muted">Tiempo de Bloqueo (minutos)</Form.Label>
              <Form.Control
                type="number"
                className={`rounded-pill shadow-sm ${editable ? 'bg-white border-primary text-dark' : 'bg-light'}`}
                style={{ transition: "0.3s ease-in-out", height: "50px", fontSize: "16px" }}
                value={config.tiempo_bloqueo_login}
                disabled={!editable}
                onChange={(e) => handleInputChange("tiempo_bloqueo_login", e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Intervalo de Monitoreo (minutos)</Form.Label>
              <Form.Control
                type="number"
                className={`rounded-pill shadow-sm ${editable ? 'bg-white border-primary text-dark' : 'bg-light'}`}
                style={{ transition: "0.3s ease-in-out", height: "50px", fontSize: "16px" }}
                value={config.intervalo_monitoreo}
                disabled={!editable}
                onChange={(e) => handleInputChange("intervalo_monitoreo", e.target.value)}
              />
            </Form.Group>

            <div className="text-center">
              <Button 
                variant="primary" 
                className="rounded-pill px-4 w-100"
                style={{ 
                  transition: "0.3s ease-in-out", 
                  opacity: editable ? "1" : "0.6", 
                  fontSize: "18px", height: "50px",
                  background: editable ? "#007bff" : "#a0c4ff",
                  border: "none",
                  boxShadow: editable ? "0px 5px 15px rgba(0, 123, 255, 0.3)" : "none"
                }}
                onClick={handleSave}
                disabled={!editable}
              >
                Guardar Cambios
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Configuracion;
