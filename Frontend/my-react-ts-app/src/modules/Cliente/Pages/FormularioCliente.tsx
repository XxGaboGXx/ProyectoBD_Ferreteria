// src/modules/Cliente/Pages/FormularioCliente.tsx
import React from "react";
import { Link } from "react-router-dom";
import { FaUserAlt, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUserTag } from "react-icons/fa";

const FormularioCliente: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          ➕ Nuevo Cliente
        </h1>
      </div>

      <form className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        <div className="grid grid-cols-1 gap-4">
          {/* Nombre */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaUserAlt className="text-blue-600" /> Nombre
            </label>
            <input
              type="text"
              placeholder="Ej. Juan"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Apellidos */}
          <div>
            <label className="text-gray-700 font-semibold mb-1">Apellidos</label>
            <input
              type="text"
              placeholder="Ej. Pérez"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaPhone className="text-green-600" /> Teléfono
            </label>
            <input
              type="text"
              placeholder="Ej. 555-1234"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaMapMarkerAlt className="text-red-600" /> Dirección
            </label>
            <input
              type="text"
              placeholder="Ej. Av. Principal 123"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaEnvelope className="text-purple-600" /> Correo
            </label>
            <input
              type="email"
              placeholder="Ej. cliente@ejemplo.com"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Tipo de Cliente */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaUserTag className="text-yellow-500" /> Tipo de Cliente
            </label>
            <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Contado">Contado</option>
              <option value="Crédito">Crédito</option>
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-6">
          <Link
            to="/clientes"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCliente;
