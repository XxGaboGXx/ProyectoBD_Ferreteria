import api from './api';

// ============================================
// 📊 INTERFACES / TYPES
// ============================================
export interface DashboardSummary {
    ventasMes: {
        total: number;
        cantidad: number;
        cambio: number;
    };
    comprasMes: {
        total: number;
        cantidad: number;
        cambio: number;
    };
    alquileresMes: {
        total: number;
        cantidad: number;
        cambio: number;
    };
    productos: {
        total: number;
        stockBajo: number;
        cambio: number;
    };
}

export interface TopProducto {
    Ranking: number;
    Id_Producto: number;
    Producto: string;
    CodigoBarra?: string;
    Categoria: string;
    CantidadVendida: number;
    MontoTotal: number;
    NumeroVentas: number;
    PrecioPromedio?: number;
    StockActual?: number;
}

export interface TopCliente {
    Ranking: number;
    Id_Cliente: number;
    Cliente: string;
    NumeroCompras: number;
    MontoTotal: number;
    PromedioCompra: number;
    UltimaCompra?: string;
    Telefono?: string;
    Correo?: string;
}

export interface Alerta {
    tipo: 'stock' | 'alquiler_vencido' | 'sin_movimiento';
    nivel: 'critico' | 'advertencia' | 'info';
    mensaje: string;
    data?: any;
}

export interface VentasPorDia {
    Fecha: string;
    NumeroVentas: number;
    TotalVentas: number;
    PromedioVenta: number;
}

export interface VentasPorCategoria {
    Categoria: string;
    NumeroVentas: number;
    UnidadesVendidas: number;
    TotalVentas: number;
}

export interface EstadisticasAlquileres {
    total: number;
    activos: number;
    vencidos: number;
    completados: number;
}

// ============================================
// 🔧 DASHBOARD SERVICE CLASS
// ============================================
class DashboardService {
    /**
     * Obtener resumen general del dashboard
     */
    async getSummary(): Promise<DashboardSummary> {
        try {
            const response = await api.get('/dashboard/summary');
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener resumen del dashboard:', error);
            throw error;
        }
    }

    /**
     * Obtener top productos más vendidos
     */
    async getTopProductos(limit: number = 10): Promise<TopProducto[]> {
        try {
            const response = await api.get('/dashboard/top-productos', {
                params: { limit }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error al obtener top productos:', error);
            throw error;
        }
    }

    /**
     * Obtener top clientes
     */
    async getTopClientes(limit: number = 10): Promise<TopCliente[]> {
        try {
            const response = await api.get('/dashboard/top-clientes', {
                params: { limit }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error al obtener top clientes:', error);
            throw error;
        }
    }

    /**
     * Obtener alertas del sistema
     */
    async getAlertas(): Promise<Alerta[]> {
        try {
            const response = await api.get('/dashboard/alertas');
            
            // El backend retorna { total, alertas, resumen }
            if (response.data.data?.alertas) {
                return response.data.data.alertas;
            }
            
            return response.data.data || [];
        } catch (error) {
            console.error('Error al obtener alertas:', error);
            throw error;
        }
    }

    /**
     * Obtener ventas por día
     */
    async getVentasPorDia(days: number = 30): Promise<VentasPorDia[]> {
        try {
            const response = await api.get('/dashboard/ventas-por-dia', {
                params: { days }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error al obtener ventas por día:', error);
            throw error;
        }
    }

    /**
     * Obtener ventas por categoría
     */
    async getVentasPorCategoria(): Promise<VentasPorCategoria[]> {
        try {
            const response = await api.get('/dashboard/ventas-por-categoria');
            return response.data.data || [];
        } catch (error) {
            console.error('Error al obtener ventas por categoría:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de alquileres
     */
    async getEstadisticasAlquileres(): Promise<EstadisticasAlquileres> {
        try {
            const response = await api.get('/dashboard/estadisticas-alquileres');
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener estadísticas de alquileres:', error);
            throw error;
        }
    }
}

// ✅ EXPORT DEFAULT - Instancia única del servicio
const dashboardService = new DashboardService();
export default dashboardService;