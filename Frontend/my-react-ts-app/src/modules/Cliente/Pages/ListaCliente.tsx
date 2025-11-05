// src/modules/Cliente/Pages/ListaCliente.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaUserAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaUserTag,
  FaSearch,
  FaRegEdit,
  FaTrash,
} from "react-icons/fa";

const ListaCliente: React.FC = () => {
  const clientes = [
    {
      id: 1,
      nombre: "Juan Pérez",
      telefono: "555-1234",
      direccion: "Av. Principal 123",
      correo: "juan@ejemplo.com",
      tipo: "Contado",
    },
    {
      id: 2,
      nombre: "María López",
      telefono: "555-5678",
      direccion: "Calle Secundaria 456",
      correo: "maria@ejemplo.com",
      tipo: "Crédito",
    },
  ];

  const handleEliminar = (nombre: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) {
      alert(`Cliente "${nombre}" eliminado correctamente ✅`);
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

      {/* Cards de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente) => (
          <div
            key={cliente.id}
            className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaUserAlt className="text-blue-600" /> {cliente.nombre}
            </h3>

            <p className="text-gray-600 flex items-center gap-2">
              <FaPhone className="text-green-600" />
              <strong>Teléfono:</strong> {cliente.telefono}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-600" />
              <strong>Dirección:</strong> {cliente.direccion}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaEnvelope className="text-purple-600" />
              <strong>Correo:</strong> {cliente.correo}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaUserTag className="text-yellow-500" />
              <strong>Tipo:</strong> {cliente.tipo}
            </p>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between items-center">
              <Link
                to={`/clientes/${cliente.id}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex items-center gap-4">
                <Link
                  to={`/clientes/${cliente.id}/editar`}
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <FaRegEdit /> Editar
                </Link>

                <button
                  onClick={() => handleEliminar(cliente.nombre)}
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
