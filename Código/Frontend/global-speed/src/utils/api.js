import axios from "axios";

const BASE_URL = "http://localhost:5000";

// Función para el registro de usuarios
export const register = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al registrar usuario");
  }

  return response.json();
};

// Función para iniciar sesión
export const login = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al iniciar sesión");
  }

  return response.json();
};

// Función para solicitar código de verificación
export const solicitarCodigo = async (data) => {
  const response = await fetch(`${BASE_URL}/recuperacion/solicitar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al solicitar código");
  }

  return response.json();
};

// Función para validar el código
export const validarCodigo = async (data) => {
  const response = await fetch(`${BASE_URL}/recuperacion/validar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al validar código");
  }

  return response.json();
};

// Función para actualizar la contraseña
export const actualizarContrasenia = async (data) => {
  const response = await fetch(`${BASE_URL}/recuperacion/actualizar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar contraseña");
  }

  return response.json();
};

export const obtenerUsuarioPorCorreo = async (correo) => {
    const response = await axios.get(`${BASE_URL}/api/usuario`, {
      params: { correo }, // Asegúrate de que el correo se envía como parámetro
    });
    return response.data;
  };
  
  export const obtenerRolPorId = async (id_rol) => {
    const response = await axios.get(`${BASE_URL}/api/rol/${id_rol}`);
    return response.data;
  };
  
  // Función para obtener la configuración de intentos de login y tiempo de bloqueo
export const getConfiguracionLogin = async () => {
  try {
    const response = await fetch(`${BASE_URL}/auth/configuracion-login`);
    if (!response.ok) {
      throw new Error("Error al obtener la configuración de login");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en getConfiguracionLogin:", error);
    throw error;
  }
};