
// src/modules/Proveedor/Pages/DetalleProveedor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProveedorById } from '../Services/ProveedorService';

const DetalleProveedor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proveedor, setProveedor] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProveedorById(Number(id)).then(setProveedor);
    }
  }, [id]);

  if (!proveedor) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle del Proveedor</h1>
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-bold">{proveedor.Nombre}</h2>
        <p><strong>Teléfono:</strong> {proveedor.Telefono || 'Sin teléfono'}</p>
        <p><strong>Dirección:</strong> {proveedor.Direccion || 'Sin dirección'}</p>
        <p><strong>Correo:</strong> {proveedor.Correo_electronico || 'Sin correo'}</p>

        <div className="mt-4 flex space-x-3">
          <Link to="/proveedores" className="px-4 py-2 bg-gray-500 text-white rounded">
            Volver
          </Link>
          <Link to={`/proveedores/${proveedor.Id_proveedor}/editar`} className="px-4 py-2 bg-green-600 text-white rounded">
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DetalleProveedor;