
// src/modules/Venta/Pages/FormularioVenta.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const FormularioVenta: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">➕ Nueva Venta</h1>
      
      <form className="max-w-md mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700">Fecha</label>
          <input
            type="datetime-local"
            className="w-full border p-2 rounded"
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Total</label>
          <input
            type="number"
            step="0.01"
            className="w-full border p-2 rounded"
            placeholder="Ej. 850.00"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Método de Pago</label>
          <select className="w-full border p-2 rounded">
            <option value="">Seleccionar</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Estado</label>
          <select className="w-full border p-2 rounded">
            <option value="Completada">Completada</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Cliente</label>
          <select className="w-full border p-2 rounded">
            <option value="">Seleccionar cliente</option>
            <option value="1">Juan Pérez</option>
            <option value="2">María López</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Colaborador</label>
          <select className="w-full border p-2 rounded">
            <option value="">Seleccionar colaborador</option>
            <option value="1">Carlos López</option>
            <option value="2">Ana Martínez</option>
          </select>
        </div>

        <div className="flex justify-between">
          <Link
            to="/ventas"
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

export default FormularioVenta;