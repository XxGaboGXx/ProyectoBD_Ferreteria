// src/modules/Producto/Pages/DetalleProducto.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaBarcode,
  FaBoxOpen,
  FaDollarSign,
  FaClipboardList,
  FaCalendarAlt,
  FaArrowLeft,
  FaEdit,
  FaTrashAlt,
  FaLayerGroup,
} from "react-icons/fa";

const DetalleProducto: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaBoxOpen className="text-blue-600" /> Detalle del Producto
      </h1>

      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-lg mx-auto border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          💻 Laptop X1
        </h2>
        <p className="text-gray-600 mb-4">
          <FaClipboardList className="inline-block text-blue-500 mr-2" />
          Laptop de alta gama con procesador Intel i7, SSD y pantalla Full HD.
        </p>

        <div className="space-y-2 text-gray-700">
          <p>
            <FaDollarSign className="inline-block text-green-600 mr-2" />
            <strong>Precio Compra:</strong> $720.00
          </p>
          <p>
            <FaDollarSign className="inline-block text-green-600 mr-2" />
            <strong>Precio Venta:</strong> $850.00
          </p>
          <p>
            <FaBoxOpen className="inline-block text-yellow-500 mr-2" />
            <strong>Cantidad Actual:</strong> 2 unidades
          </p>
          <p>
            <FaBoxOpen className="inline-block text-red-500 mr-2" />
            <strong>Cantidad Mínima:</strong> 1 unidad
          </p>
          <p>
            <FaLayerGroup className="inline-block text-purple-500 mr-2" />
            <strong>Categoría:</strong> Electrónica
          </p>
          <p>
            <FaBarcode className="inline-block text-gray-600 mr-2" />
            <strong>Código de Barras:</strong> 1234567890123
          </p>
          <p>
            <FaCalendarAlt className="inline-block text-blue-500 mr-2" />
            <strong>Fecha Entrada:</strong> 2025-11-04
          </p>
          <p>
            <FaCalendarAlt className="inline-block text-gray-400 mr-2" />
            <strong>Fecha Salida:</strong> —
          </p>
        </div>

        <div className="mt-6 flex justify-between">
          <Link
            to="/productos"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaArrowLeft /> Volver
          </Link>

          <div className="flex gap-3">
            <Link
              to="/productos/1/editar"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FaEdit /> Editar
            </Link>

            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              onClick={() => alert("¿Deseas eliminar este producto?")}
            >
              <FaTrashAlt /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;
