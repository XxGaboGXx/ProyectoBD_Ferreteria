import { useState, useEffect } from 'react';
import {
    RiFileTextLine,
    RiBarChartBoxLine,
    RiShoppingCartLine,
    RiToolsLine,
    RiFileDownloadLine,
    RiFilePdfLine
} from 'react-icons/ri';
import { useToast } from '../../../hooks/useToast';
import reporteService from '../Services/reporteService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    const [topClientes, setTopClientes] = useState<any[]>([]);
    const [inventario, setInventario] = useState<any[]>([]);
    const [inventarioResumen, setInventarioResumen] = useState<any | null>(null);
    
    const [fechaInicio, setFechaInicio] = useState(() => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - 30);
        return fecha;
    });
    const [fechaFin, setFechaFin] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'ventas' | 'compras' | 'alquileres' | 'inventario' | 'topProductos' | 'topClientes'>('ventas');

    const descargarPDF = async (endpoint: string, filename: string) => {
        try {
            setLoading(true);
            
            const fechaInicioParam = fechaInicio.toISOString().split('T')[0];
            const fechaFinParam = fechaFin.toISOString().split('T')[0];
            
            let url = `${API_URL}/reportes/${endpoint}/pdf`;
            
            if (!endpoint.includes('inventario') && !endpoint.includes('bajo-stock')) {
                url += `?fechaInicio=${fechaInicioParam}&fechaFin=${fechaFinParam}`;
            }
            
            console.log('📥 Descargando PDF desde:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error al descargar PDF: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            
            showToast('success', `✅ PDF "${filename}" descargado exitosamente`);
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error);
            showToast('error', '❌ Error al descargar el PDF');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [fechaInicio, fechaFin]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
            const fechaFinStr = fechaFin.toISOString().split('T')[0];

            const [
                ventasData,
                comprasData,
                alquileresData,
                inventarioData,
                topProductosData,
                topClientesData,
                stockBajoData
            ] = await Promise.all([
                reporteService.getReporteVentas(fechaInicioStr, fechaFinStr),
                reporteService.getReporteCompras(fechaInicioStr, fechaFinStr),
                reporteService.getReporteAlquileres(fechaInicioStr, fechaFinStr),
                reporteService.getReporteInventario(),
                reporteService.getTopProductos(fechaInicioStr, fechaFinStr),
                reporteService.getTopClientes(fechaInicioStr, fechaFinStr),
                reporteService.getProductosBajoStock()
            ]);

            setVentas(ventasData.ventas);
            setVentasResumen(ventasData.resumen);
            
            setCompras(comprasData.compras);
            setComprasResumen(comprasData.resumen);
            
            setAlquileres(alquileresData.alquileres);
            setAlquileresResumen(alquileresData.resumen);
            
            setInventario(inventarioData.productos);
            setInventarioResumen(inventarioData.resumen);
            
            setTopProductos(topProductosData);
            setTopClientes(topClientesData);
            setStockBajo(stockBajoData);

        } catch (error) {
            console.error('Error al cargar reportes:', error);
            showToast('error', 'Error al cargar los reportes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <RiBarChartBoxLine className="text-blue-600" />
                    Reportes y Análisis
                </h1>
                <p className="text-gray-600 mt-2">
                    Visualiza y descarga reportes detallados de tu ferretería
                </p>
            </div>

            {/* Filtros de Fecha */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={fechaInicio.toISOString().split('T')[0]}
                            onChange={(e) => setFechaInicio(new Date(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={fechaFin.toISOString().split('T')[0]}
                            onChange={(e) => setFechaFin(new Date(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={cargarDatos}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
                <div className="flex flex-wrap border-b">
                    <button
                        onClick={() => setActiveTab('ventas')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'ventas'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        💰 Ventas
                    </button>
                    <button
                        onClick={() => setActiveTab('compras')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'compras'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        🛒 Compras
                    </button>
                    <button
                        onClick={() => setActiveTab('alquileres')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'alquileres'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        🔧 Alquileres
                    </button>
                    <button
                        onClick={() => setActiveTab('inventario')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'inventario'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        📦 Inventario
                    </button>
                    <button
                        onClick={() => setActiveTab('topProductos')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'topProductos'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        📊 Top Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('topClientes')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'topClientes'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        👥 Top Clientes
                    </button>
                </div>
            </div>

            {/* VENTAS */}
            {activeTab === 'ventas' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">💰 Reporte de Ventas</h2>
                        <button
                            onClick={() => descargarPDF('ventas', `ventas-${Date.now()}.pdf`)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <RiFilePdfLine className="text-xl" />
                            Descargar PDF
                        </button>
                    </div>

                    {ventasResumen && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Ventas</p>
                                <p className="text-2xl font-bold text-blue-600">{ventasResumen.TotalVentas || 0}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Ingresos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    L {(ventasResumen.TotalIngresos || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Promedio por Venta</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    L {(ventasResumen.PromedioVenta || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Venta Máxima</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    L {(ventasResumen.VentaMaxima || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID Venta</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ventas.map((venta) => (
                                    <tr key={venta.Id_venta} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{new Date(venta.Fecha).toLocaleDateString('es-HN')}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{venta.Id_venta}</td>
                                        <td className="px-4 py-3 text-sm">{venta.NombreCliente}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            L {(venta.TotalVenta || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                venta.Estado === 'Completada' ? 'bg-green-100 text-green-800' :
                                                venta.Estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {venta.Estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* COMPRAS */}
            {activeTab === 'compras' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">🛒 Reporte de Compras</h2>
                        <button
                            onClick={() => descargarPDF('compras', `compras-${Date.now()}.pdf`)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <RiFilePdfLine className="text-xl" />
                            Descargar PDF
                        </button>
                    </div>

                    {comprasResumen && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Compras</p>
                                <p className="text-2xl font-bold text-blue-600">{comprasResumen.TotalCompras || 0}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Gastado</p>
                                <p className="text-2xl font-bold text-red-600">
                                    L {(comprasResumen.TotalGastado || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Unidades Compradas</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {(comprasResumen.UnidadesCompradas || 0).toLocaleString('es-HN')}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Promedio por Compra</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    L {(comprasResumen.PromedioCompra || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID Compra</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Proveedor</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {compras.map((compra) => (
                                    <tr key={compra.Id_compra} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{new Date(compra.Fecha).toLocaleDateString('es-HN')}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{compra.Id_compra}</td>
                                        <td className="px-4 py-3 text-sm">{compra.NombreProveedor}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                                            L {(compra.TotalCompra || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                compra.Estado === 'Completada' ? 'bg-green-100 text-green-800' :
                                                compra.Estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {compra.Estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ALQUILERES */}
            {activeTab === 'alquileres' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">🔧 Reporte de Alquileres</h2>
                        <button
                            onClick={() => descargarPDF('alquileres', `alquileres-${Date.now()}.pdf`)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <RiFilePdfLine className="text-xl" />
                            Descargar PDF
                        </button>
                    </div>

                    {alquileresResumen && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Alquileres</p>
                                <p className="text-2xl font-bold text-blue-600">{alquileresResumen.TotalAlquileres || 0}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Ingresos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    L {(alquileresResumen.TotalIngresos || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Promedio</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    L {(alquileresResumen.PromedioAlquiler || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Activos</p>
                                <p className="text-2xl font-bold text-yellow-600">{alquileresResumen.Activos || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Finalizados</p>
                                <p className="text-2xl font-bold text-gray-600">{alquileresResumen.Finalizados || 0}</p>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha Inicio</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {alquileres.map((alquiler) => (
                                    <tr key={alquiler.Id_alquiler} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium">{alquiler.Id_alquiler}</td>
                                        <td className="px-4 py-3 text-sm">{alquiler.NombreCliente}</td>
                                        <td className="px-4 py-3 text-sm">{new Date(alquiler.FechaInicio).toLocaleDateString('es-HN')}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            L {(alquiler.TotalAlquiler || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                alquiler.Estado === 'Activo' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {alquiler.Estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* INVENTARIO */}
            {activeTab === 'inventario' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">📦 Reporte de Inventario</h2>
                        <button
                            onClick={() => descargarPDF('inventario', `inventario-${Date.now()}.pdf`)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <RiFilePdfLine className="text-xl" />
                            Descargar PDF
                        </button>
                    </div>

                    {inventarioResumen && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Total Productos</p>
                                <p className="text-2xl font-bold text-blue-600">{inventarioResumen.TotalProductos || 0}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Valor Total</p>
                                <p className="text-2xl font-bold text-green-600">
                                    L {(inventarioResumen.ValorTotalInventario || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Stock Bajo</p>
                                <p className="text-2xl font-bold text-yellow-600">{inventarioResumen.ProductosStockBajo || 0}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Agotados</p>
                                <p className="text-2xl font-bold text-red-600">{inventarioResumen.ProductosAgotados || 0}</p>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Stock</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Stock Mín</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {inventario.map((producto) => (
                                    <tr key={producto.Id_Producto} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium">{producto.CodigoBarra}</td>
                                        <td className="px-4 py-3 text-sm">{producto.Producto}</td>
                                        <td className="px-4 py-3 text-sm">{producto.Categoria}</td>
                                        <td className="px-4 py-3 text-sm text-right">{producto.Stock || 0}</td>
                                        <td className="px-4 py-3 text-sm text-right">{producto.StockMinimo || 0}</td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                producto.EstadoStock === 'Sin Stock' ? 'bg-red-100 text-red-800' :
                                                producto.EstadoStock === 'Stock Bajo' ? 'bg-yellow-100 text-yellow-800' :
                                                producto.EstadoStock === 'Stock Medio' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {producto.EstadoStock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            L {(producto.ValorInventarioCosto || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TOP PRODUCTOS */}
            {activeTab === 'topProductos' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">📊 Top 10 Productos Más Vendidos</h2>
                        <button
                            onClick={() => descargarPDF('productos-mas-vendidos', `top-productos-${Date.now()}.pdf`)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <RiFilePdfLine className="text-xl" />
                            Descargar PDF
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cantidad Vendida</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {topProductos.map((producto) => (
                                    <tr key={producto.Id_Producto} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-bold text-blue-600">#{producto.Ranking}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{producto.Producto}</td>
                                        <td className="px-4 py-3 text-sm">{producto.Categoria}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold">
                                            {(producto.CantidadVendida || 0).toLocaleString('es-HN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            L {(producto.MontoTotal || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TOP CLIENTES */}
            {activeTab === 'topClientes' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">👥 Top 10 Clientes</h2>
                        <button
                            onClick={() => descargarPDF('top-clientes', `top-clientes-${Date.now()}.pdf`)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <RiFilePdfLine className="text-xl" />
                            Descargar PDF
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Compras</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monto Total</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Promedio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {topClientes.map((cliente) => (
                                    <tr key={cliente.Id_Cliente} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-bold text-blue-600">#{cliente.Ranking}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{cliente.Cliente}</td>
                                        <td className="px-4 py-3 text-sm text-center">{cliente.NumeroCompras || 0}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            L {(cliente.MontoTotal || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                                            L {(cliente.PromedioCompra || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-6 py-4 rounded-lg shadow-lg text-white animate-slideIn ${
                            toast.type === 'success' ? 'bg-green-500' :
                            toast.type === 'error' ? 'bg-red-500' :
                            toast.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <p>{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportesList;