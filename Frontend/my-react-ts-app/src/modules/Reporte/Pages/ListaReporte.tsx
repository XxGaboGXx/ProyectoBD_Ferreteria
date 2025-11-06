import React, { useEffect, useState } from 'react';
import { 
  fetchReporteVentas, 
  fetchReporteCompras, 
  fetchReporteProductosMasVendidos, 
  fetchReporteInventario,
  fetchReporteAlquileres,
  ToastContainer
} from '../Services/ReporteService';
import { fetchProductosLowStock } from '../../Producto/Services/productoService';
import { useToast } from '../../../hooks/useToast';

const ReportesList: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventasResumen, setVentasResumen] = useState<any | null>(null);
  const [compras, setCompras] = useState<any[]>([]);
  const [comprasResumen, setComprasResumen] = useState<any | null>(null);
  const [alquileres, setAlquileres] = useState<any[]>([]);
  const [alquileresResumen, setAlquileresResumen] = useState<any | null>(null);
  const [stockBajo, setStockBajo] = useState<any[]>([]);
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [inventarioResumen, setInventarioResumen] = useState<any | null>(null);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ventas' | 'compras' | 'alquileres' | 'inventario'>('ventas');

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const [ventasResp, comprasResp, alquileresResp, dataStock, invResp] = await Promise.all([
        fetchReporteVentas({ fechaInicio, fechaFin }),
        fetchReporteCompras({ fechaInicio, fechaFin }),
        fetchReporteAlquileres({ fechaInicio, fechaFin }),
        fetchProductosLowStock(),
        fetchReporteInventario()
      ]);
      
      console.log('📊 Respuesta Ventas:', ventasResp);
      console.log('🛒 Respuesta Compras:', comprasResp);
      console.log('📦 Respuesta Alquileres:', alquileresResp);
      console.log('📊 Respuesta Inventario:', invResp);
      console.log('⚠️ Stock Bajo:', dataStock);
      
      setVentas(ventasResp?.ventas || []);
      setVentasResumen(ventasResp?.resumen || null);
      setCompras(comprasResp?.compras || []);
      setComprasResumen(comprasResp?.resumen || null);
      setAlquileres(alquileresResp?.alquileres || []);
      setAlquileresResumen(alquileresResp?.resumen || null);
      setStockBajo(dataStock || []);
      setInventarioResumen(invResp?.resumen || null);
      
      showToast('✅ Reportes cargados exitosamente', 'success');
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      showToast('❌ Error al cargar los reportes', 'error');
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
    if (!fechaInicio || !fechaFin) {
      showToast('⚠️ Selecciona ambas fechas', 'warning');
      return;
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      showToast('⚠️ La fecha de inicio no puede ser mayor a la fecha fin', 'warning');
      return;
    }
    cargarReportes();
  };

  const handleCargarTopProductos = async () => {
    try {
      const data = await fetchReporteProductosMasVendidos({ fechaInicio, fechaFin, limit: 10 });
      setTopProductos(Array.isArray(data) ? data : []);
      showToast('✅ Top productos cargado', 'success');
    } catch (error) {
      console.error(error);
      showToast('❌ Error al cargar productos más vendidos', 'error');
    }
  };

  const formatCurrency = (value: any) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('es-HN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Reportes Ferretería Central</h1>
        <p className="text-gray-600">Análisis completo de ventas, compras, alquileres e inventario</p>
      </div>

      {/* Filtros de Fecha */}
      <form onSubmit={handleFiltrar} className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
          >
            {loading ? '🔄 Cargando...' : '🔍 Filtrar Reportes'}
          </button>
        </div>
      </form>

      {/* Tabs de Navegación */}
      <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'ventas'
                ? 'bg-blue-600 text-white border-b-4 border-blue-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            💰 Ventas
          </button>
          <button
            onClick={() => setActiveTab('compras')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'compras'
                ? 'bg-green-600 text-white border-b-4 border-green-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🛒 Compras
          </button>
          <button
            onClick={() => setActiveTab('alquileres')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'alquileres'
                ? 'bg-purple-600 text-white border-b-4 border-purple-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📦 Alquileres
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'inventario'
                ? 'bg-orange-600 text-white border-b-4 border-orange-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Inventario
          </button>
        </div>
      </div>

      {/* Contenido según Tab Activo */}
      {activeTab === 'ventas' && (
        <div className="space-y-6">
          {/* Resumen de Ventas */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Ingresos</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(ventasResumen?.TotalIngresos)}</h3>
                </div>
                <div className="text-5xl opacity-20">💰</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Cantidad de Ventas</p>
                  <h3 className="text-3xl font-bold">{ventasResumen?.TotalVentas || 0}</h3>
                </div>
                <div className="text-5xl opacity-20">📈</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Promedio por Venta</p>
                  <h3 className="text-3xl font-bold">
                    {formatCurrency(ventasResumen?.PromedioVenta || 0)}
                  </h3>
                </div>
                <div className="text-5xl opacity-20">📊</div>
              </div>
            </div>
          </div>

          {/* Tabla de Ventas */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h2 className="text-xl font-bold text-gray-800">💰 Detalle de Ventas</h2>
              <p className="text-sm text-gray-600">Del {formatDate(fechaInicio)} al {formatDate(fechaFin)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Método Pago</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ventas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        📭 No hay ventas en este período
                      </td>
                    </tr>
                  ) : (
                    ventas.map((v: any, i: number) => (
                      <tr key={v.Id_venta || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{v.Id_venta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(v.Fecha)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {v.Cliente || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(v.TotalVenta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {v.MetodoPago || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            v.Estado === 'Completada' ? 'bg-green-100 text-green-800' :
                            v.Estado === 'Cancelada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {v.Estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compras' && (
        <div className="space-y-6">
          {/* Resumen de Compras */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Gastado</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(comprasResumen?.TotalGastado)}</h3>
                </div>
                <div className="text-5xl opacity-20">🛒</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium mb-1">Cantidad de Compras</p>
                  <h3 className="text-3xl font-bold">{comprasResumen?.TotalCompras || 0}</h3>
                </div>
                <div className="text-5xl opacity-20">📦</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium mb-1">Promedio por Compra</p>
                  <h3 className="text-3xl font-bold">
                    {formatCurrency(comprasResumen?.PromedioCompra || 0)}
                  </h3>
                </div>
                <div className="text-5xl opacity-20">💵</div>
              </div>
            </div>
          </div>

          {/* Tabla de Compras */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <h2 className="text-xl font-bold text-gray-800">🛒 Detalle de Compras</h2>
              <p className="text-sm text-gray-600">Del {formatDate(fechaInicio)} al {formatDate(fechaFin)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {compras.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        📭 No hay compras en este período
                      </td>
                    </tr>
                  ) : (
                    compras.map((c: any, i: number) => (
                      <tr key={c.Id_compra || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{c.Id_compra}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(c.Fecha)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {c.Producto || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {c.Proveedor || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                            {c.Cantidad || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(c.Total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alquileres' && (
        <div className="space-y-6">
          {/* Resumen de Alquileres */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Total Ingresos</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(alquileresResumen?.TotalIngresos)}</h3>
                </div>
                <div className="text-5xl opacity-20">📦</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium mb-1">Total Alquileres</p>
                  <h3 className="text-3xl font-bold">{alquileresResumen?.TotalAlquileres || 0}</h3>
                </div>
                <div className="text-5xl opacity-20">📊</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium mb-1">Promedio</p>
                  <h3 className="text-3xl font-bold">
                    {formatCurrency(alquileresResumen?.PromedioAlquiler || 0)}
                  </h3>
                </div>
                <div className="text-5xl opacity-20">💰</div>
              </div>
            </div>
          </div>

          {/* Tabla de Alquileres */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
              <h2 className="text-xl font-bold text-gray-800">📦 Detalle de Alquileres</h2>
              <p className="text-sm text-gray-600">Del {formatDate(fechaInicio)} al {formatDate(fechaFin)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Fin</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alquileres.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        📭 No hay alquileres en este período
                      </td>
                    </tr>
                  ) : (
                    alquileres.map((a: any, i: number) => (
                      <tr key={a.Id_alquiler || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{a.Id_alquiler}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {a.Cliente || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {a.Producto || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {formatDate(a.FechaInicio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {formatDate(a.FechaFin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(a.TotalAlquiler)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            a.EstadoActual === 'Activo' || a.Estado === 'Activo' ? 'bg-green-100 text-green-800' :
                            a.EstadoActual === 'Finalizado' || a.Estado === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                            a.EstadoActual === 'VENCIDO' ? 'bg-red-100 text-red-800' :
                            a.EstadoActual === 'Cancelado' || a.Estado === 'Cancelado' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {a.EstadoActual || a.Estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventario' && (
        <div className="space-y-6">
          {/* Resumen de Inventario */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Total Productos</p>
                  <h3 className="text-3xl font-bold">{inventarioResumen?.TotalProductos || 0}</h3>
                </div>
                <div className="text-5xl opacity-20">📊</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Stock Bajo</p>
                  <h3 className="text-3xl font-bold">{stockBajo.length}</h3>
                </div>
                <div className="text-5xl opacity-20">⚠️</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium mb-1">Valor Total</p>
                  <h3 className="text-3xl font-bold">
                    {formatCurrency(inventarioResumen?.ValorTotal || 0)}
                  </h3>
                </div>
                <div className="text-5xl opacity-20">💵</div>
              </div>
            </div>
          </div>

          {/* Productos con Stock Bajo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <h2 className="text-xl font-bold text-gray-800">⚠️ Productos con Stock Bajo</h2>
              <p className="text-sm text-gray-600">Productos que requieren reposición inmediata</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockBajo.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        ✅ Todos los productos tienen stock adecuado
                      </td>
                    </tr>
                  ) : (
                    stockBajo.map((p: any, i: number) => (
                      <tr key={p.Id_producto || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {p.Nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold">
                            {p.CantidadActual}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                            {p.CantidadMinima}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            🔴 CRÍTICO
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Productos Más Vendidos */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">🏆 Top 10 Productos Más Vendidos</h2>
                <p className="text-sm text-gray-600">Del {formatDate(fechaInicio)} al {formatDate(fechaFin)}</p>
              </div>
              <button
                onClick={handleCargarTopProductos}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
              >
                🔄 Cargar Top
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Vendida</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProductos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        🔍 Haz clic en "Cargar Top" para ver los productos más vendidos
                      </td>
                    </tr>
                  ) : (
                    topProductos.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full font-bold ${
                            i === 0 ? 'bg-yellow-400 text-yellow-900' :
                            i === 1 ? 'bg-gray-300 text-gray-900' :
                            i === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {p.NombreProducto ?? p.Nombre ?? p.Producto ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                            {p.CantidadVendida ?? p.Cantidad ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                          {formatCurrency(p.MontoTotal ?? p.Total ?? 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesList;