// src/modules/Colaborador/Pages/ListaColaborador.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUserTie,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaSearch,
  FaRegEdit,
  FaTrash,
} from "react-icons/fa";

const ListaColaborador: React.FC = () => {
  const [colaboradores, setColaboradores] = useState([
    {
      id: 1,
      nombre: "Carlos López",
      telefono: "555-1234",
      direccion: "Av. Principal 123",
      correo: "carlos@ejemplo.com",
    },
    {
      id: 2,
      nombre: "Ana Martínez",
      telefono: "555-5678",
      direccion: "Calle Secundaria 456",
      correo: "ana@ejemplo.com",
    },
  ]);

  const handleEliminar = (id: number, nombre: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) {
      setColaboradores((prev) => prev.filter((col) => col.id !== id));
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado con título y botón a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          🧑‍💼 Colaboradores
        </h1>

        <Link
          to="/colaboradores/nuevo"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition self-end sm:self-auto"
        >
          ➕ Nuevo Colaborador
        </Link>
      </div>

      {/* Cards de colaboradores */}
      {colaboradores.length === 0 ? (
        <p className="text-gray-600 text-center mt-10">
          No hay colaboradores registrados.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colaboradores.map((colaborador) => (
            <div
              key={colaborador.id}
              className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaUserTie className="text-blue-600" /> {colaborador.nombre}
              </h3>

              <p className="text-gray-600 flex items-center gap-2">
                <FaPhone className="text-green-600" />
                <strong>Teléfono:</strong> {colaborador.telefono}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-600" />
                <strong>Dirección:</strong> {colaborador.direccion}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaEnvelope className="text-purple-600" />
                <strong>Correo:</strong> {colaborador.correo}
              </p>

              {/* Botones de acción */}
              <div className="mt-4 flex justify-between items-center">
                <Link
                  to={`/colaboradores/${colaborador.id}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <FaSearch /> Ver Detalle
                </Link>

                <div className="flex items-center gap-4">
                  <Link
                    to={`/colaboradores/${colaborador.id}/editar`}
                    className="flex items-center gap-1 text-green-600 hover:underline"
                  >
                    <FaRegEdit /> Editar
                  </Link>

                  <button
                    onClick={() =>
                      handleEliminar(colaborador.id, colaborador.nombre)
                    }
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 transition"
                  >
                    <FaTrash /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaColaborador;
