// src/modules/Venta/Components/FiltroVenta.tsx
import React from 'react';

interface FiltroVentaProps {
  onSearch: (term: string) => void;
  onEstadoChange: (estado: string) => void;
}

const FiltroVenta: React.FC<FiltroVentaProps> = ({ onSearch, onEstadoChange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <input
        type="text"
        placeholder="Buscar venta..."
        className="flex-1 border p-2 rounded"
        onChange={(e) => onSearch(e.target.value)}
      />

      <select
        className="border p-2 rounded"
        onChange={(e) => onEstadoChange(e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="Completada">Completada</option>
        <option value="Pendiente">Pendiente</option>
      </select>
    </div>
  );
};

export default FiltroVenta;