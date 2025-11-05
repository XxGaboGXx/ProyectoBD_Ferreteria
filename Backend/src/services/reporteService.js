const { getConnection, sql } = require('../config/database');

class ReporteService {
    /**
     * Reporte de ventas por período
     */
    async reporteVentas(fechaInicio, fechaFin) {
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
            resumen: result.recordsets[1][0],
            ventas: result.recordsets[0]
        };
    }

    /**
     * Reporte de inventario
     */
    async reporteInventario() {
        const pool = await getConnection();
        
        const result = await pool.request()
            .execute('SP_ReporteInventario');

        return {
            resumen: result.recordsets[1][0],
            productos: result.recordsets[0]
        };
    }

    /**
     * Reporte de clientes
     */
    async reporteClientes() {
        const pool = await getConnection();
        
        const result = await pool.request()
            .execute('SP_ReporteClientes');

        const clientes = result.recordset;

        return {
            totalClientes: clientes.length,
            clientes: clientes
        };
    }

    /**
     * Reporte de productos más vendidos
     */
    async reporteProductosMasVendidos(fechaInicio, fechaFin, limit = 20) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('FechaInicio', sql.DateTime, fechaInicio)
            .input('FechaFin', sql.DateTime, fechaFin)
            .input('Limit', sql.Int, limit)
            .execute('SP_ReporteProductosMasVendidos');

        return result.recordset;
    }

    /**
     * Reporte de compras a proveedores
     */
    async reporteCompras(fechaInicio, fechaFin) {
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
            resumen: result.recordsets[1][0],
            compras: result.recordsets[0]
        };
    }

    /**
     * Reporte de alquileres
     */
    async reporteAlquileres(fechaInicio, fechaFin) {
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
            resumen: result.recordsets[1][0],
            alquileres: result.recordsets[0]
        };
    }
}

module.exports = new ReporteService();