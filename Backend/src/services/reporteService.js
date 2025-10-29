const { getConnection, sql } = require('../config/database');

class ReporteService {
    /**
     * Reporte de ventas por período
     * Devuelve { periodo, resumen, ventas }
     */
    async reporteVentas(fechaInicio, fechaFin) {
        const pool = await getConnection();

        const result = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .execute('dbo.sp_ReporteVentas');

        const recordsets = result.recordsets || [];
        const ventas = recordsets[0] || [];
        const resumen = (recordsets[1] && recordsets[1][0]) ? recordsets[1][0] : {
            TotalVentas: 0,
            TotalIngresos: 0,
            PromedioVenta: 0,
            VentaMaxima: 0,
            VentaMinima: 0
        };

        return {
            periodo: { inicio: fechaInicio, fin: fechaFin },
            resumen,
            ventas
        };
    }

    /**
     * Reporte de inventario
     * Devuelve { resumen, productos }
     */
    async reporteInventario() {
        const pool = await getConnection();

        const result = await pool.request()
            .execute('dbo.sp_ReporteInventario');

        const recordsets = result.recordsets || [];
        const productos = recordsets[0] || [];
        const resumen = (recordsets[1] && recordsets[1][0]) ? recordsets[1][0] : {
            TotalProductos: 0, UnidadesTotales: 0, ValorTotalInventario: 0, ProductosAgotados: 0, ProductosStockBajo: 0
        };

        return {
            resumen,
            productos
        };
    }

    /**
     * Reporte de clientes
     * Devuelve { totalClientes, clientes }
     */
    async reporteClientes() {
        const pool = await getConnection();

        const result = await pool.request()
            .execute('dbo.sp_ReporteClientes');

        const clientes = result.recordset || [];
        return {
            totalClientes: clientes.length,
            clientes
        };
    }

    /**
     * Reporte de productos más vendidos
     */
    async reporteProductosMasVendidos(fechaInicio, fechaFin, limit = 20) {
        const pool = await getConnection();

        const result = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .input('limit', sql.Int, limit)
            .execute('dbo.sp_ReporteProductosMasVendidos');

        return result.recordset || [];
    }

    /**
     * Reporte de compras a proveedores
     * Devuelve { periodo, resumen, compras }
     */
    async reporteCompras(fechaInicio, fechaFin) {
        const pool = await getConnection();

        const result = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .execute('dbo.sp_ReporteCompras');

        const recordsets = result.recordsets || [];
        const compras = recordsets[0] || [];
        const resumen = (recordsets[1] && recordsets[1][0]) ? recordsets[1][0] : {
            TotalCompras: 0, TotalGastado: 0, UnidadesCompradas: 0, PromedioCompra: 0
        };

        return {
            periodo: { inicio: fechaInicio, fin: fechaFin },
            resumen,
            compras
        };
    }

    /**
     * Reporte de alquileres
     * Devuelve { periodo, resumen, alquileres }
     */
    async reporteAlquileres(fechaInicio, fechaFin) {
        const pool = await getConnection();

        const result = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .execute('dbo.sp_ReporteAlquileres');

        const recordsets = result.recordsets || [];
        const alquileres = recordsets[0] || [];
        const resumen = (recordsets[1] && recordsets[1][0]) ? recordsets[1][0] : {
            TotalAlquileres: 0, TotalIngresos: 0, PromedioAlquiler: 0, Activos: 0, Finalizados: 0
        };

        return {
            periodo: { inicio: fechaInicio, fin: fechaFin },
            resumen,
            alquileres
        };
    }
}

module.exports = new ReporteService();