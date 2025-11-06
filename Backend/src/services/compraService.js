const { getConnection, sql } = require('../config/database');
const transactionService = require('./transactionService');
const dataMartService = require('./dataMartService');

class CompraService {
    /**
     * Obtener todas las compras con paginación
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP con filtros
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('Id_proveedor', sql.Int, filters.Id_proveedor ? parseInt(filters.Id_proveedor) : null)
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerCompras');

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

        } catch (error) {
            console.error('❌ Error al obtener compras:', error);
            throw error;
        }
    }

    /**
     * Obtener compra por ID con detalles
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            // Llamar al SP que retorna 2 recordsets: [0] = maestro, [1] = detalles
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_ObtenerCompraPorId');

            if (!result.recordsets[0] || result.recordsets[0].length === 0) {
                throw new Error(`Compra con ID ${id} no encontrada`);
            }

            const compra = result.recordsets[0][0];
            compra.detalles = result.recordsets[1] || [];

            return compra;

        } catch (error) {
            console.error(`❌ Error al obtener compra ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear nueva compra con detalles
     */
    async create(data) {
        // Validar estructura
        if (!data.Id_proveedor || !data.detalles || !Array.isArray(data.detalles) || data.detalles.length === 0) {
            throw new Error('Debe especificar proveedor y al menos un producto');
        }

        return await transactionService.executeWithRetry(async (transaction, request) => {
            console.log('🛒 Iniciando creación de compra:', {
                Id_proveedor: data.Id_proveedor,
                NumeroFactura: data.NumeroFactura,
                CantidadProductos: data.detalles.length
            });

            // Calcular total
            let totalCalculado = 0;
            for (const detalle of data.detalles) {
                const subtotal = detalle.CantidadCompra * detalle.PrecioUnitario;
                totalCalculado += subtotal;
            }

            // Insertar maestro de compra usando SP
            const pool = transaction;
            const compraRequest = new sql.Request(pool);
            
            const compraResult = await compraRequest
                .input('Id_proveedor', sql.Int, data.Id_proveedor)
                .input('FechaCompra', sql.DateTime, data.FechaCompra || new Date())
                .input('TotalCompra', sql.Decimal(12, 2), data.TotalCompra || totalCalculado)
                .input('NumeroFactura', sql.VarChar(50), data.NumeroFactura || null)
                .execute('SP_CrearCompra');

            const compra = compraResult.recordset[0];
            const detallesCreados = [];

            // Insertar detalles usando SP (que aumenta stock automáticamente)
            let numeroLinea = 1;
            for (const detalle of data.detalles) {
                const subtotal = detalle.CantidadCompra * detalle.PrecioUnitario;

                // CREAR NUEVO REQUEST PARA CADA DETALLE
                const detalleRequest = new sql.Request(pool);
                const detalleResult = await detalleRequest
                    .input('Id_compra', sql.Int, compra.Id_compra)
                    .input('Id_producto', sql.Int, detalle.Id_producto)
                    .input('CantidadCompra', sql.Int, detalle.CantidadCompra)
                    .input('NumeroLinea', sql.Int, numeroLinea)
                    .input('PrecioUnitario', sql.Decimal(12, 2), detalle.PrecioUnitario)
                    .input('Subtotal', sql.Decimal(12, 2), subtotal)
                    .execute('SP_CrearDetalleCompra');

                detallesCreados.push(detalleResult.recordset[0]);
                numeroLinea++;
            }

            console.log(`✅ Compra creada con ID: ${compra.Id_compra}. Total: ${compra.TotalCompra}`);

            // Actualizar DataMart de forma asíncrona (no bloquea la respuesta)
            dataMartService.actualizarComprasHoy().catch(err => {
                console.warn('⚠️  Error actualizando DataMart (no crítico):', err.message);
            });

            return {
                ...compra,
                detalles: detallesCreados,
                totalProductos: detallesCreados.length,
                inventarioActualizado: true,
                mensaje: 'Compra creada exitosamente'
            };
        });
    }

    /**
     * Obtener estadísticas de compras
     */
    async getEstadisticas(filters = {}) {
        const pool = await getConnection();

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerEstadisticasCompras');

            const estadisticas = result.recordset[0];

            const estadisticasFormateadas = {
                TotalCompras: estadisticas.TotalCompras,
                CompraTotal: parseFloat(estadisticas.CompraTotal.toFixed(2)),
                PromedioCompra: parseFloat(estadisticas.PromedioCompra.toFixed(2)),
                CompraMayor: parseFloat(estadisticas.CompraMayor.toFixed(2)),
                CompraMenor: parseFloat(estadisticas.CompraMenor.toFixed(2)),
                ProveedoresUnicos: estadisticas.ProveedoresUnicos
            };

            console.log('📊 Estadísticas de compras calculadas:', estadisticasFormateadas);

            return estadisticasFormateadas;

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtener productos más comprados
     */
    async getProductosMasComprados(limit = 10, filters = {}) {
        const pool = await getConnection();

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerProductosMasComprados');

            console.log(`📈 Top ${limit} productos más comprados obtenidos`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener productos más comprados:', error);
            throw error;
        }
    }
}

module.exports = new CompraService();