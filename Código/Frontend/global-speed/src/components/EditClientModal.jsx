
/*import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
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

    // Verificar si los campos de cédula, correo o teléfono han cambiado
    const camposCambiados = {};
    if (formData.cedula !== cliente.cedula) camposCambiados.cedula = formData.cedula;
    if (formData.correo !== cliente.correo) camposCambiados.correo = formData.correo;
    if (formData.telefono !== cliente.telefono) camposCambiados.telefono = formData.telefono;

    if (Object.keys(camposCambiados).length > 0) {
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
      <ToastContainer />
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
<ToastContainer />
import { useState } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const EditClientModal = ({ cliente, show, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(cliente);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
            <Form.Control type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Apellido</Form.Label>
            <Form.Control type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Teléfono</Form.Label>
            <Form.Control type="text" name="telefono" value={formData.telefono} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Correo</Form.Label>
            <Form.Control type="email" name="correo" value={formData.correo} onChange={handleChange} required />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-3 w-100">
            Guardar Cambios
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ✅ Agregamos la validación de PropTypes
EditClientModal.propTypes = {
  cliente: PropTypes.shape({
    id_cliente: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    apellido: PropTypes.string.isRequired,
    telefono: PropTypes.string.isRequired,
    correo: PropTypes.string.isRequired,
  }),
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};


export default EditClientModal;
*/
/*
import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
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

  const verificarClienteDuplicado = async (field, value) => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/verificar-duplicado", {
        params: {
          [field]: value
        }
      });

      return response.data; // Devuelve los datos del cliente si existe
    } catch (error) {
      console.error(`Error verificando cliente duplicado para ${field}:`, error);
      return null; // Si hay un error, asumimos que no hay duplicados
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }

    // Verificar si los campos de cédula, correo o teléfono han cambiado
    const camposCambiados = {};
    if (formData.cedula !== cliente.cedula) camposCambiados.cedula = formData.cedula;
    if (formData.correo !== cliente.correo) camposCambiados.correo = formData.correo;
    if (formData.telefono !== cliente.telefono) camposCambiados.telefono = formData.telefono;

    for (const campo in camposCambiados) {
      const clienteDuplicado = await verificarClienteDuplicado(campo, camposCambiados[campo]);

      if (clienteDuplicado && clienteDuplicado.id_cliente !== cliente.id_cliente) {
        let mensajeError = `El cliente ya existe con la misma ${campo === 'cedula' ? 'cédula' : campo === 'correo' ? 'correo' : 'teléfono'}.`;
        toast.error(mensajeError);
        return;
      }
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
      <ToastContainer />
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
*/
/*import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import PropTypes from "prop-types";
import { validarCedula, validarRuc, validarTelefono, validarCorreo } from "../utils/validations";

const EditClientModal = ({ cliente, show, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    correo: "",
    estado: false, // Nuevo campo para manejar el estado del cliente
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

  const verificarClienteDuplicado = async (field, value) => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/verificar-duplicado", {
        params: {
          [field]: value
        }
      });

      return response.data; // Devuelve los datos del cliente si existe
    } catch (error) {
      console.error(`Error verificando cliente duplicado para ${field}:`, error);
      return null; // Si hay un error, asumimos que no hay duplicados
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }

    // Verificar si los campos de cédula, correo o teléfono han cambiado
    const camposCambiados = {};
    if (formData.cedula !== cliente.cedula) camposCambiados.cedula = formData.cedula;
    if (formData.correo !== cliente.correo) camposCambiados.correo = formData.correo;
    if (formData.telefono !== cliente.telefono) camposCambiados.telefono = formData.telefono;

    for (const campo in camposCambiados) {
      const clienteDuplicado = await verificarClienteDuplicado(campo, camposCambiados[campo]);

      if (clienteDuplicado && clienteDuplicado.id_cliente !== cliente.id_cliente) {
        let mensajeError = `El cliente ya existe con la misma ${campo === 'cedula' ? 'cédula' : campo === 'correo' ? 'correo' : 'teléfono'}.`;
        toast.error(mensajeError);
        return;
      }
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
          <Form.Group>
            <Form.Label>Estado</Form.Label>
            <Form.Check type="switch" id="estado-switch" label="Activo" name="estado" checked={formData.estado} onChange={handleChange} />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-3 w-100">
            Guardar Cambios
          </Button>
        </Form>
      </Modal.Body>
      <ToastContainer />
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
    estado: PropTypes.bool.isRequired,
  }),
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditClientModal;
*/
import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { toast,ToastContainer } from "react-toastify";
import PropTypes from "prop-types";
import { validarCedula, validarRuc, validarTelefono, validarCorreo } from "../utils/validations";

const EditClientModal = ({ cliente, show, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    correo: "",
    estado: false, // Nuevo campo para manejar el estado del cliente
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

  const verificarClienteDuplicado = async (field, value) => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/clientes/verificar-duplicado", {
        params: {
          [field]: value
        }
      });

      return response.data; // Devuelve los datos del cliente si existe
    } catch (error) {
      console.error(`Error verificando cliente duplicado para ${field}:`, error);
      return null; // Si hay un error, asumimos que no hay duplicados
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }

    // Verificar si los campos de cédula, correo o teléfono han cambiado
    const camposCambiados = {};
    if (formData.cedula !== cliente.cedula) camposCambiados.cedula = formData.cedula;
    if (formData.correo !== cliente.correo) camposCambiados.correo = formData.correo;
    if (formData.telefono !== cliente.telefono) camposCambiados.telefono = formData.telefono;

    for (const campo in camposCambiados) {
      const clienteDuplicado = await verificarClienteDuplicado(campo, camposCambiados[campo]);

      if (clienteDuplicado && clienteDuplicado.id_cliente !== cliente.id_cliente) {
        let mensajeError = `El cliente ya existe con la misma ${campo === 'cedula' ? 'cédula' : campo === 'correo' ? 'correo' : 'teléfono'}.`;
        toast.error(mensajeError);
        return;
      }
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
          <Form.Group>
            <Form.Label>Estado</Form.Label>
            <Form.Check
              type="switch"
              id="estado-switch"
              label={formData.estado ? "Activo" : "Inactivo"}
              name="estado"
              checked={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-3 w-100">
            Guardar Cambios
          </Button>
        </Form>
      </Modal.Body>
      <ToastContainer />
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
    estado: PropTypes.bool.isRequired,
  }),
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditClientModal;
