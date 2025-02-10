/*import { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from 'prop-types';
import Map from './Map';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import "../styles/ClientForm.css";

const ClientForm = () => {
  const userId = localStorage.getItem("userId") || "";
  console.log("Usuario autenticado, ID:", userId);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    direccion: '',
    telefono: '',
    correo: '',
    id_usuario: userId, // Se asigna automáticamente el usuario autenticado
    id_plan_servicio: '',
  });

  const [planes, setPlanes] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({}); // Estado para manejar errores

  useEffect(() => {
    
    axios.get('http://127.0.0.1:5001/plan_servicios/planes')
      .then(response => {
        setPlanes(response.data);
      })
      .catch(error => {
        console.error('Error al cargar los planes:', error);
      });
  }, []);

  // 🔍 Función para validar Cédula Ecuatoriana
  const validarCedula = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) return "La cédula debe tener exactamente 10 dígitos numéricos.";

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return "El código de provincia es inválido.";

    const tercerDigito = parseInt(cedula[2], 10);
    if (tercerDigito > 6) return "El tercer dígito es inválido.";

    // Algoritmo de validación del dígito verificador
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i]) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
    const digitoVerificadorReal = parseInt(cedula[9], 10);

    return digitoVerificadorCalculado === digitoVerificadorReal ? "" : "La cédula o RUC ingresada no es válida.";
  };

  // 🔍 Función para validar RUC Ecuatoriano
  const validarRuc = (ruc) => {
    if (!/^\d{13}$/.test(ruc)) return "El RUC debe contener exactamente 13 dígitos numéricos.";
    if (!ruc.endsWith("001")) return "El RUC debe terminar en '001'.";
    
    // Validar que los primeros 10 dígitos sean una cédula válida
    return validarCedula(ruc.substring(0, 10));
  };

  // 🔍 Función para validar teléfono ecuatoriano
  const validarTelefono = (telefono) => {
    if (!/^\d{10}$/.test(telefono)) {
      return "El teléfono debe tener exactamente 10 dígitos numéricos.";
    }
    if (!telefono.startsWith("0")) {
      return "El teléfono debe comenzar con 0.";
    }
    return ""; // ✅ Teléfono válido
  };

  const validarCorreo = (correo) => {
    const correoRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    if (!correoRegex.test(correo)) {
      return "El correo electrónico no es válido.";
    }
    return ""; // ✅ Correo válido
  };
  

const [cobertura, setCobertura] = useState(null); // Estado para guardar si hay cobertura
const [loadingCobertura, setLoadingCobertura] = useState(false); // Estado para mostrar si está cargando

const verificarCobertura = async (direccion) => {
  if (!direccion) {
    setCobertura(null);
    return;
  }

  setLoadingCobertura(true);

  try {
    const response = await axios.post("http://127.0.0.1:5001/clientes/verificar-cobertura", { direccion });

    if (response.data.tieneCobertura) {
      setCobertura("✔️ La dirección está dentro de la cobertura.");
    } else {
      setCobertura("❌ La dirección está fuera de la cobertura.");
    }
  } catch (error) {
    console.error("Error en la verificación de cobertura:", error); // 🔍 Registra el error en la consola
    setCobertura("⚠️ No se pudo verificar la cobertura.");
  }

  setLoadingCobertura(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    if (name === "telefono") {
      if (!/^\d{0,10}$/.test(value)) return; // Solo permite números y hasta 10 dígitos

      let error = validarTelefono(value);
      if (error) {
        newErrors.telefono = error;
      } else {
        delete newErrors.telefono;
      }
    }

    if (name === "cedula") {
      if (!/^\d{0,13}$/.test(value)) return; // Permite solo números y máximo 13 dígitos

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
      console.log(`Email Validation Error: ${error}`); // Depuración
      if (error) {
        newErrors.correo = error;
      } else {
        delete newErrors.correo;
      }
    }


    setErrors(newErrors);
    setFormData({ ...formData, [name]: value });

    if (name === "direccion") {
      verificarCobertura(value); // Verificar cobertura al escribir la dirección
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
  
    if (Object.keys(errors).length > 0) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }
  
    try {
      const clienteDuplicado = await verificarClienteDuplicado();
  
      if (clienteDuplicado) {
        let mensajeError = "El cliente ya existe con la misma ";
        let camposDuplicados = [];
      
        if (clienteDuplicado.cedula === formData.cedula) camposDuplicados.push("Cédula");
        if (clienteDuplicado.correo === formData.correo) camposDuplicados.push("Correo");
        if (clienteDuplicado.telefono === formData.telefono) camposDuplicados.push("Teléfono");
      
        if (camposDuplicados.length === 3) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El cliente ya existe con los mismos datos',
          }).then(() => {
            // Limpiar los datos del formulario
            setFormData({
              nombre: '',
              apellido: '',
              cedula: '',
              direccion: '',
              telefono: '',
              correo: '',
              id_usuario: userId, // Se asigna automáticamente el usuario autenticado
              id_plan_servicio: '',
            });
            setErrors({});
            setLoadingCobertura(false);
            setCobertura(null); // Limpiar el mensaje de cobertura
          });
        } else {
          mensajeError += `${camposDuplicados.join(" y ")}.`;  // ✅ Se usa `+=` para concatenar correctamente
        }
      
        toast.error(mensajeError);
        return;
      }      
  
      console.log("Datos a enviar:", formData);
      await axios.post("http://127.0.0.1:5001/clientes/", formData);
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Cliente creado exitosamente',
      }).then(() => {
        // Limpiar los datos del formulario
        setFormData({
          nombre: '',
          apellido: '',
          cedula: '',
          direccion: '',
          telefono: '',
          correo: '',
          id_usuario: userId, // Se asigna automáticamente el usuario autenticado
          id_plan_servicio: '',
        });
        setErrors({});
        setLoadingCobertura(false);
        setCobertura(null); // Limpiar el mensaje de cobertura
      });
    } catch (error) {
      if (error.response && error.response.data) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response.data.error || "Error al procesar la solicitud.",
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: "Error al procesar la solicitud. Intente nuevamente.",
        });
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-lg p-4">
        <h1 className="text-center mb-4 title">Registrar Cliente</h1>
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-sm-12">
            <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0 rounded">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre:</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={`form-control ${errors.nombre ? 'is-invalid' : ''}`} required />
                  {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Apellido:</label>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className={`form-control ${errors.apellido ? 'is-invalid' : ''}`} required />
                  {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Cédula / RUC:</label>
                  <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} className={`form-control ${errors.cedula ? 'is-invalid' : ''}`} required maxLength="13" />
                  {errors.cedula && <div className="invalid-feedback">{errors.cedula}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono:</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className={`form-control ${errors.telefono ? 'is-invalid' : ''}`} maxLength="10" />
                  {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
                </div>
                <div className="col-md-12">
                  <label className="form-label">Dirección:</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="form-control" required />
                  {loadingCobertura && <div className="text-primary mt-1">Verificando cobertura...</div>}
                  {cobertura && (
                    <div className={`mt-1 ${cobertura.includes('✔️') ? 'text-success' : 'text-danger'}`}>
                      {cobertura}
                    </div>
                  )}
                </div>
                <div className="col-md-12">
                  <label className="form-label">Correo:</label>
                  <input type="email" name="correo" value={formData.correo} onChange={handleChange} className={`form-control ${errors.correo ? 'is-invalid' : ''}`} required />
                  {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
                </div>
                <div className="col-md-12">
                  <label className="form-label">Plan de Servicio:</label>
                  <select name="id_plan_servicio" value={formData.id_plan_servicio} onChange={handleChange} className="form-control" required>
                    <option value="">Seleccione un plan</option>
                    {planes.map((plan) => (
                      <option key={plan.id_plan_servicio} value={plan.id_plan_servicio}>{plan.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3 w-100 shadow-sm" disabled={!!errors.cedula}>
                Crear Cliente
              </button>
            </form>
            {message && <div className="alert alert-info mt-3">{message}</div>}
          </div>
          <div className="col-md-6">
            <div className="map-container">
              <Map direccion={formData.direccion} setMessage={setMessage} />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

ClientForm.propTypes = {
  userId: PropTypes.number.isRequired,
};

export default ClientForm;
*/
import { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from 'prop-types';
import Map from './Map';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { validarCedula, validarRuc, validarTelefono, validarCorreo } from "../utils/validations";
import "../styles/ClientForm.css";

const ClientForm = () => {
  const userId = localStorage.getItem("userId") || "";
  console.log("Usuario autenticado, ID:", userId);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    direccion: '',
    telefono: '',
    correo: '',
    id_usuario: userId, // Se asigna automáticamente el usuario autenticado
    id_plan_servicio: '',
  });

  const [planes, setPlanes] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({}); // Estado para manejar errores
  const [cobertura, setCobertura] = useState(null); // Estado para guardar si hay cobertura
  const [loadingCobertura, setLoadingCobertura] = useState(false); // Estado para mostrar si está cargando

  useEffect(() => {
    axios.get('http://127.0.0.1:5001/plan_servicios/planes')
      .then(response => {
        setPlanes(response.data);
      })
      .catch(error => {
        console.error('Error al cargar los planes:', error);
      });
  }, []);

  const verificarCobertura = async (direccion) => {
    if (!direccion) {
      setCobertura(null);
      return;
    }

    setLoadingCobertura(true);

    try {
      const response = await axios.post("http://127.0.0.1:5001/clientes/verificar-cobertura", { direccion });

      if (response.data.tieneCobertura) {
        setCobertura("✔️ La dirección está dentro de la cobertura.");
      } else {
        setCobertura("❌ La dirección está fuera de la cobertura.");
      }
    } catch (error) {
      console.error("Error en la verificación de cobertura:", error); // 🔍 Registra el error en la consola
      setCobertura("⚠️ No se pudo verificar la cobertura.");
    }

    setLoadingCobertura(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    if (name === "telefono") {
      if (!/^\d{0,10}$/.test(value)) return; // Solo permite números y hasta 10 dígitos

      let error = validarTelefono(value);
      if (error) {
        newErrors.telefono = error;
      } else {
        delete newErrors.telefono;
      }
    }

    if (name === "cedula") {
      if (!/^\d{0,13}$/.test(value)) return; // Permite solo números y máximo 13 dígitos

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
      console.log(`Email Validation Error: ${error}`); // Depuración
      if (error) {
        newErrors.correo = error;
      } else {
        delete newErrors.correo;
      }
    }

    setErrors(newErrors);
    setFormData({ ...formData, [name]: value });

    if (name === "direccion") {
      verificarCobertura(value); // Verificar cobertura al escribir la dirección
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (Object.keys(errors).length > 0) {
      toast.error("Corrige los errores antes de continuar.");
      return;
    }

    try {
      const clienteDuplicado = await verificarClienteDuplicado();

      if (clienteDuplicado) {
        let mensajeError = "El cliente ya existe con la misma ";
        let camposDuplicados = [];

        if (clienteDuplicado.cedula === formData.cedula) camposDuplicados.push("Cédula");
        if (clienteDuplicado.correo === formData.correo) camposDuplicados.push("Correo");
        if (clienteDuplicado.telefono === formData.telefono) camposDuplicados.push("Teléfono");

        if (camposDuplicados.length === 3) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El cliente ya existe con los mismos datos',
          }).then(() => {
            // Limpiar los datos del formulario
            setFormData({
              nombre: '',
              apellido: '',
              cedula: '',
              direccion: '',
              telefono: '',
              correo: '',
              id_usuario: userId, // Se asigna automáticamente el usuario autenticado
              id_plan_servicio: '',
            });
            setErrors({});
            setLoadingCobertura(false);
            setCobertura(null); // Limpiar el mensaje de cobertura
          });
        } else {
          mensajeError += `${camposDuplicados.join(" y ")}.`;  // ✅ Se usa `+=` para concatenar correctamente
        }

        toast.error(mensajeError);
        return;
      }

      console.log("Datos a enviar:", formData);
      await axios.post("http://127.0.0.1:5001/clientes/", formData);
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Cliente creado exitosamente',
      }).then(() => {
        // Limpiar los datos del formulario
        setFormData({
          nombre: '',
          apellido: '',
          cedula: '',
          direccion: '',
          telefono: '',
          correo: '',
          id_usuario: userId, // Se asigna automáticamente el usuario autenticado
          id_plan_servicio: '',
        });
        setErrors({});
        setLoadingCobertura(false);
        setCobertura(null); // Limpiar el mensaje de cobertura
      });
    } catch (error) {
      if (error.response && error.response.data) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response.data.error || "Error al procesar la solicitud.",
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: "Error al procesar la solicitud. Intente nuevamente.",
        });
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-lg p-4">
        <h1 className="text-center mb-4 title">Registrar Cliente</h1>
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-sm-12">
            <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0 rounded">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre:</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={`form-control ${errors.nombre ? 'is-invalid' : ''}`} required />
                  {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Apellido:</label>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className={`form-control ${errors.apellido ? 'is-invalid' : ''}`} required />
                  {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Cédula / RUC:</label>
                  <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} className={`form-control ${errors.cedula ? 'is-invalid' : ''}`} required maxLength="13" />
                  {errors.cedula && <div className="invalid-feedback">{errors.cedula}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono:</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className={`form-control ${errors.telefono ? 'is-invalid' : ''}`} maxLength="10" />
                  {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
                </div>
                <div className="col-md-12">
                  <label className="form-label">Dirección:</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="form-control" required />
                  {loadingCobertura && <div className="text-primary mt-1">Verificando cobertura...</div>}
                  {cobertura && (
                    <div className={`mt-1 ${cobertura.includes('✔️') ? 'text-success' : 'text-danger'}`}>
                      {cobertura}
                    </div>
                  )}
                </div>
                <div className="col-md-12">
                  <label className="form-label">Correo:</label>
                  <input type="email" name="correo" value={formData.correo} onChange={handleChange} className={`form-control ${errors.correo ? 'is-invalid' : ''}`} required />
                  {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
                </div>
                <div className="col-md-12">
                  <label className="form-label">Plan de Servicio:</label>
                  <select name="id_plan_servicio" value={formData.id_plan_servicio} onChange={handleChange} className="form-control" required>
                    <option value="">Seleccione un plan</option>
                    {planes.map((plan) => (
                      <option key={plan.id_plan_servicio} value={plan.id_plan_servicio}>{plan.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3 w-100 shadow-sm" disabled={!!errors.cedula}>
                Crear Cliente
              </button>
            </form>
            {message && <div className="alert alert-info mt-3">{message}</div>}
          </div>
          <div className="col-md-6">
            <div className="map-container">
              <Map direccion={formData.direccion} setMessage={setMessage} />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

ClientForm.propTypes = {
  userId: PropTypes.number.isRequired,
};

export default ClientForm;

