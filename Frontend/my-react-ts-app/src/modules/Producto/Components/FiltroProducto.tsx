
// src/modules/Producto/Components/FiltroProducto.tsx
import React from 'react';

interface FiltroProductoProps {
  onSearch: (term: string) => void;
  onCategoriaChange: (categoria: string) => void;
}

const FiltroProducto: React.FC<FiltroProductoProps> = ({ onSearch, onCategoriaChange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <input
        type="text"
        placeholder="Buscar producto..."
        className="flex-1 border p-2 rounded"
        onChange={(e) => onSearch(e.target.value)}
      />

      <select
        className="border p-2 rounded"
        onChange={(e) => onCategoriaChange(e.target.value)}
      >
        <option value="">Todas las categorías</option>
        <option value="Electrónica">Electrónica</option>
        <option value="Periféricos">Periféricos</option>
        <option value="Herramientas">Herramientas</option>
      </select>
    </div>
  );
};

export default FiltroProducto;