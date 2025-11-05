// src/modules/Colaborador/Pages/DetalleColaborador.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const DetalleColaborador: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle del Colaborador</h1>
      
      <div className="border p-4 rounded shadow max-w-md mx-auto">
        <h2 className="text-xl font-bold">Carlos López</h2>
        <p><strong>Teléfono:</strong> 555-1234</p>
        <p><strong>Dirección:</strong> Av. Principal 123</p>
        <p><strong>Correo:</strong> carlos@ejemplo.com</p>

        <div className="mt-4 flex space-x-3">
          <Link
            to="/colaboradores"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Volver
          </Link>
          <Link
            to="/colaboradores/1/editar"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DetalleColaborador;