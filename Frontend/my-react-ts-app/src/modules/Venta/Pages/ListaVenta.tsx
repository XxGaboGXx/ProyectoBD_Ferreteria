// src/modules/Venta/Pages/ListaVenta.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaRegCalendarAlt,
  FaRegEdit,
  FaTrashAlt,
  FaSearch,
  FaClipboardCheck,
} from "react-icons/fa";

const ListaVenta: React.FC = () => {
  const ventas = [
    {
      id: 1,
      fecha: "2025-04-01",
      total: 850.0,
      metodo: "Efectivo",
      estado: "Completada",
    },
    {
      id: 2,
      fecha: "2025-04-02",
      total: 250.0,
      metodo: "Tarjeta",
      estado: "Completada",
    },
    {
      id: 3,
      fecha: "2025-04-05",
      total: 120.5,
      metodo: "Sinpe Móvil",
      estado: "Pendiente",
    },
  ];

  return (
    <div className="p-6">
      {/* Encabezado con título y botón alineado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          💰 Lista de Ventas
        </h1>

        <Link
          to="/ventas/nuevo"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition self-end sm:self-auto"
        >
          ➕ Nueva Venta
        </Link>
      </div>

      {/* Cards de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ventas.map((venta) => (
          <div
            key={venta.id}
            className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              <FaClipboardCheck className="inline-block text-blue-600 mr-2" />
              Venta #{venta.id}
            </h3>

            <p className="text-gray-600 flex items-center gap-2">
              <FaRegCalendarAlt className="text-blue-500" />
              <strong>Fecha:</strong> {venta.fecha}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-600" />
              <strong>Total:</strong> ${venta.total.toFixed(2)}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaCreditCard className="text-purple-600" />
              <strong>Método:</strong> {venta.metodo}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaClipboardCheck
                className={`${
                  venta.estado === "Completada"
                    ? "text-green-600"
                    : "text-yellow-500"
                }`}
              />
              <strong>Estado:</strong> {venta.estado}
            </p>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between">
              <Link
                to={`/ventas/${venta.id}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex gap-3">
                <Link
                  to={`/ventas/${venta.id}/editar`}
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <FaRegEdit /> Editar
                </Link>

                <button
                  onClick={() =>
                    alert(`¿Deseas eliminar la venta #${venta.id}?`)
                  }
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

export default ListaVenta;
