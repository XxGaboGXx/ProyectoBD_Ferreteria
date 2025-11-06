import api from '../../../services/api';

interface ReporteVentasResponse {
    ventas: any[];
    resumen: any;
}

interface ReporteComprasResponse {
    compras: any[];
    resumen: any;
}

interface ReporteAlquileresResponse {
    alquileres: any[];
    resumen: any;
}

interface ReporteInventarioResponse {
    productos: any[];
    resumen: any;
}

class ReporteService {
    /**
     * Obtener reporte de ventas
     */
    async getReporteVentas(fechaInicio: string, fechaFin: string): Promise<ReporteVentasResponse> {
        try {
            const response = await api.get(`/reportes/ventas`, {
                params: { fechaInicio, fechaFin }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener reporte de ventas:', error);
            throw error;
        }
    }

    /**
     * Obtener reporte de compras
     */
    async getReporteCompras(fechaInicio: string, fechaFin: string): Promise<ReporteComprasResponse> {
        try {
            const response = await api.get(`/reportes/compras`, {
                params: { fechaInicio, fechaFin }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener reporte de compras:', error);
            throw error;
        }
    }

    /**
     * Obtener reporte de alquileres
     */
    async getReporteAlquileres(fechaInicio: string, fechaFin: string): Promise<ReporteAlquileresResponse> {
        try {
            const response = await api.get(`/reportes/alquileres`, {
                params: { fechaInicio, fechaFin }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener reporte de alquileres:', error);
            throw error;
        }
    }

    /**
     * Obtener reporte de inventario
     */
    async getReporteInventario(): Promise<ReporteInventarioResponse> {
        try {
            const response = await api.get(`/reportes/inventario`);
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener reporte de inventario:', error);
            throw error;
        }
    }

    /**
     * Obtener top productos más vendidos
     */
    async getTopProductos(fechaInicio: string, fechaFin: string): Promise<any[]> {
        try {
            const response = await api.get(`/reportes/top-productos`, {
                params: { fechaInicio, fechaFin }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener top productos:', error);
            throw error;
        }
    }

    /**
     * Obtener top clientes
     */
    async getTopClientes(fechaInicio: string, fechaFin: string): Promise<any[]> {
        try {
            const response = await api.get(`/reportes/top-clientes`, {
                params: { fechaInicio, fechaFin }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener top clientes:', error);
            throw error;
        }
    }

    /**
     * Obtener productos con bajo stock
     */
    async getProductosBajoStock(): Promise<any[]> {
        try {
            const response = await api.get(`/reportes/bajo-stock`);
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener productos bajo stock:', error);
            throw error;
        }
    }

    /**
     * Obtener productos más vendidos (con límite)
     */
    async getProductosMasVendidos(fechaInicio: string, fechaFin: string, limit: number = 20): Promise<any[]> {
        try {
            const response = await api.get(`/reportes/productos-mas-vendidos`, {
                params: { fechaInicio, fechaFin, limit }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener productos más vendidos:', error);
            throw error;
        }
    }

    /**
     * Obtener ventas por período con agrupación
     */
    async getVentasPorPeriodo(
        fechaInicio: string, 
        fechaFin: string, 
        tipoAgrupacion: 'Dia' | 'Mes' | 'Categoria' = 'Dia'
    ): Promise<any[]> {
        try {
            const response = await api.get(`/reportes/ventas-por-periodo`, {
                params: { fechaInicio, fechaFin, tipoAgrupacion }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener ventas por período:', error);
            throw error;
        }
    }
}

// ✅ EXPORTACIÓN POR DEFECTO
export default new ReporteService();