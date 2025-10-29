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

            // Insertar alquiler
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
                .query(`
                    INSERT INTO Alquiler 
                    (Id_Cliente, Id_Colaborador, Id_Producto, Cantidad, PrecioDia, Dias, 
                     Total, FechaInicio, FechaFin, Estado)
                    OUTPUT INSERTED.Id_Alquiler
                    VALUES 
                    (@clienteId, @colaboradorId, @productoId, @cantidad, @precioDia, @dias,
                     @total, @fechaInicio, @fechaFin, 'ACTIVO')
                `);

            const alquilerId = result.recordset[0].Id_Alquiler;

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
            // Obtener datos del alquiler
            const alquilerData = await request
                .input('alquilerId', sql.Int, alquilerId)
                .query(`
                    SELECT Id_Producto, Cantidad, Estado
                    FROM Alquiler
                    WHERE Id_Alquiler = @alquilerId
                `);

            if (alquilerData.recordset.length === 0) {
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

            // Actualizar estado
            await request.query(`
                UPDATE Alquiler
                SET Estado = 'FINALIZADO',
                    FechaDevolucion = GETDATE()
                WHERE Id_Alquiler = @alquilerId
            `);

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

        const result = await pool.request().query(`
            SELECT 
                a.*,
                c.Nombre as ClienteNombre,
                c.Apellidos as ClienteApellidos,
                p.Nombre as ProductoNombre,
                col.Nombre as ColaboradorNombre,
                DATEDIFF(day, GETDATE(), a.FechaFin) as DiasRestantes
            FROM Alquiler a
            INNER JOIN Cliente c ON a.Id_Cliente = c.Id_Cliente
            INNER JOIN Producto p ON a.Id_Producto = p.Id_Producto
            INNER JOIN Colaborador col ON a.Id_Colaborador = col.Id_Colaborador
            WHERE a.Estado = 'ACTIVO'
            ORDER BY a.FechaFin ASC
        `);

        return result.recordset;
    }

    /**
     * Obtener alquileres vencidos
     */
    async getAlquileresVencidos() {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request().query(`
            SELECT 
                a.*,
                c.Nombre as ClienteNombre,
                c.Apellidos as ClienteApellidos,
                c.Telefono as ClienteTelefono,
                p.Nombre as ProductoNombre,
                DATEDIFF(day, a.FechaFin, GETDATE()) as DiasVencidos
            FROM Alquiler a
            INNER JOIN Cliente c ON a.Id_Cliente = c.Id_Cliente
            INNER JOIN Producto p ON a.Id_Producto = p.Id_Producto
            WHERE a.Estado = 'ACTIVO'
            AND a.FechaFin < GETDATE()
            ORDER BY a.FechaFin ASC
        `);

        return result.recordset;
    }
}

module.exports = new AlquilerService();