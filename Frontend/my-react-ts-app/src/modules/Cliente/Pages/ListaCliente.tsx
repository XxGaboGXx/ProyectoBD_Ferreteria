// src/modules/Cliente/Pages/ListaCliente.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUserAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaSearch,
  FaRegEdit,
  FaTrash,
} from "react-icons/fa";
import { fetchClientes, deleteCliente } from "../Services/clienteService";
import type { Cliente } from "../Types/Cliente";

const ListaCliente: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const resp = await fetchClientes({ page: 1, limit: 50 });
      setClientes(resp.data);
    } catch (e: any) {
      setError(e?.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleEliminar = async (c: Cliente) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a ${c.Nombre} ${c.Apellido1 ?? ''}?`)) return;
    try {
      await deleteCliente(c.Id_cliente);
      await loadClientes();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo eliminar el cliente');
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado con título y botón alineado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          👥 Lista de Clientes
        </h1>

        <Link
          to="/clientes/nuevo"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition self-end sm:self-auto"
        >
          ➕ Nuevo Cliente
        </Link>
      </div>

      {loading && <p className="text-gray-600">Cargando clientes...</p>}
      {error && <p className="text-red-600">Ocurrió un error: {error}</p>}

      {/* Cards de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && !error && clientes.map((cliente) => (
          <div
            key={cliente.Id_cliente}
            className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaUserAlt className="text-blue-600" /> {cliente.Nombre} {cliente.Apellido1} {cliente.Apellido2 ?? ''}
            </h3>

            <p className="text-gray-600 flex items-center gap-2">
              <FaPhone className="text-green-600" />
              <strong>Teléfono:</strong> {cliente.Telefono ?? '—'}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-600" />
              <strong>Dirección:</strong> {cliente.Direccion ?? '—'}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaEnvelope className="text-purple-600" />
              <strong>Correo:</strong> {cliente.Correo ?? '—'}
            </p>

            {/* Campo Tipo no existe en backend */}

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between items-center">
              <Link
                to={`/clientes/${cliente.Id_cliente}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex items-center gap-4">
                <Link
                  to={`/clientes/${cliente.Id_cliente}/editar`}
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <FaRegEdit /> Editar
                </Link>

                <button
                  onClick={() => handleEliminar(cliente)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-800 transition"
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaCliente;
