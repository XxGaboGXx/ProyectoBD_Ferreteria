
// src/modules/Proveedor/Components/TarjetaProveedor.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { deleteProveedor } from '../Services/ProveedorService'; // Asegúrate de tener esta función

interface TarjetaProveedorProps {
  proveedor: {
    Id_proveedor: number;
    Nombre: string;
    Telefono: string | null;
    Direccion: string | null;
    Correo_electronico: string | null;
  };
  onDeleted: () => void; // Callback para actualizar la lista
}

const TarjetaProveedor: React.FC<TarjetaProveedorProps> = ({ proveedor, onDeleted }) => {
  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await deleteProveedor(proveedor.Id_proveedor);
        alert('Proveedor eliminado');
        onDeleted(); // Actualiza la lista
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('No se pudo eliminar el proveedor');
      }
    }
  };

  return (
    <div className="border p-4 rounded shadow hover:shadow-lg transition">
      <h3 className="font-bold">{proveedor.Nombre}</h3>
      <p><strong>Teléfono:</strong> {proveedor.Telefono || 'Sin teléfono'}</p>
      <p><strong>Dirección:</strong> {proveedor.Direccion || 'Sin dirección'}</p>
      <p><strong>Correo:</strong> {proveedor.Correo_electronico || 'Sin correo'}</p>
      <div className="mt-2">
        <Link to={`/proveedores/${proveedor.Id_proveedor}`} className="text-blue-600 hover:underline mr-3">
          Ver Detalle
        </Link>
        <Link to={`/proveedores/${proveedor.Id_proveedor}/editar`} className="text-green-600 hover:underline mr-3">
          Editar
        </Link>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:underline"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default TarjetaProveedor;