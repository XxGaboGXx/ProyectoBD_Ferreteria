
// src/modules/Producto/Pages/FormularioProducto.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const FormularioProducto: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">➕ Nuevo Producto</h1>
      
      <form className="max-w-md mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700">Nombre</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Ej. Laptop X1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Precio</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            placeholder="Ej. 850.00"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Stock</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            placeholder="Ej. 10"
          />
        </div>

        <div className="flex justify-between">
          <Link
            to="/productos"
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

export default FormularioProducto;