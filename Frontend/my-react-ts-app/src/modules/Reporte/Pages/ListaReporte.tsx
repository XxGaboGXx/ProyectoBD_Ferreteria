// src/modules/Reporte/Pages/ReportesList.tsx
import React, { useState, useEffect } from 'react';
import { fetchReporteVentas, fetchReporteCompras, fetchStockBajo } from '../Services/ReporteService';

const ReportesList: React.FC = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [stockBajo, setStockBajo] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Últimos 7 días
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const cargarReportes = async () => {
    try {
      const [dataVentas, dataCompras, dataStock] = await Promise.all([
        fetchReporteVentas(fechaInicio, fechaFin),
        fetchReporteCompras(fechaInicio, fechaFin),
        fetchStockBajo()
      ]);
      setVentas(dataVentas);
      setCompras(dataCompras);
      setStockBajo(dataStock);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      alert('No se pudieron cargar los reportes');
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarReportes();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Reportes</h1>

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
            Filtrar
          </button>
        </div>
      </form>

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
              {ventas.map((v, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{v.Fecha}</td>
                  <td className="border p-2">${v.Total.toFixed(2)}</td>
                  <td className="border p-2">{v.CantidadVentas}</td>
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
              {compras.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{c.Fecha}</td>
                  <td className="border p-2">${c.Total.toFixed(2)}</td>
                  <td className="border p-2">{c.CantidadCompras}</td>
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
              {stockBajo.map((p, i) => (
                <tr key={p.Id_Producto} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{p.Nombre}</td>
                  <td className="border p-2 text-red-600 font-bold">{p.CantidadActual}</td>
                  <td className="border p-2">{p.CantidadMinima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones de exportación (futuro) */}
      <div className="mt-6 flex gap-3">
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          📄 Exportar a PDF
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          📊 Exportar a Excel
        </button>
      </div>
    </div>
  );
};

export default ReportesList;