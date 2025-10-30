const transactionService = require('./transactionService');
const { sql } = require('../config/database');

class AlquilerService {
    /**
     * Crear un nuevo alquiler
     */
    async createAlquiler(alquilerData) {
        transactionService.validateTransactionData(alquilerData, [
            'Id_Cliente',
            'Id_Colaborador',
            'Id_Producto',
            'Cantidad',
            'PrecioDia',
            'Dias'
        ]);

        return await transactionService.executeWithRetry(async (transaction, request) => {
            // Validar stock disponible
            await transactionService.validateStock(
                transaction,
                request,
                alquilerData.Id_Producto,
                alquilerData.Cantidad
            );

            const total = alquilerData.PrecioDia * alquilerData.Dias * alquilerData.Cantidad;
            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + alquilerData.Dias);

            // Ejecutar SP para insertar alquiler y obtener Id por OUTPUT
            const result = await request
                .input('clienteId', sql.Int, alquilerData.Id_Cliente)
                .input('colaboradorId', sql.Int, alquilerData.Id_Colaborador)
                .input('productoId', sql.Int, alquilerData.Id_Producto)
                .input('cantidad', sql.Int, alquilerData.Cantidad)
                .input('precioDia', sql.Decimal(10, 2), alquilerData.PrecioDia)
                .input('dias', sql.Int, alquilerData.Dias)
                .input('total', sql.Decimal(10, 2), total)
                .input('fechaInicio', sql.DateTime, fechaInicio)
                .input('fechaFin', sql.DateTime, fechaFin)
                .output('newId', sql.Int)
                .execute('dbo.sp_CreateAlquiler');

            const alquilerId = result.output.newId;

            // Reducir stock (productos alquilados)
            await transactionService.updateStock(
                transaction,
                request,
                alquilerData.Id_Producto,
                -alquilerData.Cantidad,
                'ALQUILER'
            );

            // Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                'Alquiler',
                'INSERT',
                alquilerId,
                alquilerData.Id_Colaborador
            );

            return {
                alquilerId,
                total,
                fechaInicio,
                fechaFin
            };
        });
    }

    /**
     * Finalizar alquiler (devolver productos)
     */
    async finalizarAlquiler(alquilerId, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // Obtener datos del alquiler via SP
            const alquilerData = await request
                .input('alquilerId', sql.Int, alquilerId)
                .execute('dbo.sp_GetAlquilerById');

            if (!alquilerData.recordset || alquilerData.recordset.length === 0) {
                throw new Error(`Alquiler ${alquilerId} no encontrado`);
            }

            const alquiler = alquilerData.recordset[0];

            if (alquiler.Estado === 'FINALIZADO') {
                throw new Error('El alquiler ya está finalizado');
            }

            // Devolver stock
            await transactionService.updateStock(
                transaction,
                request,
                alquiler.Id_Producto,
                alquiler.Cantidad,
                'DEVOLUCION_ALQUILER'
            );

            // Actualizar estado mediante SP
            await request
                .input('alquilerId', sql.Int, alquilerId)
                .execute('dbo.sp_FinalizarAlquiler');

            // Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                'Alquiler',
                'UPDATE',
                alquilerId,
                userId
            );

            return {
                alquilerId,
                itemsRestored: alquiler.Cantidad,
                status: 'FINALIZADO'
            };
        });
    }

    /**
     * Obtener alquileres activos
     */
    async getAlquileresActivos() {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request().execute('dbo.sp_GetAlquileresActivos');

        return result.recordset;
    }

    /**
     * Obtener alquileres vencidos
     */
    async getAlquileresVencidos() {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request().execute('dbo.sp_GetAlquileresVencidos');

        return result.recordset;
    }
}

module.exports = new AlquilerService();