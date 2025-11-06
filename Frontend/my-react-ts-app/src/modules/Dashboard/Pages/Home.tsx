import { useEffect, useState } from 'react';
import dashboardService from '../../../services/dashboardService';
import type { 
    DashboardSummary, 
    TopProducto, 
    TopCliente, 
    Alerta 
} from '../../../services/dashboardService';

const Home = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
    const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            const [summaryData, productosData, clientesData, alertasData] = await Promise.allSettled([
                dashboardService.getSummary(),
                dashboardService.getTopProductos(5),
                dashboardService.getTopClientes(5),
                dashboardService.getAlertas()
            ]);

            // ✅ Summary con validación
            if (summaryData.status === 'fulfilled') {
                console.log('✅ Summary recibido:', summaryData.value);
                setSummary(summaryData.value);
            } else {
                console.error('❌ Error al cargar summary:', summaryData.reason);
            }

            // ✅ Top Productos
            if (productosData.status === 'fulfilled') {
                console.log('✅ Top Productos recibidos:', productosData.value);
                setTopProductos(productosData.value || []);
            } else {
                console.error('❌ Error al cargar productos:', productosData.reason);
                setTopProductos([]);
            }

            // ✅ Top Clientes
            if (clientesData.status === 'fulfilled') {
                console.log('✅ Top Clientes recibidos:', clientesData.value);
                setTopClientes(clientesData.value || []);
            } else {
                console.error('❌ Error al cargar clientes:', clientesData.reason);
                setTopClientes([]);
            }

            // ✅ Alertas
            if (alertasData.status === 'fulfilled') {
                console.log('✅ Alertas recibidas:', alertasData.value);
                setAlertas(alertasData.value || []);
            } else {
                console.error('❌ Error al cargar alertas:', alertasData.reason);
                setAlertas([]);
            }

        } catch (error) {
            console.error('❌ Error general al cargar dashboard:', error);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Cargando dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    <button 
                        onClick={cargarDatos}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <button
                    onClick={cargarDatos}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* ✅ Tarjetas de resumen con validación segura */}
            {summary && summary.ventasMes && summary.comprasMes && summary.alquileresMes && summary.productos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Ventas del Mes */}
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Ventas del Mes</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    L {(summary.ventasMes.total || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-600">{summary.ventasMes.cantidad || 0} ventas</p>
                            </div>
                            <div className="text-4xl">💰</div>
                        </div>
                    </div>

                    {/* Compras del Mes */}
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Compras del Mes</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    L {(summary.comprasMes.total || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-600">{summary.comprasMes.cantidad || 0} compras</p>
                            </div>
                            <div className="text-4xl">🛒</div>
                        </div>
                    </div>

                    {/* Alquileres Activos */}
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Alquileres Activos</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    L {(summary.alquileresMes.total || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-600">{summary.alquileresMes.cantidad || 0} activos</p>
                            </div>
                            <div className="text-4xl">🔧</div>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Productos</p>
                                <p className="text-2xl font-bold text-gray-800">{summary.productos.total || 0}</p>
                                <p className="text-sm text-red-600 font-semibold">
                                    ⚠️ {summary.productos.stockBajo || 0} con stock bajo
                                </p>
                            </div>
                            <div className="text-4xl">📦</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p>⚠️ No se pudieron cargar las estadísticas del resumen</p>
                </div>
            )}

            {/* Top 5 - Grid de 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Clientes */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        👥 Top 5 Clientes
                    </h2>
                    {topClientes && topClientes.length > 0 ? (
                        <div className="space-y-3">
                            {topClientes.map((cliente) => (
                                <div
                                    key={cliente.Id_Cliente}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-gray-400">
                                            #{cliente.Ranking}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-800">{cliente.Cliente || 'Sin nombre'}</p>
                                            <p className="text-sm text-gray-500">
                                                {cliente.NumeroCompras || 0} compras realizadas
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-600">
                                        L {(cliente.MontoTotal || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos de clientes disponibles</p>
                    )}
                </div>

                {/* Top 5 Productos */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        📦 Top 5 Productos Más Vendidos
                    </h2>
                    {topProductos && topProductos.length > 0 ? (
                        <div className="space-y-3">
                            {topProductos.map((producto) => (
                                <div
                                    key={producto.Id_Producto}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-gray-400">
                                            #{producto.Ranking}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-800">{producto.Producto || 'Sin nombre'}</p>
                                            <p className="text-sm text-gray-500">{producto.Categoria || 'Sin categoría'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-blue-600">
                                            {producto.CantidadVendida || 0} <span className="text-sm">unidades</span>
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Ingreso: L {(producto.MontoTotal || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos de productos disponibles</p>
                    )}
                </div>
            </div>

            {/* Alertas */}
            {alertas && alertas.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">⚠️ Alertas del Sistema</h2>
                    <div className="space-y-2">
                        {alertas.slice(0, 5).map((alerta, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-lg ${
                                    alerta.nivel === 'critico'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : alerta.nivel === 'advertencia'
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                            >
                                {alerta.mensaje}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;