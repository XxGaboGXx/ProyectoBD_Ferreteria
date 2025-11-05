// src/modules/Alquiler/Pages/ListaAlquiler.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUser,
  FaUserTie,
  FaClipboardCheck,
  FaRegEdit,
  FaTrashAlt,
  FaSearch,
} from "react-icons/fa";

const ListaAlquiler: React.FC = () => {
  const alquileres = [
    {
      id: 1,
      inicio: "2025-04-01",
      fin: "2025-04-05",
      estado: "Activo",
      total: 150.0,
      cliente: "Juan Pérez",
      colaborador: "Carlos López",
    },
    {
      id: 2,
      inicio: "2025-04-02",
      fin: "2025-04-06",
      estado: "Pendiente",
      total: 200.0,
      cliente: "María López",
      colaborador: "Ana Martínez",
    },
  ];

  const handleEliminar = (id: number) => {
    if (window.confirm(`¿Seguro que deseas eliminar el alquiler #${id}?`)) {
      alert(`Alquiler #${id} eliminado`);
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado con botón alineado a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          📤 Lista de Alquileres
        </h1>

        <Link
          to="/alquileres/nuevo"
          className="mt-4 sm:mt-0 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Nuevo Alquiler
        </Link>
      </div>

      {/* Cards de alquileres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alquileres.map((alquiler) => (
          <div
            key={alquiler.id}
            className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              <FaClipboardCheck className="inline-block text-blue-600 mr-2" />
              Alquiler #{alquiler.id}
            </h3>

            <p className="text-gray-600 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              <strong>Inicio:</strong> {alquiler.inicio}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaCalendarAlt className="text-red-500" />
              <strong>Fin:</strong> {alquiler.fin}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaClipboardCheck
                className={`${
                  alquiler.estado === "Activo"
                    ? "text-green-600"
                    : "text-yellow-500"
                }`}
              />
              <strong>Estado:</strong> {alquiler.estado}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <span className="text-green-600">💰</span>
              <strong>Total:</strong> ${alquiler.total.toFixed(2)}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaUser className="text-gray-600" />
              <strong>Cliente:</strong> {alquiler.cliente}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaUserTie className="text-gray-600" />
              <strong>Colaborador:</strong> {alquiler.colaborador}
            </p>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between">
              <Link
                to={`/alquileres/${alquiler.id}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex gap-3">
                <Link
                  to={`/alquileres/${alquiler.id}/editar`}
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <FaRegEdit /> Editar
                </Link>

                <button
                  onClick={() => handleEliminar(alquiler.id)}
                  className="flex items-center gap-1 text-red-600 hover:underline"
                >
                  <FaTrashAlt /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaAlquiler;
