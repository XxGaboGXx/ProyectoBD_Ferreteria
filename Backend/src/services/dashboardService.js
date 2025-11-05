const { getConnection, sql } = require('../config/database');

class DashboardService {
    /**
     * Obtener resumen general del dashboard
     */
    async getDashboardSummary() {
        const pool = await getConnection();

        try {
            // Ejecutar SP_ObtenerResumenDashboard que retorna múltiples resultsets
            const result = await pool.request().execute('SP_ObtenerResumenDashboard');
            
            const ventasHoy = result.recordsets[0][0];
            const ventasMes = result.recordsets[1][0];
            const productosTotal = result.recordsets[2][0];
            const productosLowStock = result.recordsets[3][0];
            const clientesTotal = result.recordsets[4][0];
            const alquileresActivos = result.recordsets[5][0];

            // Obtener top productos y ventas recientes
            const topProductos = await this.getTopProductos(pool);
            const ventasRecientes = await this.getVentasRecientes(pool);

            return {
                ventas: {
                    hoy: ventasHoy,
                    mes: ventasMes
                },
                inventario: {
                    totalProductos: productosTotal.total,
                    unidadesTotal: productosTotal.unidadesTotal,
                    valorInventario: productosTotal.valorInventario,
                    lowStock: productosLowStock.cantidad
                },
                clientes: {
                    total: clientesTotal.total,
                    nuevosHoy: clientesTotal.nuevosHoy
                },
                alquileres: {
                    activos: alquileresActivos.total,
                    valorTotal: alquileresActivos.valorTotal,
                    vencidos: alquileresActivos.vencidos
                },
                topProductos,
                ventasRecientes
            };
        } catch (error) {
            console.error('❌ Error en getDashboardSummary:', error);
            throw error;
        }
    }

    async getVentasHoy(pool) {
        // Método legacy - ya no se usa directamente, está en SP_ObtenerResumenDashboard
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        return result.recordsets[0][0];
    }

    async getVentasMes(pool) {
        // Método legacy - ya no se usa directamente, está en SP_ObtenerResumenDashboard
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        return result.recordsets[1][0];
    }

    async getProductosTotal(pool) {
        // Método legacy - ya no se usa directamente, está en SP_ObtenerResumenDashboard
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        return result.recordsets[2][0];
    }

    async getProductosLowStock(pool) {
        // Método legacy - ya no se usa directamente, está en SP_ObtenerResumenDashboard
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        return result.recordsets[3][0].cantidad;
    }

    async getClientesTotal(pool) {
        // Método legacy - ya no se usa directamente, está en SP_ObtenerResumenDashboard
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        return result.recordsets[4][0];
    }

    async getAlquileresActivos(pool) {
        // Método legacy - ya no se usa directamente, está en SP_ObtenerResumenDashboard
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        return result.recordsets[5][0];
    }

    async getTopProductos(pool, limit = 5) {
        const result = await pool.request()
            .input('Limit', sql.Int, limit)
            .execute('SP_ObtenerTopProductos');
        return result.recordset;
    }

    async getVentasRecientes(pool, limit = 10) {
        const result = await pool.request()
            .input('Limit', sql.Int, limit)
            .execute('SP_ObtenerVentasRecientes');
        return result.recordset;
    }

    async getVentasPorDia(days = 30) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('Days', sql.Int, days)
                .execute('SP_ObtenerVentasPorDia');
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorDia:', error);
            throw error;
        }
    }

    async getVentasPorCategoria() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .execute('SP_ObtenerVentasPorCategoria');
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorCategoria:', error);
            throw error;
        }
    }

    async getVentasPorMetodoPago() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .execute('SP_ObtenerVentasPorMetodoPago');
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorMetodoPago:', error);
            throw error;
        }
    }

    async getTopClientes(limit = 10) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .execute('SP_ObtenerTopClientes');
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getTopClientes:', error);
            throw error;
        }
    }

    async getRendimientoColaboradores() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .execute('SP_ObtenerRendimientoColaboradores');
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getRendimientoColaboradores:', error);
            throw error;
        }
    }

    async getAnalisisInventario() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .execute('SP_ObtenerAnalisisInventario');
            
            return {
                resumen: result.recordsets[0][0],
                porCategoria: result.recordsets[1]
            };
        } catch (error) {
            console.error('❌ Error en getAnalisisInventario:', error);
            throw error;
        }
    }

    async getMovimientosRecientes(limit = 20) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .execute('SP_ObtenerMovimientosRecientes');
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getMovimientosRecientes:', error);
            throw error;
        }
    }

    async getResumenFinanciero() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .execute('SP_ObtenerResumenFinanciero');
            
            const ventasHoy = result.recordsets[0][0];
            const ventasSemana = result.recordsets[1][0];
            const ventasMes = result.recordsets[2][0];
            const comprasMes = result.recordsets[3][0];
            const alquileresActivos = result.recordsets[4][0];

            return {
                hoy: ventasHoy,
                semana: ventasSemana,
                mes: {
                    ventas: ventasMes,
                    compras: comprasMes,
                    utilidadBruta: ventasMes.total - comprasMes.total
                },
                alquileres: alquileresActivos
            };
        } catch (error) {
            console.error('❌ Error en getResumenFinanciero:', error);
            throw error;
        }
    }

    async getAlertas() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .execute('SP_ObtenerAlertas');
            
            const stockBajo = result.recordsets[0];
            const alquileresVencidos = result.recordsets[1];
            const sinMovimiento = result.recordsets[2];

            return {
                stockBajo: {
                    cantidad: stockBajo.length,
                    productos: stockBajo
                },
                alquileresVencidos: {
                    cantidad: alquileresVencidos.length,
                    alquileres: alquileresVencidos
                },
                sinMovimiento: {
                    cantidad: sinMovimiento.length,
                    productos: sinMovimiento
                }
            };
        } catch (error) {
            console.error('❌ Error en getAlertas:', error);
            throw error;
        }
    }
}

module.exports = new DashboardService();