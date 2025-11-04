// src/modules/Alquiler/Pages/DetalleAlquiler.tsx
import React from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrashAlt } from "react-icons/fa";

const DetalleAlquiler: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          🔍 Detalle del Alquiler
        </h1>

        <div className="space-y-3 text-gray-700">
          <h2 className="text-xl font-bold text-gray-900">Alquiler #1</h2>
          <p><strong>Fecha Inicio:</strong> 2025-04-01</p>
          <p><strong>Fecha Fin:</strong> 2025-04-05</p>
          <p><strong>Estado:</strong> Activo</p>
          <p><strong>Total:</strong> $150.00</p>
          <p><strong>Cliente:</strong> Juan Pérez</p>
          <p><strong>Colaborador:</strong> Carlos López</p>
        </div>

        {/* Código de barras decorativo */}
        <div className="mt-6 flex justify-center">
          <div className="w-48 h-10 bg-[repeating-linear-gradient(90deg,#000_0_2px,transparent_2px_4px)] rounded-md"></div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex justify-between">
          <Link
            to="/alquileres"
            className="flex items-center gap-2 px-5 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
          >
            <FaArrowLeft /> Volver
          </Link>

          <div className="flex gap-3">
            <Link
              to="/alquileres/1/editar"
              className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              <FaEdit /> Editar
            </Link>

            <button
              type="button"
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              <FaTrashAlt /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleAlquiler;
