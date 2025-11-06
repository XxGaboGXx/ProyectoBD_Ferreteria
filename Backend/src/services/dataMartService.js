const { getConnection, sql } = require('../config/database');

class DataMartService {
    /**
     * Ejecutar ETL completo del DataMart
     */
    async ejecutarETLCompleto(fechaInicio = null, fechaFin = null) {
        const pool = await getConnection();

        try {
            console.log('🔄 Ejecutando ETL completo del DataMart...');
            
            const request = pool.request();
            
            if (fechaInicio) {
                request.input('FechaInicio', sql.Date, fechaInicio);
            }
            if (fechaFin) {
                request.input('FechaFin', sql.Date, fechaFin);
            }

            await request.execute('DM.sp_ETL_DataMart_Completo');
            
            console.log('✅ ETL completado exitosamente');
            return { success: true, message: 'ETL ejecutado correctamente' };
        } catch (error) {
            console.error('❌ Error ejecutando ETL:', error);
            throw error;
        }
    }

    /**
     * Actualizar DataMart con compras del día actual
     */
    async actualizarComprasHoy() {
        const pool = await getConnection();

        try {
            const hoy = new Date();
            const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

            console.log('🔄 Actualizando DataMart con compras de hoy...');
            
            await pool.request()
                .input('FechaInicio', sql.Date, fechaHoy)
                .input('FechaFin', sql.Date, fechaHoy)
                .execute('DM.sp_Cargar_Fact_Compras');

            console.log('✅ DataMart actualizado con compras de hoy');
            return { success: true, message: 'DataMart actualizado' };
        } catch (error) {
            console.error('❌ Error actualizando DataMart:', error);
            throw error;
        }
    }

    /**
     * Obtener Top Proveedores desde el DataMart
     */
    async getTopProveedores(limit = 10) {
        const pool = await getConnection();

        try {
            // Usar parámetros para evitar SQL injection
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@Limit)
                        Proveedor,
                        Telefono,
                        TotalCompras,
                        TotalUnidadesCompradas,
                        MontoTotal,
                        PromedioCompra,
                        UltimaCompra,
                        ProductosDiferentes
                    FROM DM.vw_Top_Proveedores
                    ORDER BY MontoTotal DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo top proveedores:', error);
            throw error;
        }
    }

    /**
     * Obtener Productos Más Comprados desde el DataMart
     */
    async getProductosMasComprados(limit = 20) {
        const pool = await getConnection();

        try {
            // Usar parámetros para evitar SQL injection
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@Limit)
                        Producto,
                        Categoria,
                        CodigoBarra,
                        TotalUnidadesCompradas,
                        NumeroCompras,
                        MontoTotalComprado,
                        PrecioPromedioCompra,
                        PrecioVentaActual,
                        MargenPromedio,
                        UltimaCompra,
                        StockActual
                    FROM DM.vw_Productos_Mas_Comprados
                    ORDER BY TotalUnidadesCompradas DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo productos más comprados:', error);
            throw error;
        }
    }

    /**
     * Obtener Alertas de Inventario desde el DataMart
     */
    async getAlertasInventario() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        Producto,
                        Categoria,
                        StockActual,
                        StockMinimo,
                        DeficitUnidades,
                        NivelAlerta,
                        PromedioCompra,
                        UltimaCompra,
                        DiasDesdeUltimaCompra,
                        ProveedoresDisponibles
                    FROM DM.vw_Alertas_Inventario
                    ORDER BY 
                        CASE NivelAlerta
                            WHEN 'CRÍTICO - Sin Stock' THEN 1
                            WHEN 'URGENTE - Por debajo del mínimo' THEN 2
                            WHEN 'ADVERTENCIA - Cerca del mínimo' THEN 3
                            ELSE 4
                        END,
                        DiasDesdeUltimaCompra DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo alertas de inventario:', error);
            throw error;
        }
    }

    /**
     * Obtener Análisis de Rentabilidad desde el DataMart
     */
    async getRentabilidadProductos() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        Producto,
                        Categoria,
                        PrecioCompraActual,
                        PrecioVentaActual,
                        MargenUnitario,
                        PorcentajeMargen,
                        CostoPromedioHistorico,
                        MargenPromedioReal,
                        TotalUnidadesCompradas,
                        InversionTotal,
                        InventarioActual,
                        ValorInventario,
                        ValorPotencialVenta
                    FROM DM.vw_Rentabilidad_Productos
                    WHERE InventarioActual > 0
                    ORDER BY PorcentajeMargen DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo rentabilidad:', error);
            throw error;
        }
    }

    /**
     * Obtener Compras por Mes desde el DataMart
     */
    async getComprasPorMes(anio = null) {
        const pool = await getConnection();

        try {
            const request = pool.request();
            
            let query = `
                SELECT 
                    Anio,
                    Mes,
                    NombreMes,
                    TotalCompras,
                    TotalUnidades,
                    MontoTotal,
                    PromedioCompra,
                    ProveedoresActivos,
                    ProductosComprados
                FROM DM.vw_Compras_Por_Mes
            `;

            // Usar parámetros para evitar SQL injection
            if (anio) {
                request.input('Anio', sql.Int, anio);
                query += ` WHERE Anio = @Anio`;
            }

            query += ` ORDER BY Anio DESC, Mes DESC`;

            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo compras por mes:', error);
            throw error;
        }
    }

    /**
     * Obtener Tendencias Trimestrales desde el DataMart
     */
    async getTendenciasTrimestrales() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        Anio,
                        Trimestre,
                        PeriodoDesc,
                        TotalCompras,
                        TotalUnidades,
                        MontoTotal,
                        PromedioCompra,
                        ProveedoresActivos,
                        ProductosComprados,
                        CategoriasActivas
                    FROM DM.vw_Tendencias_Trimestrales
                    ORDER BY Anio DESC, Trimestre DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo tendencias:', error);
            throw error;
        }
    }

    /**
     * Obtener Análisis por Categoría desde el DataMart
     */
    async getAnalisisPorCategoria() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        Categoria,
                        Descripcion,
                        ProductosEnCategoria,
                        TotalCompras,
                        TotalUnidadesCompradas,
                        MontoTotal,
                        PrecioPromedioCompra,
                        ProveedoresDiferentes
                    FROM DM.vw_Analisis_Por_Categoria
                    ORDER BY MontoTotal DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo análisis por categoría:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del DataMart
     */
    async getEstadisticas() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .execute('DM.sp_Estadisticas_DataMart');

            return {
                tablas: result.recordsets[0] || [],
                resumen: result.recordsets[1]?.[0] || {}
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }
}

module.exports = new DataMartService();

