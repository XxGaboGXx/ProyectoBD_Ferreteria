// src/modules/Venta/Pages/DetalleVenta.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const DetalleVenta: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle de la Venta</h1>
      
      <div className="border p-4 rounded shadow max-w-md mx-auto">
        <h2 className="text-xl font-bold">Venta #1</h2>
        <p><strong>Fecha:</strong> 2025-04-01</p>
        <p><strong>Total:</strong> $850.00</p>
        <p><strong>Método de Pago:</strong> Efectivo</p>
        <p><strong>Estado:</strong> Completada</p>
        <p><strong>Cliente:</strong> Juan Pérez</p>
        <p><strong>Colaborador:</strong> Carlos López</p>

        <div className="mt-4 flex space-x-3">
          <Link
            to="/ventas"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Volver
          </Link>
          <Link
            to="/ventas/1/editar"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DetalleVenta;