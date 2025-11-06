
// src/modules/Proveedor/Pages/ListaProveedor.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaPhone, FaMapMarkerAlt, FaEnvelope, FaTrash, FaRegEdit, FaSearch } from "react-icons/fa";
import { fetchProveedores, deleteProveedor } from "../Services/ProveedorService";

const ListaProveedor: React.FC = () => {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const resp = await fetchProveedores({ page: 1, limit: 30 });
      setProveedores(resp.data);
      setError(null);
    } catch (error: any) {
      console.error("Error al cargar proveedores:", error);
      setError(error?.message || "No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const handleEliminar = async (id: number, nombre: string) => {
    const confirmDelete = window.confirm(`¿Seguro que deseas eliminar al proveedor ${nombre}?`);
    if (!confirmDelete) return;
    try {
      await deleteProveedor(id);
      setProveedores((prev) => prev.filter((prov) => prov.Id_proveedor !== id));
      alert(`Proveedor ${nombre} eliminado correctamente.`);
    } catch (error: any) {
      console.error("Error al eliminar proveedor:", error);
      alert(error?.response?.data?.message || "Hubo un error al eliminar el proveedor.");
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado con botón a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          📦 Lista de Proveedores
        </h1>

        <Link
          to="/proveedores/nuevo"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition self-end sm:self-auto"
        >
          ➕ Nuevo Proveedor
        </Link>
      </div>

      {loading && <p className="text-gray-600">Cargando proveedores...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {/* Lista de proveedores */}
      {!loading && !error && (proveedores.length === 0 ? (
        <p className="text-gray-600 text-center mt-10">No hay proveedores registrados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proveedores.map((proveedor) => (
            <div
              key={proveedor.Id_proveedor}
              className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaBoxOpen className="text-blue-600" /> {proveedor.Nombre || "Proveedor sin nombre"}
              </h3>

              <p className="text-gray-600 flex items-center gap-2">
                <FaPhone className="text-green-600" />
                <strong>Teléfono:</strong> {proveedor.Telefono || "No disponible"}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-600" />
                <strong>Dirección:</strong> {proveedor.Direccion || "No disponible"}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaEnvelope className="text-purple-600" />
                <strong>Correo:</strong> {proveedor.Correo_electronico || "No disponible"}
              </p>

              {/* Botones de acción */}
              <div className="mt-4 flex justify-between items-center">
                <Link
                  to={`/proveedores/${proveedor.Id_proveedor}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <FaSearch /> Ver Detalle
                </Link>

                <div className="flex items-center gap-4">
                  <Link
                    to={`/proveedores/${proveedor.Id_proveedor}/editar`}
                    className="flex items-center gap-1 text-green-600 hover:underline"
                  >
                    <FaRegEdit /> Editar
                  </Link>

                  <button
                    onClick={() => handleEliminar(proveedor.Id_proveedor, proveedor.Nombre)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 transition"
                  >
                    <FaTrash /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ListaProveedor;
