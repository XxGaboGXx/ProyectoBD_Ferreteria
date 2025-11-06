
// src/modules/Proveedor/Pages/DetalleProveedor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProveedorById, fetchEstadisticasProveedor, fetchProductosProveedor } from '../Services/ProveedorService';

const DetalleProveedor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proveedor, setProveedor] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any | null>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [prov, stats, prods] = await Promise.all([
          fetchProveedorById(Number(id)),
          fetchEstadisticasProveedor(Number(id)).catch(() => null),
          fetchProductosProveedor(Number(id), { page: 1, limit: 10 }).then(r => r.data).catch(() => []),
        ]);
        setProveedor(prov);
        setEstadisticas(stats);
        setProductos(prods);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar proveedor');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">Cargando proveedor...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!proveedor) return <div className="p-6">No se encontró el proveedor.</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle del Proveedor</h1>
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-bold">{proveedor.Nombre}</h2>
        <p><strong>Teléfono:</strong> {proveedor.Telefono || 'Sin teléfono'}</p>
        <p><strong>Dirección:</strong> {proveedor.Direccion || 'Sin dirección'}</p>
        <p><strong>Correo:</strong> {proveedor.Correo_electronico || 'Sin correo'}</p>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="mt-4 p-3 rounded bg-gray-50 text-sm">
            <p><strong>Total Compras:</strong> {estadisticas.TotalCompras}</p>
            <p><strong>Monto Total:</strong> ${Number(estadisticas.MontoTotal || 0).toFixed(2)}</p>
            <p><strong>Promedio por Compra:</strong> ${Number(estadisticas.PromedioCompra || 0).toFixed(2)}</p>
          </div>
        )}

        {/* Productos suministrados (primeros 10) */}
        {Array.isArray(productos) && productos.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Productos asociados</h3>
            <ul className="list-disc pl-5 text-sm">
              {productos.map((p: any, idx: number) => (
                <li key={idx}>{p.NombreProducto || p.Nombre || `Producto ${p.Id_producto}`}</li>
              ))}
            </ul>
          </div>
        )}

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