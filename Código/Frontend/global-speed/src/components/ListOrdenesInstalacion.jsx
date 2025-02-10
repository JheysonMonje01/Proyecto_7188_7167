import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ListaOrdenesInstalacion = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState({});
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:5001/ordenes_instalacion");
      const ordenesData = response.data;
      setOrdenes(ordenesData);

      const uniqueClientIds = [...new Set(ordenesData.map((orden) => orden.id_cliente))];
      const clientesData = {};

      await Promise.all(
        uniqueClientIds.map(async (id_cliente) => {
          try {
            const clienteResponse = await axios.get(`http://127.0.0.1:5001/clientes/${id_cliente}`);
            clientesData[id_cliente] = clienteResponse.data;
          } catch (error) {
            console.error(`Error al obtener cliente ${id_cliente}:`, error);
          }
        })
      );

      setClientes(clientesData);
    } catch (error) {
      console.error("Error al cargar órdenes de instalación:", error);
      toast.error("Error al cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  };

  const buscarOrdenes = async () => {
    try {
      if (!filtro.trim()) {
        cargarOrdenes();
        return;
      }
      setLoading(true);

      let response;
      if (!isNaN(filtro)) {
        response = await axios.get(`http://127.0.0.1:5001/ordenes_instalacion/cliente/cedula/${filtro}`);
      } else {
        response = await axios.get(`http://127.0.0.1:5001/ordenes_instalacion/cliente/nombre/${filtro}`);
      }

      const ordenEncontrada = [response.data];
      setOrdenes(ordenEncontrada);

      const clienteResponse = await axios.get(`http://127.0.0.1:5001/clientes/${ordenEncontrada[0].id_cliente}`);
      setClientes({ [ordenEncontrada[0].id_cliente]: clienteResponse.data });
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      toast.error("No se encontró ninguna orden.");
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (idOrden) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5001/ordenes_instalacion/${idOrden}/pdf`, {
        responseType: "blob",
      });

      if (!response || response.status !== 200) {
        toast.error("Error al obtener el PDF desde el servidor.");
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orden_instalacion_${idOrden}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Descarga de PDF iniciada.");
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      if (error.response) {
        toast.error(`Error del servidor: ${error.response.status} - ${error.response.data.error}`);
      } else {
        toast.error("No se pudo descargar el PDF. Verifique la conexión con el servidor.");
      }
    }
  };

  const asignarTecnico = async (idOrden) => {
    const id_tecnico = prompt("Ingrese el ID del técnico a asignar:");
    if (!id_tecnico) {
      toast.warning("Debe ingresar un ID de técnico válido.");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5001/instalacion/asignar", {
        id_orden: idOrden,
        id_tecnico: Number(id_tecnico),
      });

      toast.success(`Técnico ${id_tecnico} asignado a la orden ${idOrden}`);
      await cargarOrdenes();
    } catch (error) {
      console.error("Error al asignar técnico:", error);
      toast.error("No se pudo asignar el técnico.");
    }
  };

  const finalizarInstalacion = async (idOrden) => {
    try {
      await axios.put(`http://127.0.0.1:5001/instalacion/finalizar/${idOrden}`);
      toast.success(`Instalación finalizada para la orden ${idOrden}`);
      await cargarOrdenes();
    } catch (error) {
      console.error("Error al finalizar instalación:", error);
      toast.error("No se pudo finalizar la instalación.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">📋 Órdenes de Instalación</h2>

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre o cédula..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="btn btn-primary" onClick={buscarOrdenes}>
          <FaSearch /> Buscar
        </button>
      </div>

      {loading ? (
        <p>⏳ Cargando órdenes...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Fecha Orden Instalacion</th>
              <th>Estado</th>
              <th>Asignado (ID Técnico)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.length > 0 ? (
              ordenes.map((orden) => {
                const cliente = clientes[orden.id_cliente] || {};
                const instalacion = orden.instalacion;

                return (
                  <tr key={orden.id_orden}>
                    <td>{cliente.nombre ? `${cliente.nombre} ${cliente.apellido}` : "No disponible"}</td>
                    <td>{orden.direccion_instalacion}</td>
                    <td>{new Date(orden.fecha_creacion).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          orden.estado === "Pendiente"
                            ? "bg-warning"
                            : orden.estado === "En Proceso"
                            ? "bg-primary"
                            : "bg-success"
                        }`}
                      >
                        {orden.estado}
                      </span>
                    </td>
                    <td>{instalacion ? `Técnico ID: ${instalacion.id_tecnico}` : "Técnico no asignado"}</td>
                    <td>
                      {orden.estado === "Pendiente" ? (
                        <button className="btn btn-sm btn-warning me-2" onClick={() => asignarTecnico(orden.id_orden)}>
                          🔧 Asignar Técnico
                        </button>
                      ) : orden.estado === "En Proceso" ? (
                        <button className="btn btn-sm btn-success me-2" onClick={() => finalizarInstalacion(orden.id_orden)}>
                          ✅ Finalizar Instalación
                        </button>
                      ) : null}
                      <button className="btn btn-sm btn-secondary" onClick={() => descargarPDF(orden.id_orden)}>
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center">No hay órdenes registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <ToastContainer />
    </div>
  );
};

export default ListaOrdenesInstalacion;
