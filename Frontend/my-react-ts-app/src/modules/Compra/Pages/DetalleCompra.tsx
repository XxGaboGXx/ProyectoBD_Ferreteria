// src/modules/Compra/Pages/DetalleCompra.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaArrowLeft, FaFileInvoiceDollar, FaTruck } from 'react-icons/fa';

const DetalleCompra: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🔍 Detalle de la Compra
      </h1>

      <div className="bg-white border p-6 rounded-2xl shadow-lg max-w-lg mx-auto hover:shadow-xl transition">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Compra #1</h2>
        
        <div className="space-y-2 text-gray-700">
          <p><strong>📅 Fecha:</strong> 2025-04-01</p>
          <p><strong>💰 Total:</strong> $1,200.00</p>
          <p><strong><FaFileInvoiceDollar className="inline mr-1 text-blue-600" /> Número de Factura:</strong> F-001</p>
          <p><strong><FaTruck className="inline mr-1 text-green-600" /> Proveedor:</strong> Tech Supplies</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/compras"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaArrowLeft /> Volver
          </Link>

          <Link
            to="/compras/1/editar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FaEdit /> Editar
          </Link>

          <button
            onClick={() => alert('Compra eliminada')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FaTrashAlt /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleCompra;
