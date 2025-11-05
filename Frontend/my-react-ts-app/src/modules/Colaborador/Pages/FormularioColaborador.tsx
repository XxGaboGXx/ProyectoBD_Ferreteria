// src/modules/Colaborador/Pages/FormularioColaborador.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const FormularioColaborador: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">➕ Nuevo Colaborador</h1>
      
      <form className="max-w-md mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700">Nombre</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Ej. Carlos"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Apellido Paterno</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Ej. López"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Apellido Materno</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Ej. Martínez"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Teléfono</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Ej. 555-1234"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Dirección</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Ej. Av. Principal 123"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Correo Electrónico</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="Ej. colaborador@ejemplo.com"
          />
        </div>

        <div className="flex justify-between">
          <Link
            to="/colaboradores"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioColaborador;