// src/modules/Compra/Pages/FormularioCompra.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaRegCalendarAlt,
  FaDollarSign,
  FaFileInvoice,
  FaTruck,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const FormularioCompra: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaFileInvoice className="text-blue-600" /> Nueva Compra
      </h1>

      <form className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        {/* Fecha de compra */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaRegCalendarAlt className="text-blue-500" /> Fecha de Compra
          </label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {/* Total */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaDollarSign className="text-green-600" /> Total
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. 1200.00"
          />
        </div>

        {/* Factura */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaFileInvoice className="text-purple-600" /> Número de Factura
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. F-001"
          />
        </div>

        {/* Proveedor */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaTruck className="text-orange-500" /> Proveedor
          </label>
          <select className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccionar proveedor</option>
            <option value="1">Tech Supplies</option>
            <option value="2">Global Parts</option>
            <option value="3">Hardware Center</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex justify-between mt-6">
          <Link
            to="/compras"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaTimes /> Cancelar
          </Link>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaSave /> Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCompra;
