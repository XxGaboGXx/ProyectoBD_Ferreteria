const { getConnection, sql } = require('../config/database');

class DashboardService {
    /**
     * Obtener resumen general del dashboard
     */
  async getDashboardSummary() {
    const pool = await getConnection();

    try {
        console.log('🔍 Ejecutando SP_ObtenerResumenDashboard...');
        
        const result = await pool.request().execute('SP_ObtenerResumenDashboard');
        
        console.log('📊 Resultados recibidos:', result.recordsets.length, 'recordsets');
        
        if (!result.recordsets || result.recordsets.length < 6) {
            console.error('❌ El SP no retornó todos los recordsets esperados');
            throw new Error('Estructura de datos incompleta del Stored Procedure');
        }
        
        const ventasHoy = result.recordsets[0][0] || { total: 0 };
        const ventasMes = result.recordsets[1][0] || { total: 0 };
        const productosTotal = result.recordsets[2][0] || { total: 0, unidadesTotal: 0, valorInventario: 0 };
        const productosLowStock = result.recordsets[3][0] || { cantidad: 0 };
        const clientesTotal = result.recordsets[4][0] || { total: 0, nuevosHoy: 0 };
        const alquileresActivos = result.recordsets[5][0] || { total: 0, valorTotal: 0, vencidos: 0 };

        console.log('✅ Datos procesados correctamente');

        return {
            ventasHoy: parseFloat(ventasHoy.total || 0),
            ventasDelMes: parseFloat(ventasMes.total || 0),
            totalProductos: parseInt(productosTotal.total || 0),
            productosStockBajo: parseInt(productosLowStock.cantidad || 0),
            totalClientes: parseInt(clientesTotal.total || 0),
            clientesActivos: parseInt(clientesTotal.nuevosHoy || 0),
            alquileresActivos: parseInt(alquileresActivos.total || 0),
            alquileresVencidos: parseInt(alquileresActivos.vencidos || 0)
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

   
async getTopProductos(limit = 10) {
    const pool = await getConnection();
    
    try {
        const result = await pool.request()
            .input('Limite', sql.Int, limit)  // ✅ Con 'e'
            .execute('SP_ObtenerTopProductos');
        
        console.log('✅ Top Productos:', result.recordset.length, 'registros');
        return result.recordset;
    } catch (error) {
        console.error('❌ Error en getTopProductos:', error);
        throw error;
    }
}

async getTopClientes(limit = 10) {
    const pool = await getConnection();
    
    try {
        const result = await pool.request()
            .input('Limite', sql.Int, limit)  // ✅ Con 'e'
            .execute('SP_ObtenerTopClientes');
        
        console.log('✅ Top Clientes:', result.recordset.length, 'registros');
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