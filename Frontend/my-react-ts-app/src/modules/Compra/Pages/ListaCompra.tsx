// src/modules/Compra/Pages/ListaCompra.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaShoppingCart,
  FaRegCalendarAlt,
  FaFileInvoiceDollar,
  FaTruck,
  FaDollarSign,
  FaSearch,
  FaRegEdit,
  FaTrashAlt,
} from "react-icons/fa";

const ListaCompra: React.FC = () => {
  const compras = [
    {
      id: 1,
      fecha: "2025-04-01",
      total: 1200.0,
      factura: "F-001",
      proveedor: "Tech Supplies",
    },
    {
      id: 2,
      fecha: "2025-04-02",
      total: 850.0,
      factura: "F-002",
      proveedor: "Global Parts",
    },
    {
      id: 3,
      fecha: "2025-04-03",
      total: 430.5,
      factura: "F-003",
      proveedor: "Hardware Center",
    },
  ];

  return (
    <div className="p-6">
      {/* Encabezado con botón a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <FaShoppingCart className="text-blue-600" /> Lista de Compras
        </h1>

        <Link
          to="/compras/nuevo"
          className="mt-4 sm:mt-0 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Nueva Compra
        </Link>
      </div>

      {/* Cards de compras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compras.map((compra) => (
          <div
            key={compra.id}
            className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              <FaFileInvoiceDollar className="inline-block text-blue-600 mr-2" />
              Compra #{compra.id}
            </h3>

            <p className="text-gray-600 flex items-center gap-2">
              <FaRegCalendarAlt className="text-blue-500" />
              <strong>Fecha:</strong> {compra.fecha}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaDollarSign className="text-green-600" />
              <strong>Total:</strong> ${compra.total.toFixed(2)}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaFileInvoiceDollar className="text-purple-600" />
              <strong>Factura:</strong> {compra.factura}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaTruck className="text-orange-500" />
              <strong>Proveedor:</strong> {compra.proveedor}
            </p>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between">
              <Link
                to={`/compras/${compra.id}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex gap-3">
                <Link
                  to={`/compras/${compra.id}/editar`}
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <FaRegEdit /> Editar
                </Link>

                <button
                  onClick={() =>
                    alert(`¿Deseas eliminar la compra #${compra.id}?`)
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

export default ListaCompra;
