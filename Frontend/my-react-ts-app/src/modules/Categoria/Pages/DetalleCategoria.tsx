// src/modules/Categoria/Pages/DetalleCategoria.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaChartBar, FaBoxOpen } from 'react-icons/fa';
import { fetchCategoriaById, fetchEstadisticasCategoria, fetchProductosCategoria } from '../Services/categoriaService';
import type { Categoria } from '../Types/Categoria';
import type { Producto } from '../../Producto/Types/Producto';

const DetalleCategoria: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [cat, estad, prods] = await Promise.all([
          fetchCategoriaById(Number(id)),
          fetchEstadisticasCategoria(Number(id)).catch(() => null),
          fetchProductosCategoria(Number(id), { page: 1, limit: 10 }).catch(() => ({ data: [] }))
        ]);
        setCategoria(cat);
        setStats(estad);
        setProductos((prods as any)?.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Error al cargar la categoría');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!categoria) return <div className="p-6">No se encontró la categoría.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Categoría: {categoria.Nombre}</h1>
        <Link to="/categorias" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"><FaArrowLeft /> Volver</Link>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow">
        <p><strong>ID:</strong> {categoria.Id_categoria}</p>
        <p><strong>Descripción:</strong> {categoria.Descripcion || '—'}</p>
      </div>

      {stats && (
        <div className="bg-white border rounded-xl p-5 shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><FaChartBar /> Estadísticas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>Productos: <strong>{stats.TotalProductos}</strong></div>
            <div>Stock Total: <strong>{stats.StockTotal}</strong></div>
            <div>Stock Bajo: <strong>{stats.ProductosStockBajo}</strong></div>
            <div>Sin Stock: <strong>{stats.ProductosSinStock}</strong></div>
            <div>Precio min: <strong>${Number(stats.PrecioMinimo).toFixed(2)}</strong></div>
            <div>Precio max: <strong>${Number(stats.PrecioMaximo).toFixed(2)}</strong></div>
            <div>Precio prom: <strong>${Number(stats.PrecioPromedio).toFixed(2)}</strong></div>
            <div>Inventario compra: <strong>${Number(stats.ValorInventarioCompra).toFixed(2)}</strong></div>
            <div>Inventario venta: <strong>${Number(stats.ValorInventarioVenta).toFixed(2)}</strong></div>
          </div>
        </div>
      )}

      {productos && productos.length > 0 && (
        <div className="bg-white border rounded-xl p-5 shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><FaBoxOpen /> Productos (10 más recientes)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 px-3 text-left">ID</th>
                  <th className="py-2 px-3 text-left">Nombre</th>
                  <th className="py-2 px-3 text-left">Precio</th>
                  <th className="py-2 px-3 text-left">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.Id_producto} className="border-t">
                    <td className="py-2 px-3">{p.Id_producto}</td>
                    <td className="py-2 px-3">{p.Nombre}</td>
                    <td className="py-2 px-3">${Number(p.PrecioVenta ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-3">{p.CantidadActual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleCategoria;
