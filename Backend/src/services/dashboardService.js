const { getConnection, sql } = require('../config/database');

class DashboardService {
    /**
     * Obtener resumen general del dashboard usando SP
     */
    async getDashboardSummary() {
        const pool = await getConnection();

        try {
            console.log('🔍 Ejecutando SP_ObtenerResumenDashboard...');
            
            const result = await pool.request()
                .execute('SP_ObtenerResumenDashboard');

            console.log(`📊 SP retornó ${result.recordsets.length} recordsets`);

            // Extraer los 5 recordsets que retorna el SP
            const ventasHoy = result.recordsets[0]?.[0] || { cantidad: 0, total: 0 };
            const ventasMes = result.recordsets[1]?.[0] || { cantidad: 0, total: 0 };
            const comprasMes = result.recordsets[2]?.[0] || { cantidad: 0, total: 0 };
            const alquileresMes = result.recordsets[3]?.[0] || { cantidad: 0, total: 0 };
            const productos = result.recordsets[4]?.[0] || { 
                total: 0, 
                stockBajo: 0, 
                agotados: 0 
            };

            // Construir respuesta en el formato que espera el frontend
            const summary = {
                ventasHoy: {
                    total: parseFloat(ventasHoy.total) || 0,
                    cantidad: parseInt(ventasHoy.cantidad) || 0,
                    cambio: 0
                },
                ventasMes: {
                    total: parseFloat(ventasMes.total) || 0,
                    cantidad: parseInt(ventasMes.cantidad) || 0,
                    cambio: 0
                },
                comprasMes: {
                    total: parseFloat(comprasMes.total) || 0,
                    cantidad: parseInt(comprasMes.cantidad) || 0,
                    cambio: 0
                },
                alquileresMes: {
                    total: parseFloat(alquileresMes.total) || 0,
                    cantidad: parseInt(alquileresMes.cantidad) || 0,
                    cambio: 0
                },
                productos: {
                    total: parseInt(productos.total) || 0,
                    stockBajo: parseInt(productos.stockBajo) || 0,
                    agotados: parseInt(productos.agotados) || 0,
                    cambio: 0
                }
            };

            console.log('✅ Resumen del dashboard generado:', JSON.stringify(summary, null, 2));
            return summary;

        } catch (error) {
            console.error('❌ Error en getDashboardSummary:', error.message);
            throw error;
        }
    }

    /**
     * Obtener Top Productos usando SP
     */
    async getTopProductos(limit = 10) {
        const pool = await getConnection();

        try {
            console.log(`🔍 Ejecutando SP_ObtenerTopProductos (limit=${limit})...`);
            
            const result = await pool.request()
                .input('Limite', sql.Int, limit)
                .execute('SP_ObtenerTopProductos');

            console.log(`✅ Top Productos: ${result.recordset.length} registros`);
            return result.recordset;

        } catch (error) {
            console.error('❌ Error en getTopProductos:', error.message);
            throw error;
        }
    }

    /**
     * Obtener Top Clientes usando SP
     */
    async getTopClientes(limit = 10) {
        const pool = await getConnection();

        try {
            console.log(`🔍 Ejecutando SP_ObtenerTopClientes (limit=${limit})...`);
            
            const result = await pool.request()
                .input('Limite', sql.Int, limit)
                .execute('SP_ObtenerTopClientes');

            console.log(`✅ Top Clientes: ${result.recordset.length} registros`);
            return result.recordset;

        } catch (error) {
            console.error('❌ Error en getTopClientes:', error.message);
            throw error;
        }
    }

    /**
     * Obtener Alertas usando SP
     */
    async getAlertas() {
        const pool = await getConnection();

        try {
            console.log('🔍 Ejecutando SP_ObtenerAlertas...');
            
            const result = await pool.request()
                .execute('SP_ObtenerAlertas');
            
            const stockBajo = result.recordsets[0] || [];
            const alquileresVencidos = result.recordsets[1] || [];
            const sinMovimiento = result.recordsets[2] || [];

            console.log(`📊 Alertas - Stock Bajo: ${stockBajo.length}, Vencidos: ${alquileresVencidos.length}, Sin Movimiento: ${sinMovimiento.length}`);

            const alertas = [];

            // 1. Stock bajo
            stockBajo.forEach(item => {
                alertas.push({
                    tipo: 'stock',
                    nivel: item.Stock < 0 ? 'critico' : 'advertencia',
                    mensaje: item.Stock < 0 
                        ? `⚠️ ${item.Producto}: Stock NEGATIVO (${item.Stock} unidades)`
                        : `📉 ${item.Producto}: Stock bajo (${item.Stock}/${item.StockMinimo} unidades)`,
                    data: {
                        id: item.Id_Producto,
                        producto: item.Producto,
                        stock: item.Stock,
                        stockMinimo: item.StockMinimo,
                        categoria: item.Categoria
                    }
                });
            });

            // 2. Alquileres vencidos
            alquileresVencidos.forEach(item => {
                alertas.push({
                    tipo: 'alquiler_vencido',
                    nivel: item.DiasVencidos > 7 ? 'critico' : 'advertencia',
                    mensaje: item.DiasVencidos > 7
                        ? `🔴 Alquiler #${item.Id_alquiler} CRÍTICO: ${item.DiasVencidos} días vencido`
                        : `⏰ Alquiler #${item.Id_alquiler} vencido hace ${item.DiasVencidos} días`,
                    data: {
                        id: item.Id_alquiler,
                        cliente: item.Cliente,
                        diasVencidos: item.DiasVencidos,
                        total: item.TotalAlquiler
                    }
                });
            });

            // 3. Sin movimiento (solo 10)
            sinMovimiento.slice(0, 10).forEach(item => {
                alertas.push({
                    tipo: 'sin_movimiento',
                    nivel: 'info',
                    mensaje: item.UltimoMovimiento
                        ? `📦 ${item.Producto}: Sin movimiento reciente`
                        : `📦 ${item.Producto}: Nunca ha tenido movimientos`,
                    data: {
                        id: item.Id_Producto,
                        producto: item.Producto,
                        stock: item.Stock,
                        categoria: item.Categoria,
                        ultimoMovimiento: item.UltimoMovimiento
                    }
                });
            });

            console.log(`✅ Total de alertas generadas: ${alertas.length}`);
            return alertas;

        } catch (error) {
            console.error('❌ Error en getAlertas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener ventas por día usando SP
     */
    async getVentasPorDia(days = 30) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('Days', sql.Int, days)
                .execute('SP_ObtenerVentasPorDia');

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorDia:', error.message);
            throw error;
        }
    }

    /**
     * Obtener ventas por categoría usando SP
     */
    async getVentasPorCategoria() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .execute('SP_ObtenerVentasPorCategoria');

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorCategoria:', error.message);
            throw error;
        }
    }
}

module.exports = new DashboardService();