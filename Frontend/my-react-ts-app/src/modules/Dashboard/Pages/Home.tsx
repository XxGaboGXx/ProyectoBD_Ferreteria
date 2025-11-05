import React, { useEffect, useState } from 'react';
import {
  fetchDashboardSummary,
  fetchAlertas,
  fetchTopClientes,
  fetchTopProductos,
} from '../../../services/dashboardService';

interface DashboardSummary {
  ventasHoy: number;
  ventasDelMes: number;
  totalProductos: number;
  productosStockBajo: number;
  totalClientes: number;
  clientesActivos: number;
  alquileresActivos: number;
  alquileresVencidos: number;
}

interface Alerta {
  TipoAlerta: string;
  Id_Producto?: number;
  Nombre?: string;
  CantidadActual?: number;
  CantidadMinima?: number;
  Faltante?: number;
  Categoria?: string;
  Id_alquiler?: number;
  FechaFin?: string;
  DiasVencidos?: number;
  ClienteNombre?: string;
  ClienteTelefono?: string;
  TotalAlquiler?: number;
}

interface TopCliente {
  Id_cliente: number;
  Nombre: string;
  Apellido1: string;
  Apellido2?: string;
  TotalComprado: number;
  TotalCompras: number;
}

interface TopProducto {
  Id_Producto: number;
  Nombre: string;
  CantidadVendida: number;
  IngresoTotal: number;
  Categoria?: string;
}

const Home: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []); // Se ejecuta solo una vez al montar el componente

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo para mejor rendimiento
      const [summaryData, alertasData, clientesData, productosData] = await Promise.all([
        fetchDashboardSummary(),
        fetchAlertas(),
        fetchTopClientes(5),
        fetchTopProductos(5),
      ]);

      setSummary(summaryData);
      setAlertas(alertasData || []);
      setTopClientes(clientesData || []);
      setTopProductos(productosData || []);
    } catch (error: any) {
      console.error('Error al cargar dashboard:', error);
      setError(error.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl font-semibold text-gray-700">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          ⏳ Cargando dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <p className="font-bold">Error al cargar el dashboard</p>
            </div>
            <button 
              onClick={loadDashboardData} 
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🔄 Reintentar
            </button>
          </div>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">📊 Dashboard - Ferretería Central</h1>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Primera fila de estadísticas - Ventas y Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">💰 Ventas Hoy</h3>
          <p className="text-4xl font-bold mt-2">₡{summary?.ventasHoy?.toLocaleString('es-CR', { minimumFractionDigits: 2 }) || '0.00'}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">📈 Ventas del Mes</h3>
          <p className="text-4xl font-bold mt-2">₡{summary?.ventasDelMes?.toLocaleString('es-CR', { minimumFractionDigits: 2 }) || '0.00'}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">⚠️ Stock Bajo</h3>
          <p className="text-4xl font-bold mt-2">{summary?.productosStockBajo || 0}</p>
          <p className="text-sm opacity-90 mt-1">productos</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">📦 Total Productos</h3>
          <p className="text-4xl font-bold mt-2">{summary?.totalProductos || 0}</p>
          <p className="text-sm opacity-90 mt-1">en inventario</p>
        </div>
      </div>

      {/* Segunda fila de estadísticas - Clientes y Alquileres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">👥 Total Clientes</h3>
          <p className="text-4xl font-bold mt-2">{summary?.totalClientes || 0}</p>
          <p className="text-sm opacity-90 mt-1">registrados</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">✅ Clientes Activos</h3>
          <p className="text-4xl font-bold mt-2">{summary?.clientesActivos || 0}</p>
          <p className="text-sm opacity-90 mt-1">activos</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">🏠 Alquileres Activos</h3>
          <p className="text-4xl font-bold mt-2">{summary?.alquileresActivos || 0}</p>
          <p className="text-sm opacity-90 mt-1">en curso</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-lg font-semibold opacity-90">⏰ Alquileres Vencidos</h3>
          <p className="text-4xl font-bold mt-2">{summary?.alquileresVencidos || 0}</p>
          <p className="text-sm opacity-90 mt-1">requieren atención</p>
        </div>
      </div>

      {/* Alertas del sistema */}
      {alertas && alertas.length > 0 && (
        <div className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
            <span>⚠️</span> Alertas del Sistema
          </h2>
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                {alerta.TipoAlerta === 'StockBajo' && (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-red-800">
                        📦 {alerta.Nombre}
                      </p>
                      <p className="text-sm text-red-600">
                        Stock actual: {alerta.CantidadActual} | Mínimo: {alerta.CantidadMinima} | 
                        Faltante: {alerta.Faltante}
                      </p>
                      {alerta.Categoria && (
                        <p className="text-xs text-gray-600">Categoría: {alerta.Categoria}</p>
                      )}
                    </div>
                  </div>
                )}
                {alerta.TipoAlerta === 'AlquileresVencidos' && (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-red-800">
                        🏠 Alquiler #{alerta.Id_alquiler} - {alerta.ClienteNombre}
                      </p>
                      <p className="text-sm text-red-600">
                        Vencido hace {alerta.DiasVencidos} días | 
                        Total: ₡{alerta.TotalAlquiler?.toFixed(2)}
                      </p>
                      {alerta.ClienteTelefono && (
                        <p className="text-xs text-gray-600">Tel: {alerta.ClienteTelefono}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Clientes y Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clientes */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>👥</span> Top 5 Clientes
          </h2>
          {topClientes && topClientes.length > 0 ? (
            <div className="space-y-3">
              {topClientes.map((cliente, index) => (
                <div 
                  key={cliente.Id_cliente} 
                  className="flex justify-between items-center border-b pb-3 hover:bg-gray-50 transition-colors rounded-lg p-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {cliente.Nombre} {cliente.Apellido1} {cliente.Apellido2 || ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {cliente.TotalCompras} compras realizadas
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 text-lg">
                    ₡{cliente.TotalComprado?.toLocaleString('es-CR', { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de clientes disponibles</p>
          )}
        </div>

        {/* Top Productos */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📦</span> Top 5 Productos Más Vendidos
          </h2>
          {topProductos && topProductos.length > 0 ? (
            <div className="space-y-3">
              {topProductos.map((producto, index) => (
                <div 
                  key={producto.Id_Producto} 
                  className="flex justify-between items-center border-b pb-3 hover:bg-gray-50 transition-colors rounded-lg p-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{producto.Nombre}</p>
                      <p className="text-sm text-gray-500">
                        Ingreso: ₡{producto.IngresoTotal?.toLocaleString('es-CR', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                      {producto.Categoria && (
                        <p className="text-xs text-gray-400">{producto.Categoria}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-blue-600 text-lg">
                    {producto.CantidadVendida || 0} <span className="text-sm">unidades</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de productos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;