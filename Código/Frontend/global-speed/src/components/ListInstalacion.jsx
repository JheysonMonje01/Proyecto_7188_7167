import { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle} from "react-icons/fa";
import { toast } from "react-toastify";

const ListaInstalaciones = () => {
  const [instalaciones, setInstalaciones] = useState([]);
  const [tecnicos, setTecnicos] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarInstalaciones();
  }, []);

  const cargarInstalaciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:5001/instalacion/listar_instalaciones");
      const instalacionesData = response.data;
      setInstalaciones(instalacionesData);

      // Obtener IDs únicos de técnicos
      const uniqueTechnicianIds = [...new Set(instalacionesData.map((inst) => inst.id_tecnico))];

      // Obtener información de cada técnico
      const tecnicosData = {};
      await Promise.all(
        uniqueTechnicianIds.map(async (id_tecnico) => {
          try {
            const tecnicoResponse = await axios.get(`http://127.0.0.1:5000/api/usuarios/rol`);
            const tecnicosFiltrados = tecnicoResponse.data.find((t) => t.id_usuario === id_tecnico);
            if (tecnicosFiltrados) {
              tecnicosData[id_tecnico] = tecnicosFiltrados.nombre || `Técnico ID: ${id_tecnico}`;
            }
          } catch (error) {
            console.error(`Error al obtener datos del técnico ${id_tecnico}:`, error);
          }
        })
      );

      setTecnicos(tecnicosData);
    } catch (error) {
      console.error("Error al cargar instalaciones:", error);
      toast.error("Error al cargar las instalaciones.");
    } finally {
      setLoading(false);
    }
  };

  const finalizarInstalacion = async (idOrden) => {
    try {
      const response = await axios.put(`http://127.0.0.1:5001/instalacion/finalizar/${idOrden}`);
      toast.success("Instalación finalizada correctamente.");
      cargarInstalaciones();
    } catch (error) {
      console.error("Error al finalizar instalación:", error);
      toast.error("No se pudo finalizar la instalación.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">🔧 Lista de Instalaciones</h2>

      {loading ? (
        <p>⏳ Cargando instalaciones...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID Instalación</th>
              <th>ID Orden</th>
              <th>ID Técnico</th>
              <th>Estado</th>
              <th>Fecha Asignación</th>
              <th>Fecha Finalizacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {instalaciones.length > 0 ? (
              instalaciones.map((inst) => (
                <tr key={inst.id_instalacion}>
                  <td>{inst.id_instalacion}</td>
                  <td>{inst.id_orden}</td>
                  <td>{tecnicos[inst.id_tecnico] || `Técnico ID: ${inst.id_tecnico}`}</td>
                  <td>
                    <span className={`badge ${inst.estado === "En Proceso" ? "bg-primary" : "bg-success"}`}>
                      {inst.estado}
                    </span>
                  </td>
                  <td>{inst.fecha_asignacion ? new Date(inst.fecha_asignacion).toLocaleDateString() : "N/A"}</td>
                  <td>{inst.fecha_asignacion ? new Date(inst.fecha_finalizacion).toLocaleDateString() : "N/A"}</td>
                  <td>
                    {inst.estado !== "Realizado" && (
                      <button className="btn btn-success btn-sm" onClick={() => finalizarInstalacion(inst.id_orden)}>
                        <FaCheckCircle /> Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No hay instalaciones registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ListaInstalaciones;
