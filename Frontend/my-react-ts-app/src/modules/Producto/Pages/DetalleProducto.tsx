
// src/modules/Producto/Pages/DetalleProducto.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const DetalleProducto: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle del Producto</h1>
      
      <div className="border p-4 rounded shadow max-w-md mx-auto">
        <h2 className="text-xl font-bold">Laptop X1</h2>
        <p><strong>Precio:</strong> $850.00</p>
        <p><strong>Stock:</strong> 2 unidades</p>
        <p><strong>Categoría:</strong> Electrónica</p>
        <p><strong>Descripción:</strong> Laptop de alta gama con procesador i7.</p>

        <div className="mt-4 flex space-x-3">
          <Link
            to="/productos"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Volver
          </Link>
          <Link
            to="/productos/1/editar"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;