const { getConnection, sql } = require('../config/database');
const transactionService = require('./transactionService');

class VentaService {
    /**
     * Obtener todas las ventas con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        // Llamar al SP con filtros
        const result = await pool.request()
            .input('Limit', sql.Int, limit)
            .input('Offset', sql.Int, offset)
            .input('Estado', sql.VarChar(20), filters.estado || null)
            .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
            .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
            .input('ClienteId', sql.Int, filters.clienteId ? parseInt(filters.clienteId) : null)
            .execute('SP_ObtenerVentas');

        // El SP retorna 2 recordsets: [0] = datos, [1] = total
        const data = result.recordsets[0] || [];
        const total = result.recordsets[1] && result.recordsets[1][0] ? result.recordsets[1][0].Total : 0;

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener venta por ID con detalles
     */
    async getById(id) {
        const pool = await getConnection();
        
        // Llamar al SP que retorna 2 recordsets: [0] = maestro, [1] = detalles
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .execute('SP_ObtenerVentaPorId');

        if (!result.recordsets[0] || result.recordsets[0].length === 0) {
            return null;
        }

        const venta = result.recordsets[0][0];
        venta.detalles = result.recordsets[1] || [];

        return venta;
    }

    async getDetalles(ventaId) {
        const pool = await getConnection();
        
        try {
            // Llamar al SP para obtener detalles
            const result = await pool.request()
                .input('VentaId', sql.Int, ventaId)
                .execute('SP_ObtenerDetallesVenta');

            console.log(`📋 Detalles de venta ${ventaId}: ${result.recordset.length} items`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener detalles de venta:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de ventas
     */
    async getEstadisticas(filters = {}) {
        const pool = await getConnection();
        
        try {
            // Llamar al SP que retorna 3 recordsets
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerEstadisticasVentas');

            // Recordset [0] = estadísticas principales
            // Recordset [1] = ventas canceladas
            // Recordset [2] = ventas pendientes
            const estadisticasPrincipales = result.recordsets[0][0];
            const ventasCanceladas = result.recordsets[1][0].VentasCanceladas;
            const ventasPendientes = result.recordsets[2][0].VentasPendientes;

            const estadisticas = {
                TotalVentas: estadisticasPrincipales.TotalVentas,
                VentaTotal: parseFloat(estadisticasPrincipales.VentaTotal.toFixed(2)),
                PromedioVenta: parseFloat(estadisticasPrincipales.PromedioVenta.toFixed(2)),
                VentaMayor: parseFloat(estadisticasPrincipales.VentaMayor.toFixed(2)),
                VentaMenor: parseFloat(estadisticasPrincipales.VentaMenor.toFixed(2)),
                ClientesUnicos: estadisticasPrincipales.ClientesUnicos,
                VentasCanceladas: ventasCanceladas,
                VentasPendientes: ventasPendientes
            };

            console.log('📊 Estadísticas de ventas calculadas:', estadisticas);

            return estadisticas;

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }
    /**
     * Obtener productos más vendidos
     */
    async getProductosMasVendidos(limit = 10, filters = {}) {
        const pool = await getConnection();
        
        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerProductosMasVendidos');

            console.log(`📈 Top ${limit} productos más vendidos obtenidos`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener productos más vendidos:', error);
            throw error;
        }
    }

    /**
     * Crear nueva venta
     */
    async create(ventaData) {
        // Validar estructura
        if (!ventaData.Id_cliente || !ventaData.Id_colaborador || !ventaData.Productos || ventaData.Productos.length === 0) {
            throw new Error('Debe especificar cliente, colaborador y al menos un producto');
        }

        return await transactionService.executeWithRetry(async (transaction, request) => {
            console.log('🔧 Creando venta:', {
                Id_cliente: ventaData.Id_cliente,
                Id_colaborador: ventaData.Id_colaborador,
                MetodoPago: ventaData.MetodoPago,
                CantidadProductos: ventaData.Productos.length
            });

            // Calcular total
            let total = 0;
            for (const producto of ventaData.Productos) {
                const subtotal = producto.PrecioUnitario * producto.Cantidad;
                total += subtotal;
            }

            // Insertar maestro de venta usando SP
            const pool = transaction;
            const ventaRequest = new sql.Request(pool);
            
            const ventaResult = await ventaRequest
                .input('Id_cliente', sql.Int, ventaData.Id_cliente)
                .input('Id_colaborador', sql.Int, ventaData.Id_colaborador)
                .input('MetodoPago', sql.VarChar(20), ventaData.MetodoPago)
                .input('TotalVenta', sql.Decimal(12, 2), total)
                .input('Estado', sql.VarChar(20), ventaData.Estado || 'Completada')
                .execute('SP_CrearVenta');

            const venta = ventaResult.recordset[0];
            const detallesCreados = [];

            // Insertar detalles usando SP
            let numeroLinea = 1;
            for (const producto of ventaData.Productos) {
                const subtotal = producto.PrecioUnitario * producto.Cantidad;

                // CREAR NUEVO REQUEST PARA CADA DETALLE
                const detalleRequest = new sql.Request(pool);
                const detalleResult = await detalleRequest
                    .input('Id_venta', sql.Int, venta.Id_venta)
                    .input('Id_producto', sql.Int, producto.Id_producto)
                    .input('CantidadVenta', sql.Int, producto.Cantidad)
                    .input('NumeroLinea', sql.Int, numeroLinea)
                    .input('PrecioUnitario', sql.Decimal(10, 2), producto.PrecioUnitario)
                    .input('Subtotal', sql.Decimal(10, 2), subtotal)
                    .execute('SP_CrearDetalleVenta');

                detallesCreados.push(detalleResult.recordset[0]);
                numeroLinea++;
            }

            console.log(`✅ Venta creada con ID: ${venta.Id_venta}`);

            return {
                ...venta,
                DetalleVenta: detallesCreados,
                mensaje: 'Venta creada exitosamente'
            };
        });
    }
    /**
     * Cancelar venta
     */
    async cancelarVenta(id, motivo) {
        const pool = await getConnection();

        try {
            console.log(`⚠️  Cancelando venta ${id}. Motivo: ${motivo || 'No especificado'}`);

            // Llamar al SP para cancelar venta
            const result = await pool.request()
                .input('Id_venta', sql.Int, id)
                .input('Motivo', sql.VarChar(255), motivo || 'No especificado')
                .execute('SP_CancelarVenta');

            const cancelacion = result.recordset[0];

            console.log(`✅ Venta ${id} cancelada exitosamente`);

            return {
                venta: {
                    Id_venta: cancelacion.Id_venta,
                    Estado: cancelacion.Estado
                },
                motivoCancelacion: cancelacion.Motivo,
                productosRestaurados: cancelacion.ProductosRestaurados,
                inventarioRestaurado: cancelacion.InventarioRestaurado === 1
            };

        } catch (error) {
            console.error('❌ Error al cancelar venta:', error);
            throw error;
        }
    }
}
module.exports = new VentaService();