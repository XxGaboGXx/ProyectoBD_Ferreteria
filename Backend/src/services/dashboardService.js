const { getConnection, sql } = require('../config/database');

class DashboardService {
    /**
     * Obtener resumen general del dashboard
     */
    async getDashboardSummary() {
        const pool = await getConnection();

        const [
            ventasHoy,
            ventasMes,
            productosTotal,
            productosLowStock,
            clientesTotal,
            alquileresActivos,
            topProductos,
            ventasRecientes
        ] = await Promise.all([
            this.getVentasHoy(pool),
            this.getVentasMes(pool),
            this.getProductosTotal(pool),
            this.getProductosLowStock(pool),
            this.getClientesTotal(pool),
            this.getAlquileresActivos(pool),
            this.getTopProductos(pool),
            this.getVentasRecientes(pool)
        ]);

        return {
            ventas: {
                hoy: ventasHoy,
                mes: ventasMes
            },
            inventario: {
                totalProductos: productosTotal.total,
                unidadesTotal: productosTotal.unidadesTotal,
                valorInventario: productosTotal.valorInventario,
                lowStock: productosLowStock
            },
            clientes: {
                total: clientesTotal.total,
                nuevosHoy: clientesTotal.nuevosHoy
            },
            alquileres: {
                total: alquileresActivos.total,
                valorTotal: alquileresActivos.valorTotal,
                vencidos: 0
            },
            topProductos,
            ventasRecientes
        };
    }

    async getVentasHoy(pool) {
        pool = pool || (await getConnection());
        const result = await pool.request().execute('dbo.sp_GetVentasHoy');
        return (result.recordset && result.recordset[0]) ? result.recordset[0] : { cantidad: 0, total: 0, promedio: 0 };
    }

    async getVentasMes(pool) {
        pool = pool || (await getConnection());
        const result = await pool.request().execute('dbo.sp_GetVentasMes');
        return (result.recordset && result.recordset[0]) ? result.recordset[0] : { cantidad: 0, total: 0, promedio: 0 };
    }

    async getProductosTotal(pool) {
        pool = pool || (await getConnection());
        const result = await pool.request().execute('dbo.sp_GetProductosTotal');
        return (result.recordset && result.recordset[0]) ? result.recordset[0] : { total: 0, unidadesTotal: 0, valorInventario: 0 };
    }

    async getProductosLowStock(pool) {
        pool = pool || (await getConnection());
        const result = await pool.request().execute('dbo.sp_GetProductosLowStock');
        return (result.recordset && result.recordset[0]) ? result.recordset[0].cantidad : 0;
    }

    async getClientesTotal(pool) {
        pool = pool || (await getConnection());
        const result = await pool.request().execute('dbo.sp_GetClientesTotal');
        return (result.recordset && result.recordset[0]) ? result.recordset[0] : { total: 0, nuevosHoy: 0 };
    }

    async getAlquileresActivos(pool) {
        pool = pool || (await getConnection());
        const result = await pool.request().execute('dbo.sp_GetAlquileresActivosSummary');
        return (result.recordset && result.recordset[0]) ? result.recordset[0] : { total: 0, valorTotal: 0 };
    }

    async getTopProductos(pool, limit = 5) {
        pool = pool || (await getConnection());
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .execute('dbo.sp_GetTopProductos');
        return result.recordset || [];
    }

    async getVentasRecientes(pool, limit = 10) {
        pool = pool || (await getConnection());
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .execute('dbo.sp_GetVentasRecientes');
        return result.recordset || [];
    }

    async getVentasPorDia(days = 30) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('days', sql.Int, days)
            .execute('dbo.sp_GetVentasPorDia');
        return result.recordset || [];
    }

    async getVentasPorCategoria() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetVentasPorCategoria');
        return result.recordset || [];
    }

    async getVentasPorMetodoPago() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetVentasPorMetodoPago');
        return result.recordset || [];
    }

    async getTopClientes(limit = 10) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .execute('dbo.sp_GetTopClientes');
        return result.recordset || [];
    }

    async getRendimientoColaboradores() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetRendimientoColaboradores');
        return result.recordset || [];
    }

    async getAnalisisInventario() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetAnalisisInventario');
        // sp_GetAnalisisInventario devuelve dos resultsets: resumen y porCategoria
        const recordsets = result.recordsets || [];
        const resumen = recordsets[0] && recordsets[0][0] ? recordsets[0][0] : {};
        const porCategoria = recordsets[1] || [];
        return { resumen, porCategoria };
    }

    async getMovimientosRecientes(limit = 20) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .execute('dbo.sp_GetMovimientosRecientes');
        return result.recordset || [];
    }

    async getResumenFinanciero() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetResumenFinanciero');
        const recordsets = result.recordsets || [];
        return {
            hoy: recordsets[0] && recordsets[0][0] ? recordsets[0][0] : { total: 0, cantidad: 0 },
            semana: recordsets[1] && recordsets[1][0] ? recordsets[1][0] : { total: 0, cantidad: 0 },
            mes: {
                ventas: recordsets[2] && recordsets[2][0] ? recordsets[2][0] : { total: 0, cantidad: 0 },
                compras: recordsets[3] && recordsets[3][0] ? recordsets[3][0] : { total: 0, cantidad: 0 },
                utilidadBruta: (recordsets[2] && recordsets[2][0] ? recordsets[2][0].total : 0) - (recordsets[3] && recordsets[3][0] ? recordsets[3][0].total : 0)
            },
            alquileres: recordsets[4] && recordsets[4][0] ? recordsets[4][0] : { total: 0, cantidad: 0 }
        };
    }

    async getAlertas() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetAlertasDashboard');
        const recordsets = result.recordsets || [];
        return {
            stockBajo: {
                cantidad: recordsets[0] ? recordsets[0].length : 0,
                productos: recordsets[0] || []
            },
            alquileresVencidos: {
                cantidad: recordsets[1] ? recordsets[1].length : 0,
                alquileres: recordsets[1] || []
            },
            sinMovimiento: {
                cantidad: recordsets[2] ? recordsets[2].length : 0,
                productos: recordsets[2] || []
            }
        };
    }
}

module.exports = new DashboardService();