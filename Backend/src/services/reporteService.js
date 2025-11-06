const { getConnection, sql } = require('../config/database');

class ReporteService {
    /**
     * Reporte de ventas por período
     */
    async reporteVentas(fechaInicio, fechaFin) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .execute('SP_ReporteVentas');

            return {
                periodo: {
                    inicio: fechaInicio,
                    fin: fechaFin
                },
                resumen: result.recordsets[1]?.[0] || {
                    TotalVentas: 0,
                    TotalIngresos: 0,
                    PromedioVenta: 0,
                    VentaMaxima: 0,
                    VentaMinima: 0
                },
                ventas: result.recordsets[0] || []
            };
        } catch (error) {
            console.error('❌ Error en reporteVentas:', error);
            throw error;
        }
    }

    /**
     * Reporte de inventario
     */
    async reporteInventario() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .execute('SP_ReporteInventario');

            console.log('📊 SP_ReporteInventario recordsets:', result.recordsets?.length);

            // SP_ReporteInventario solo retorna 1 recordset con los productos
            const productos = result.recordset || [];

            // Calcular resumen desde los datos
            const resumen = {
                TotalProductos: productos.length,
                ValorTotalInventario: productos.reduce((sum, p) => sum + (p.ValorInventarioCosto || 0), 0),
                ProductosStockBajo: productos.filter(p => p.EstadoStock === 'Stock Bajo').length,
                ProductosAgotados: productos.filter(p => p.EstadoStock === 'Sin Stock').length
            };

            return {
                resumen,
                productos
            };
        } catch (error) {
            console.error('❌ Error en reporteInventario:', error);
            throw error;
        }
    }

    /**
     * Reporte de clientes
     */
    async reporteClientes() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .execute('SP_ReporteClientes');

            const clientes = result.recordset || [];

            return {
                totalClientes: clientes.length,
                clientes
            };
        } catch (error) {
            console.error('❌ Error en reporteClientes:', error);
            throw error;
        }
    }

    /**
     * Reporte de productos más vendidos
     */
    async reporteProductosMasVendidos(fechaInicio, fechaFin, limit = 20) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .input('Limit', sql.Int, limit)
                .execute('SP_ReporteProductosMasVendidos');

            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error en reporteProductosMasVendidos:', error);
            throw error;
        }
    }

    /**
     * Reporte de compras a proveedores
     */
    async reporteCompras(fechaInicio, fechaFin) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .execute('SP_ReporteCompras');

            return {
                periodo: {
                    inicio: fechaInicio,
                    fin: fechaFin
                },
                resumen: result.recordsets[1]?.[0] || {
                    TotalCompras: 0,
                    TotalGastado: 0,
                    UnidadesCompradas: 0,
                    PromedioCompra: 0
                },
                compras: result.recordsets[0] || []
            };
        } catch (error) {
            console.error('❌ Error en reporteCompras:', error);
            throw error;
        }
    }

    /**
     * Reporte de alquileres
     */
    async reporteAlquileres(fechaInicio, fechaFin) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .execute('SP_ReporteAlquileres');

            return {
                periodo: {
                    inicio: fechaInicio,
                    fin: fechaFin
                },
                resumen: result.recordsets[1]?.[0] || {
                    TotalAlquileres: 0,
                    TotalIngresos: 0,
                    PromedioAlquiler: 0,
                    Activos: 0,
                    Finalizados: 0
                },
                alquileres: result.recordsets[0] || []
            };
        } catch (error) {
            console.error('❌ Error en reporteAlquileres:', error);
            throw error;
        }
    }

    /**
     * Top productos más vendidos (usando SP_ObtenerTopProductos)
     */
    async getTopProductos(fechaInicio = null, fechaFin = null) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .execute('SP_ObtenerTopProductos');

            console.log('📊 Top Productos:', result.recordset?.length || 0);
            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error en getTopProductos:', error);
            throw error;
        }
    }

    /**
     * Top clientes (usando SP_ObtenerTopClientes)
     */
    async getTopClientes(fechaInicio = null, fechaFin = null) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .execute('SP_ObtenerTopClientes');

            console.log('📊 Top Clientes:', result.recordset?.length || 0);
            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error en getTopClientes:', error);
            throw error;
        }
    }

    /**
     * Productos con bajo stock
     */
    async getProductosBajoStock() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .execute('SP_ProductosBajoStock');

            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error en getProductosBajoStock:', error);
            throw error;
        }
    }

    /**
     * Ventas por período con agrupación
     */
    async getVentasPorPeriodo(fechaInicio, fechaFin, tipoAgrupacion = 'Dia') {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .input('TipoAgrupacion', sql.VarChar(20), tipoAgrupacion)
                .execute('SP_VentasPorPeriodo');

            return result.recordset || [];
        } catch (error) {
            console.error('❌ Error en getVentasPorPeriodo:', error);
            throw error;
        }
    }
}

module.exports = new ReporteService();