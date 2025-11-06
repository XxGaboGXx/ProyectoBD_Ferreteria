import React, { useEffect, useState } from 'react';
import { 
  fetchReporteVentas, 
  fetchReporteCompras, 
  fetchReporteProductosMasVendidos, 
  fetchReporteInventario 
} from '../Services/ReporteService';
import { fetchProductosLowStock } from '../../Producto/Services/productoService';

const ReportesList: React.FC = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventasResumen, setVentasResumen] = useState<any | null>(null);
  const [compras, setCompras] = useState<any[]>([]);
  const [comprasResumen, setComprasResumen] = useState<any | null>(null);
  const [stockBajo, setStockBajo] = useState<any[]>([]);
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [inventarioResumen, setInventarioResumen] = useState<any | null>(null);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ventasResp, comprasResp, dataStock, invResp] = await Promise.all([
        fetchReporteVentas({ fechaInicio, fechaFin }),
        fetchReporteCompras({ fechaInicio, fechaFin }),
        fetchProductosLowStock(),
        fetchReporteInventario()
      ]);
      setVentas(ventasResp?.ventas || []);
      setVentasResumen(ventasResp?.resumen || null);
      setCompras(comprasResp?.compras || []);
      setComprasResumen(comprasResp?.resumen || null);
      setStockBajo(dataStock || []);
      setInventarioResumen(invResp?.resumen || null);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setError('No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarReportes();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Reportes</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Filtros */}
      <form onSubmit={handleFiltrar} className="mb-6 p-4 bg-white rounded shadow flex gap-4">
        <div>
          <label className="block text-sm font-medium">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
          </button>
        </div>
      </form>

      {/* Resúmenes */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border">
          <h3 className="font-semibold mb-2">Resumen Ventas</h3>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{ventasResumen ? JSON.stringify(ventasResumen, null, 2) : '—'}</pre>
        </div>
        <div className="bg-white p-4 rounded shadow border">
          <h3 className="font-semibold mb-2">Resumen Compras</h3>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{comprasResumen ? JSON.stringify(comprasResumen, null, 2) : '—'}</pre>
        </div>
        <div className="bg-white p-4 rounded shadow border">
          <h3 className="font-semibold mb-2">Resumen Inventario</h3>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{inventarioResumen ? JSON.stringify(inventarioResumen, null, 2) : '—'}</pre>
        </div>
      </div>

      {/* Ventas */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">💰 Ventas ({fechaInicio} a {fechaFin})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Fecha</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{v.Fecha ?? v.fecha ?? '-'}</td>
                  <td className="border p-2">${Number(v.Total ?? v.total ?? 0).toFixed(2)}</td>
                  <td className="border p-2">{v.CantidadVentas ?? v.cantidad ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compras */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">🛒 Compras ({fechaInicio} a {fechaFin})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Fecha</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Compras</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{c.Fecha ?? c.fecha ?? '-'}</td>
                  <td className="border p-2">${Number(c.Total ?? c.total ?? 0).toFixed(2)}</td>
                  <td className="border p-2">{c.CantidadCompras ?? c.cantidad ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventario Bajo */}
      <div>
        <h2 className="text-xl font-bold mb-4">📦 Productos con Stock Bajo</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Producto</th>
                <th className="border p-2">Stock Actual</th>
                <th className="border p-2">Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {stockBajo.map((p: any, i: number) => (
                <tr key={p.Id_producto || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{p.Nombre}</td>
                  <td className="border p-2 text-red-600 font-bold">{p.CantidadActual}</td>
                  <td className="border p-2">{p.CantidadMinima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secciones adicionales */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">🏆 Productos más vendidos</h3>
            <button
              onClick={async () => {
                try {
                  const data = await fetchReporteProductosMasVendidos({ fechaInicio, fechaFin, limit: 10 });
                  setTopProductos(Array.isArray(data) ? data : []);
                } catch (e) {
                  console.error(e);
                  alert('No se pudo cargar el top de productos');
                }
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Cargar Top 10
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Producto</th>
                  <th className="border p-2 text-right">Cantidad</th>
                  <th className="border p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center p-4 text-gray-500">Sin datos</td>
                  </tr>
                )}
                {topProductos.map((p: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-2">{p.NombreProducto ?? p.Nombre ?? p.Producto ?? '-'}</td>
                    <td className="border p-2 text-right">{p.CantidadVendida ?? p.Cantidad ?? '-'}</td>
                    <td className="border p-2 text-right">${Number(p.MontoTotal ?? p.Total ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow border">
          <h3 className="text-lg font-semibold mb-2">📦 Resumen de Inventario</h3>
          <p className="text-sm text-gray-600 mb-2">Para detalle completo usa el módulo de Productos e Inventario.</p>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{inventarioResumen ? JSON.stringify(inventarioResumen, null, 2) : '—'}</pre>
        </div>
      </div>
    </div>
  );
};

export default ReportesList;