// validations.js

export const validarCedula = (cedula) => {
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
  
  export const validarRuc = (ruc) => {
    if (!/^\d{13}$/.test(ruc)) return "El RUC debe contener exactamente 13 dígitos numéricos.";
    if (!ruc.endsWith("001")) return "El RUC debe terminar en '001'.";
  
    // Validar que los primeros 10 dígitos sean una cédula válida
    return validarCedula(ruc.substring(0, 10));
  };
  
  export const validarTelefono = (telefono) => {
    if (!/^\d{10}$/.test(telefono)) {
      return "El teléfono debe tener exactamente 10 dígitos numéricos.";
    }
    if (!telefono.startsWith("0")) {
      return "El teléfono debe comenzar con 0.";
    }
    return ""; // ✅ Teléfono válido
  };
  
  export const validarCorreo = (correo) => {
    const correoRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    if (!correoRegex.test(correo)) {
      return "El correo electrónico no es válido.";
    }
    return ""; // ✅ Correo válido
  };
  