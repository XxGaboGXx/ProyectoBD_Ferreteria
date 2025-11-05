const transactionService = require('./transactionService');
const { getConnection, sql } = require('../config/database');

class AlquilerService {
    /**
     * Crear un nuevo alquiler con detalles
     */
    async createAlquiler(alquilerData) {
        // Validar estructura
        if (!alquilerData.Id_cliente || !alquilerData.Id_colaborador || !alquilerData.detalles || alquilerData.detalles.length === 0) {
            throw new Error('Debe especificar cliente, colaborador y al menos un producto');
        }

        return await transactionService.executeWithRetry(async (transaction, request) => {
            console.log('🔧 Creando alquiler:', alquilerData);

            // Calcular fechas
            const fechaInicio = new Date();
            const diasMaximos = Math.max(...alquilerData.detalles.map(d => d.Dias || 1));
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + diasMaximos);

            // Calcular total
            let totalAlquiler = 0;
            for (const detalle of alquilerData.detalles) {
                const subtotal = detalle.TarifaDiaria * detalle.Dias * detalle.Cantidad;
                totalAlquiler += subtotal;
            }

            // Insertar maestro de alquiler usando SP
            const pool = transaction;
            const alquilerRequest = new sql.Request(pool);
            
            const alquilerResult = await alquilerRequest
                .input('Id_cliente', sql.Int, alquilerData.Id_cliente)
                .input('Id_colaborador', sql.Int, alquilerData.Id_colaborador)
                .input('FechaInicio', sql.DateTime, fechaInicio)
                .input('FechaFin', sql.DateTime, fechaFin)
                .input('TotalAlquiler', sql.Decimal(10, 2), totalAlquiler)
                .execute('SP_CrearAlquiler');

            const alquiler = alquilerResult.recordset[0];
            const detallesCreados = [];

            // Insertar detalles usando SP (CREAR NUEVO REQUEST PARA CADA DETALLE)
            for (const detalle of alquilerData.detalles) {
                const subtotal = detalle.TarifaDiaria * detalle.Dias * detalle.Cantidad;

                // CREAR NUEVO REQUEST PARA CADA DETALLE
                const detalleRequest = new sql.Request(pool);
                const detalleResult = await detalleRequest
                    .input('Cantidad', sql.Int, detalle.Cantidad)
                    .input('Dias', sql.Decimal(10, 2), detalle.Dias)
                    .input('Subtotal', sql.Decimal(10, 2), subtotal)
                    .input('TarifaDiaria', sql.Decimal(10, 2), detalle.TarifaDiaria)
                    .input('Deposito', sql.Decimal(10, 2), detalle.Deposito || 0)
                    .input('Id_alquiler', sql.Int, alquiler.Id_alquiler)
                    .input('Id_producto', sql.Int, detalle.Id_producto)
                    .execute('SP_CrearDetalleAlquiler');

                detallesCreados.push(detalleResult.recordset[0]);
            }

            // Nota: No registramos en BitacoraProducto porque es específica para cambios en productos
            // Los alquileres se registran en las tablas Alquiler y DetalleAlquiler

            console.log(`✅ Alquiler creado con ID: ${alquiler.Id_alquiler}`);

            return {
                ...alquiler,
                detalles: detallesCreados,
                mensaje: 'Alquiler creado exitosamente'
            };
        });
    }

    /**
     * Obtener todos los alquileres con paginación
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP con filtros
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('Estado', sql.VarChar(50), filters.estado || null)
                .input('ClienteId', sql.Int, filters.clienteId ? parseInt(filters.clienteId) : null)
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerAlquileres');

            const data = result.recordsets[0];
            const total = result.recordsets[1][0].Total;

            return {
                data: data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error al obtener alquileres:', error);
            throw error;
        }
    }

    /**
     * Obtener alquiler por ID con detalles
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_ObtenerAlquilerPorId');

            if (result.recordsets[0].length === 0) {
                throw new Error(`Alquiler con ID ${id} no encontrado`);
            }

            return {
                ...result.recordsets[0][0],
                detalles: result.recordsets[1]
            };

        } catch (error) {
            console.error(`❌ Error al obtener alquiler ${id}:`, error);
            throw error;
        }
    }

    /**
     * Finalizar alquiler (devolver productos)
     */
    async finalizarAlquiler(alquilerId, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            console.log(`🔚 Finalizando alquiler ${alquilerId}`);

            const pool = transaction;
            const finalRequest = new sql.Request(pool);
            
            const result = await finalRequest
                .input('Id_alquiler', sql.Int, alquilerId)
                .input('UserId', sql.VarChar(50), userId || 'SYSTEM')
                .execute('SP_FinalizarAlquiler');

            console.log(`✅ Alquiler ${alquilerId} finalizado`);

            return result.recordset[0];
        });
    }

    /**
     * Extender alquiler
     */
    async extenderAlquiler(alquilerId, diasAdicionales, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            console.log(`📅 Extendiendo alquiler ${alquilerId} por ${diasAdicionales} días`);

            const pool = transaction;
            const extenderRequest = new sql.Request(pool);
            
            const result = await extenderRequest
                .input('Id_alquiler', sql.Int, alquilerId)
                .input('DiasAdicionales', sql.Int, diasAdicionales)
                .input('UserId', sql.VarChar(50), userId || 'SYSTEM')
                .execute('SP_ExtenderAlquiler');

            const data = result.recordset[0];

            console.log(`✅ Alquiler extendido hasta ${data.nuevaFechaFin}`);

            return {
                alquilerId: data.alquilerId,
                nuevaFechaFin: data.nuevaFechaFin,
                diasAdicionales: data.diasAdicionales,
                costoAdicional: parseFloat(data.costoAdicional.toFixed(2)),
                nuevoTotal: parseFloat(data.nuevoTotal.toFixed(2))
            };
        });
    }

    /**
     * Cancelar alquiler
     */
    async cancelarAlquiler(alquilerId, motivo, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            console.log(`❌ Cancelando alquiler ${alquilerId}`);

            const pool = transaction;
            const cancelRequest = new sql.Request(pool);
            
            const result = await cancelRequest
                .input('Id_alquiler', sql.Int, alquilerId)
                .input('Motivo', sql.VarChar(255), motivo)
                .input('UserId', sql.VarChar(50), userId || 'SYSTEM')
                .execute('SP_CancelarAlquiler');

            console.log(`✅ Alquiler ${alquilerId} cancelado`);

            return result.recordset[0];
        });
    }

    /**
     * Obtener alquileres activos
     */
    async getAlquileresActivos(page = 1, limit = 50) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .execute('SP_ObtenerAlquileresActivos');

            const data = result.recordsets[0];
            const total = result.recordsets[1][0].Total;

            return {
                data: data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error al obtener alquileres activos:', error);
            throw error;
        }
    }

    /**
     * Obtener alquileres vencidos
     */
    async getAlquileresVencidos(page = 1, limit = 50) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .execute('SP_ObtenerAlquileresVencidos');

            const data = result.recordsets[0];
            const total = result.recordsets[1][0].Total;

            return {
                data: data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error al obtener alquileres vencidos:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas
     */
    async getEstadisticas() {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .execute('SP_ObtenerEstadisticasAlquileres');

            return result.recordset[0];

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de cliente
     */
    async getHistorialCliente(clienteId, page = 1, limit = 50) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            const result = await pool.request()
                .input('ClienteId', sql.Int, clienteId)
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .execute('SP_ObtenerHistorialCliente');

            const data = result.recordsets[0];
            const total = result.recordsets[1][0].Total;

            return {
                data: data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error(`❌ Error al obtener historial del cliente ${clienteId}:`, error);
            throw error;
        }
    }
}

module.exports = new AlquilerService();