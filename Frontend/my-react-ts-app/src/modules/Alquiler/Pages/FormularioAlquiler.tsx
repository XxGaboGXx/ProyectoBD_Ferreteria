// src/modules/Alquiler/Pages/FormularioAlquiler.tsx
import React from "react";
import { Link } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";

const FormularioAlquiler: React.FC = () => {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg mx-auto border border-gray-200">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">
        ➕ Nuevo Alquiler
      </h1>

      <form className="space-y-6">
        <div>
          <label className="text-gray-700 font-medium">Fecha de Inicio</label>
          <input
            type="datetime-local"
            className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div>
          <label className="text-gray-700 font-medium">Fecha de Fin</label>
          <input
            type="datetime-local"
            className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-gray-700 font-medium">Estado</label>
          <select className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="Pendiente">Pendiente</option>
            <option value="Activo">Activo</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>

        <div>
          <label className="text-gray-700 font-medium">Total</label>
          <input
            type="number"
            step="0.01"
            className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ej. 150.00"
          />
        </div>

        <div>
          <label className="text-gray-700 font-medium">Cliente</label>
          <select className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">Seleccionar cliente</option>
            <option value="1">Juan Pérez</option>
            <option value="2">María López</option>
          </select>
        </div>

        <div>
          <label className="text-gray-700 font-medium">Colaborador</label>
          <select className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">Seleccionar colaborador</option>
            <option value="1">Carlos López</option>
            <option value="2">Ana Martínez</option>
          </select>
        </div>

        <div className="flex justify-between mt-8">
          <Link
            to="/alquileres"
            className="flex items-center gap-2 px-5 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
          >
            <FaTimes /> Cancelar
          </Link>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <FaSave /> Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioAlquiler;
