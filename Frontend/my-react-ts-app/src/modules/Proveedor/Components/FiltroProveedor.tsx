// src/modules/Proveedor/Components/FiltroProveedor.tsx
import React from 'react';

interface FiltroProveedorProps {
  onSearch: (term: string) => void;
}

const FiltroProveedor: React.FC<FiltroProveedorProps> = ({ onSearch }) => {
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Buscar proveedor..."
        className="w-full border p-2 rounded"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default FiltroProveedor;