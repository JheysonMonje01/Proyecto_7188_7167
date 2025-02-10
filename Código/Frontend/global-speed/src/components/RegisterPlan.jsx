import { useState } from "react";
import axios from "axios";
import { Container, Card, Form, Button} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RegistrarPlan = () => {
  const [nombre, setNombre] = useState("");
  const [velocidadDown, setVelocidadDown] = useState("");
  const [velocidadUp, setVelocidadUp] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [targetIp, setTargetIp] = useState("");
  const [loading, setLoading] = useState(false);

  const validarIP = (ip) => {
    const regex = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
    return regex.test(ip);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseFloat(precio) <= 0 || parseInt(velocidadDown, 10) <= 0 || parseInt(velocidadUp, 10) <= 0) {
      toast.error("El precio y las velocidades deben ser mayores a 0");
      return;
    }
    
    if (!validarIP(targetIp)) {
      toast.error("La dirección IP no es válida");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:5001/planes", {
        nombre,
        velocidad_down: parseInt(velocidadDown, 10),
        velocidad_up: parseInt(velocidadUp, 10),
        precio: parseFloat(precio),
        descripcion,
        target_ip: targetIp,
      });
      toast.success("Plan registrado con éxito");
      setNombre("");
      setVelocidadDown("");
      setVelocidadUp("");
      setPrecio("");
      setDescripcion("");
      setTargetIp("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al registrar el plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4 d-flex justify-content-center">
      <Card style={{ width: "600px", borderRadius: "15px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", padding: "25px" }}>
        <h2 className="text-center text-primary mb-4">📡 Registrar Nuevo Plan</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>🏷️ Nombre del Plan</Form.Label>
            <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>📥 Velocidad de Bajada (kbps)</Form.Label>
            <Form.Control type="number" value={velocidadDown} onChange={(e) => setVelocidadDown(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>📤 Velocidad de Subida (kbps)</Form.Label>
            <Form.Control type="number" value={velocidadUp} onChange={(e) => setVelocidadUp(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>💰 Precio ($)</Form.Label>
            <Form.Control type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>📝 Descripción</Form.Label>
            <Form.Control as="textarea" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>🌐 IP de Destino</Form.Label>
            <Form.Control type="text" value={targetIp} onChange={(e) => setTargetIp(e.target.value)} required />
          </Form.Group>
          <Button variant="success" type="submit" disabled={loading} className="w-100 mt-3" style={{ fontSize: "1.2rem", fontWeight: "bold", background:"blue" }}>
            {loading ? "Registrando..." : "Registrar Plan"}
          </Button>
        </Form>
      </Card>
      <ToastContainer />
    </Container>
  );
};

export default RegistrarPlan;
