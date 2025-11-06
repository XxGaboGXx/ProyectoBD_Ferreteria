import api from './api';

// ============================================
// 📊 INTERFACES / TYPES
// ============================================

export interface TopProveedor {
    Proveedor: string;
    Telefono: string | null;
    TotalCompras: number;
    TotalUnidadesCompradas: number;
    MontoTotal: number;
    PromedioCompra: number;
    UltimaCompra: string | null;
    ProductosDiferentes: number;
}

export interface ProductoMasComprado {
    Producto: string;
    Categoria: string;
    CodigoBarra: string | null;
    TotalUnidadesCompradas: number;
    NumeroCompras: number;
    MontoTotalComprado: number;
    PrecioPromedioCompra: number;
    PrecioVentaActual: number;
    MargenPromedio: number;
    UltimaCompra: string | null;
    StockActual: number;
}

export interface AlertaInventario {
    Producto: string;
    Categoria: string;
    StockActual: number;
    StockMinimo: number;
    DeficitUnidades: number;
    NivelAlerta: string;
    PromedioCompra: number | null;
    UltimaCompra: string | null;
    DiasDesdeUltimaCompra: number | null;
    ProveedoresDisponibles: number;
}

export interface RentabilidadProducto {
    Producto: string;
    Categoria: string;
    PrecioCompraActual: number;
    PrecioVentaActual: number;
    MargenUnitario: number;
    PorcentajeMargen: number;
    CostoPromedioHistorico: number;
    MargenPromedioReal: number;
    TotalUnidadesCompradas: number;
    InversionTotal: number;
    InventarioActual: number;
    ValorInventario: number;
    ValorPotencialVenta: number;
}

export interface CompraPorMes {
    Anio: number;
    Mes: number;
    NombreMes: string;
    TotalCompras: number;
    TotalUnidades: number;
    MontoTotal: number;
    PromedioCompra: number;
    ProveedoresActivos: number;
    ProductosComprados: number;
}

export interface TendenciaTrimestral {
    Anio: number;
    Trimestre: number;
    PeriodoDesc: string;
    TotalCompras: number;
    TotalUnidades: number;
    MontoTotal: number;
    PromedioCompra: number;
    ProveedoresActivos: number;
    ProductosComprados: number;
    CategoriasActivas: number;
}

export interface AnalisisCategoria {
    Categoria: string;
    Descripcion: string;
    ProductosEnCategoria: number;
    TotalCompras: number;
    TotalUnidadesCompradas: number;
    MontoTotal: number;
    PrecioPromedioCompra: number;
    ProveedoresDiferentes: number;
}

export interface EstadisticasDataMart {
    tablas: Array<{
        Tabla: string;
        TotalRegistros: number;
        FechaMinima: string | null;
        FechaMaxima: string | null;
    }>;
    resumen: {
        TotalCompras: number;
        MontoTotal: number;
        PromedioCompra: number;
        PrimeraCompra: string | null;
        UltimaCompra: string | null;
    };
}

// ============================================
// 🔧 DATA MART SERVICE CLASS
// ============================================
class DataMartService {
    /**
     * Ejecutar ETL completo del DataMart
     */
    async ejecutarETL(fechaInicio?: string, fechaFin?: string) {
        try {
            const params: any = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;

            const response = await api.get('/datamart/etl', { params });
            return response.data;
        } catch (error) {
            console.error('Error ejecutando ETL:', error);
            throw error;
        }
    }

    /**
     * Actualizar DataMart con compras de hoy
     */
    async actualizar() {
        try {
            const response = await api.post('/datamart/actualizar');
            return response.data;
        } catch (error) {
            console.error('Error actualizando DataMart:', error);
            throw error;
        }
    }

    /**
     * Obtener Top Proveedores
     */
    async getTopProveedores(limit: number = 10): Promise<TopProveedor[]> {
        try {
            const response = await api.get('/datamart/top-proveedores', {
                params: { limit }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo top proveedores:', error);
            throw error;
        }
    }

    /**
     * Obtener Productos Más Comprados
     */
    async getProductosMasComprados(limit: number = 20): Promise<ProductoMasComprado[]> {
        try {
            const response = await api.get('/datamart/productos-mas-comprados', {
                params: { limit }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo productos más comprados:', error);
            throw error;
            }
    }

    /**
     * Obtener Alertas de Inventario
     */
    async getAlertasInventario(): Promise<AlertaInventario[]> {
        try {
            const response = await api.get('/datamart/alertas-inventario');
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo alertas de inventario:', error);
            throw error;
        }
    }

    /**
     * Obtener Análisis de Rentabilidad
     */
    async getRentabilidad(): Promise<RentabilidadProducto[]> {
        try {
            const response = await api.get('/datamart/rentabilidad');
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo rentabilidad:', error);
            throw error;
        }
    }

    /**
     * Obtener Compras por Mes
     */
    async getComprasPorMes(anio?: number): Promise<CompraPorMes[]> {
        try {
            const params: any = {};
            if (anio) params.anio = anio;

            const response = await api.get('/datamart/compras-por-mes', { params });
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo compras por mes:', error);
            throw error;
        }
    }

    /**
     * Obtener Tendencias Trimestrales
     */
    async getTendencias(): Promise<TendenciaTrimestral[]> {
        try {
            const response = await api.get('/datamart/tendencias');
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo tendencias:', error);
            throw error;
        }
    }

    /**
     * Obtener Análisis por Categoría
     */
    async getAnalisisCategoria(): Promise<AnalisisCategoria[]> {
        try {
            const response = await api.get('/datamart/analisis-categoria');
            return response.data.data || [];
        } catch (error) {
            console.error('Error obteniendo análisis por categoría:', error);
            throw error;
        }
    }

    /**
     * Obtener Estadísticas del DataMart
     */
    async getEstadisticas(): Promise<EstadisticasDataMart> {
        try {
            const response = await api.get('/datamart/estadisticas');
            return response.data.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }
}

// ✅ EXPORT DEFAULT - Instancia única del servicio
const dataMartService = new DataMartService();
export default dataMartService;

