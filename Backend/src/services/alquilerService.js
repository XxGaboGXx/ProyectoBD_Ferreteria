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

            // Validar que el cliente existe
            const clienteResult = await request
                .input('clienteId', sql.Int, alquilerData.Id_cliente)
                .query('SELECT Id_cliente FROM Cliente WHERE Id_cliente = @clienteId');

            if (clienteResult.recordset.length === 0) {
                throw new Error('Cliente no encontrado');
            }

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

            // Insertar maestro de alquiler (CREAR NUEVO REQUEST)
            const pool = transaction;
            const alquilerRequest = new sql.Request(pool);
            
            const alquilerResult = await alquilerRequest
                .input('clienteId', sql.Int, alquilerData.Id_cliente)
                .input('fechaInicio', sql.DateTime, fechaInicio)
                .input('fechaFin', sql.DateTime, fechaFin)
                .input('estado', sql.VarChar(50), 'ACTIVO')
                .input('totalAlquiler', sql.Decimal(10, 2), totalAlquiler)
                .input('colaboradorId', sql.Int, alquilerData.Id_colaborador)
                .query(`
                    INSERT INTO Alquiler (FechaInicio, FechaFin, Estado, TotalAlquiler, Id_cliente, Id_colaborador)
                    OUTPUT INSERTED.*
                    VALUES (@fechaInicio, @fechaFin, @estado, @totalAlquiler, @clienteId, @colaboradorId)
                `);

            const alquiler = alquilerResult.recordset[0];
            const detallesCreados = [];

            // Insertar detalles (CREAR NUEVO REQUEST PARA CADA DETALLE)
            for (const detalle of alquilerData.detalles) {
                // Validar stock (CREAR NUEVO REQUEST)
                const stockRequest = new sql.Request(pool);
                await transactionService.validateStock(
                    transaction,
                    stockRequest,
                    detalle.Id_producto,
                    detalle.Cantidad
                );

                const subtotal = detalle.TarifaDiaria * detalle.Dias * detalle.Cantidad;

                // CREAR NUEVO REQUEST PARA CADA DETALLE
                const detalleRequest = new sql.Request(pool);
                const detalleResult = await detalleRequest
                    .input('cantidad', sql.Int, detalle.Cantidad)
                    .input('dias', sql.Decimal(10, 2), detalle.Dias)
                    .input('subtotal', sql.Decimal(10, 2), subtotal)
                    .input('tarifaDiaria', sql.Decimal(10, 2), detalle.TarifaDiaria)
                    .input('deposito', sql.Decimal(10, 2), detalle.Deposito || 0)
                    .input('alquilerId', sql.Int, alquiler.Id_alquiler)
                    .input('productoId', sql.Int, detalle.Id_producto)
                    .query(`
                        INSERT INTO DetalleAlquiler 
                        (CantidadDetalleAlquiler, DiasAlquilados, Subtotal, TarifaDiaria, Deposito, Id_alquiler, Id_producto)
                        OUTPUT INSERTED.*
                        VALUES (@cantidad, @dias, @subtotal, @tarifaDiaria, @deposito, @alquilerId, @productoId)
                    `);

                detallesCreados.push(detalleResult.recordset[0]);

                // Reducir stock (CREAR NUEVO REQUEST)
                const updateStockRequest = new sql.Request(pool);
                await transactionService.updateStock(
                    transaction,
                    updateStockRequest,
                    detalle.Id_producto,
                    -detalle.Cantidad,
                    'ALQUILER'
                );
            }

            // Registrar en bitácora (CREAR NUEVO REQUEST)
            const bitacoraRequest = new sql.Request(pool);
            await transactionService.logToBitacora(
                transaction,
                bitacoraRequest,
                'Alquiler',
                'INSERT',
                alquiler.Id_alquiler,
                alquilerData.Id_colaborador
            );

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
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.estado) {
                whereClause += ' AND a.Estado = @estado';
                params.push({ name: 'estado', type: sql.VarChar(50), value: filters.estado });
            }

            if (filters.clienteId) {
                whereClause += ' AND a.Id_cliente = @clienteId';
                params.push({ name: 'clienteId', type: sql.Int, value: parseInt(filters.clienteId) });
            }

            if (filters.fechaInicio) {
                whereClause += ' AND a.FechaInicio >= @fechaInicio';
                params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(filters.fechaInicio) });
            }

            if (filters.fechaFin) {
                whereClause += ' AND a.FechaFin <= @fechaFinFilter';
                params.push({ name: 'fechaFinFilter', type: sql.DateTime, value: new Date(filters.fechaFin) });
            }

            let request = pool.request()
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset);

            params.forEach(p => request.input(p.name, p.type, p.value));

            const result = await request.query(`
                SELECT 
                    a.*,
                    c.Nombre as ClienteNombre,
                    c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
                    c.Telefono as ClienteTelefono,
                    col.Nombre as ColaboradorNombre,
                    col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorApellidos,
                    COUNT(da.Id_detalleAlquiler) as TotalProductos,
                    SUM(da.CantidadDetalleAlquiler) as TotalUnidades,
                    CASE 
                        WHEN a.Estado = 'ACTIVO' AND GETDATE() > a.FechaFin THEN 'VENCIDO'
                        WHEN a.Estado = 'ACTIVO' AND DATEDIFF(day, GETDATE(), a.FechaFin) <= 2 THEN 'POR_VENCER'
                        ELSE a.Estado
                    END as EstadoActual,
                    DATEDIFF(day, GETDATE(), a.FechaFin) as DiasRestantes
                FROM Alquiler a
                INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
                INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
                LEFT JOIN DetalleAlquiler da ON a.Id_alquiler = da.Id_alquiler
                ${whereClause}
                GROUP BY 
                    a.Id_alquiler, a.FechaInicio, a.FechaFin, a.Estado, a.TotalAlquiler, 
                    a.Id_cliente, a.Id_colaborador,
                    c.Nombre, c.Apellido1, c.Apellido2, c.Telefono,
                    col.Nombre, col.Apellido1, col.Apellido2
                ORDER BY 
                    CASE WHEN a.Estado = 'ACTIVO' AND GETDATE() > a.FechaFin THEN 1 
                         WHEN a.Estado = 'ACTIVO' THEN 2 
                         ELSE 3 END,
                    a.FechaFin ASC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const countResult = await request.query(`
                SELECT COUNT(DISTINCT a.Id_alquiler) as total
                FROM Alquiler a
                ${whereClause}
            `);

            const total = countResult.recordset[0].total;

            return {
                data: result.recordset,
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
            // Obtener maestro
            const alquilerResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        a.*,
                        c.Nombre as ClienteNombre,
                        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
                        c.Telefono as ClienteTelefono,
                        c.Correo as ClienteEmail,
                        col.Nombre as ColaboradorNombre,
                        col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorApellidos,
                        DATEDIFF(day, a.FechaInicio, ISNULL(a.FechaFin, GETDATE())) as DiasTranscurridos
                    FROM Alquiler a
                    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
                    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
                    WHERE a.Id_alquiler = @id
                `);

            if (alquilerResult.recordset.length === 0) {
                throw new Error(`Alquiler con ID ${id} no encontrado`);
            }

            // Obtener detalles
            const detallesResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        da.*,
                        p.Nombre as ProductoNombre,
                        p.Descripcion as ProductoDescripcion,
                        p.CodigoBarra as ProductoCodigoBarra
                    FROM DetalleAlquiler da
                    INNER JOIN Producto p ON da.Id_producto = p.Id_Producto
                    WHERE da.Id_alquiler = @id
                `);

            return {
                ...alquilerResult.recordset[0],
                detalles: detallesResult.recordset
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

            // Obtener datos del alquiler
            const alquilerData = await request
                .input('alquilerId', sql.Int, alquilerId)
                .query('SELECT Estado, FechaFin FROM Alquiler WHERE Id_alquiler = @alquilerId');

            if (alquilerData.recordset.length === 0) {
                throw new Error(`Alquiler ${alquilerId} no encontrado`);
            }

            const alquiler = alquilerData.recordset[0];

            if (alquiler.Estado === 'FINALIZADO') {
                throw new Error('El alquiler ya está finalizado');
            }

            if (alquiler.Estado === 'CANCELADO') {
                throw new Error('El alquiler está cancelado');
            }

            // Obtener detalles
            const detallesData = await request.query(`
                SELECT Id_producto, CantidadDetalleAlquiler
                FROM DetalleAlquiler
                WHERE Id_alquiler = @alquilerId
            `);

            // Devolver stock de cada producto (CREAR NUEVO REQUEST PARA CADA UNO)
            const pool = transaction;
            for (const detalle of detallesData.recordset) {
                const stockRequest = new sql.Request(pool);
                await transactionService.updateStock(
                    transaction,
                    stockRequest,
                    detalle.Id_producto,
                    detalle.CantidadDetalleAlquiler,
                    'DEVOLUCION_ALQUILER'
                );
            }

            // Actualizar estado (CREAR NUEVO REQUEST)
            const updateRequest = new sql.Request(pool);
            await updateRequest
                .input('alquilerId', sql.Int, alquilerId)
                .query(`
                    UPDATE Alquiler
                    SET Estado = 'FINALIZADO',
                        FechaFin = GETDATE()
                    WHERE Id_alquiler = @alquilerId
                `);

            // Bitácora (CREAR NUEVO REQUEST)
            const bitacoraRequest = new sql.Request(pool);
            await transactionService.logToBitacora(
                transaction,
                bitacoraRequest,
                'Alquiler',
                'UPDATE',
                alquilerId,
                userId
            );

            console.log(`✅ Alquiler ${alquilerId} finalizado`);

            return {
                alquilerId,
                itemsRestored: detallesData.recordset.length,
                status: 'FINALIZADO'
            };
        });
    }

    /**
     * Extender alquiler
     */
    async extenderAlquiler(alquilerId, diasAdicionales, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            console.log(`📅 Extendiendo alquiler ${alquilerId} por ${diasAdicionales} días`);

            const alquilerData = await request
                .input('alquilerId', sql.Int, alquilerId)
                .query('SELECT FechaFin, TotalAlquiler, Estado FROM Alquiler WHERE Id_alquiler = @alquilerId');

            if (alquilerData.recordset.length === 0) {
                throw new Error(`Alquiler ${alquilerId} no encontrado`);
            }

            const alquiler = alquilerData.recordset[0];

            if (alquiler.Estado !== 'ACTIVO') {
                throw new Error('Solo se pueden extender alquileres activos');
            }

            const nuevaFechaFin = new Date(alquiler.FechaFin);
            nuevaFechaFin.setDate(nuevaFechaFin.getDate() + diasAdicionales);

            // Calcular costo adicional (CREAR NUEVO REQUEST)
            const pool = transaction;
            const detallesRequest = new sql.Request(pool);
            const detallesData = await detallesRequest
                .input('alquilerId', sql.Int, alquilerId)
                .query(`
                    SELECT SUM(TarifaDiaria * CantidadDetalleAlquiler) as TotalDiario
                    FROM DetalleAlquiler
                    WHERE Id_alquiler = @alquilerId
                `);

            const costoAdicional = detallesData.recordset[0].TotalDiario * diasAdicionales;
            const nuevoTotal = alquiler.TotalAlquiler + costoAdicional;

            // Actualizar maestro (CREAR NUEVO REQUEST)
            const updateRequest = new sql.Request(pool);
            await updateRequest
                .input('alquilerId', sql.Int, alquilerId)
                .input('nuevaFechaFin', sql.DateTime, nuevaFechaFin)
                .input('nuevoTotal', sql.Decimal(10, 2), nuevoTotal)
                .query(`
                    UPDATE Alquiler
                    SET FechaFin = @nuevaFechaFin,
                        TotalAlquiler = @nuevoTotal
                    WHERE Id_alquiler = @alquilerId
                `);

            // Actualizar detalles (CREAR NUEVO REQUEST)
            const updateDetallesRequest = new sql.Request(pool);
            await updateDetallesRequest
                .input('alquilerId', sql.Int, alquilerId)
                .input('diasAdicionales', sql.Decimal(10, 2), diasAdicionales)
                .query(`
                    UPDATE DetalleAlquiler
                    SET DiasAlquilados = DiasAlquilados + @diasAdicionales,
                        Subtotal = (DiasAlquilados + @diasAdicionales) * TarifaDiaria * CantidadDetalleAlquiler
                    WHERE Id_alquiler = @alquilerId
                `);

            // Bitácora (CREAR NUEVO REQUEST)
            const bitacoraRequest = new sql.Request(pool);
            await transactionService.logToBitacora(
                transaction,
                bitacoraRequest,
                'Alquiler',
                'UPDATE',
                alquilerId,
                userId
            );

            console.log(`✅ Alquiler extendido hasta ${nuevaFechaFin.toISOString()}`);

            return {
                alquilerId,
                nuevaFechaFin,
                diasAdicionales,
                costoAdicional: parseFloat(costoAdicional.toFixed(2)),
                nuevoTotal: parseFloat(nuevoTotal.toFixed(2))
            };
        });
    }

    /**
     * Cancelar alquiler
     */
    async cancelarAlquiler(alquilerId, motivo, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            console.log(`❌ Cancelando alquiler ${alquilerId}`);

            const alquilerData = await request
                .input('alquilerId', sql.Int, alquilerId)
                .query('SELECT Estado FROM Alquiler WHERE Id_alquiler = @alquilerId');

            if (alquilerData.recordset.length === 0) {
                throw new Error(`Alquiler ${alquilerId} no encontrado`);
            }

            const alquiler = alquilerData.recordset[0];

            if (alquiler.Estado === 'FINALIZADO') {
                throw new Error('No se puede cancelar un alquiler finalizado');
            }

            if (alquiler.Estado === 'CANCELADO') {
                throw new Error('El alquiler ya está cancelado');
            }

            // Obtener detalles y devolver stock (CREAR NUEVO REQUEST)
            const pool = transaction;
            const detallesRequest = new sql.Request(pool);
            const detallesData = await detallesRequest
                .input('alquilerId', sql.Int, alquilerId)
                .query(`
                    SELECT Id_producto, CantidadDetalleAlquiler
                    FROM DetalleAlquiler
                    WHERE Id_alquiler = @alquilerId
                `);

            // Devolver stock (CREAR NUEVO REQUEST PARA CADA UNO)
            for (const detalle of detallesData.recordset) {
                const stockRequest = new sql.Request(pool);
                await transactionService.updateStock(
                    transaction,
                    stockRequest,
                    detalle.Id_producto,
                    detalle.CantidadDetalleAlquiler,
                    'CANCELACION_ALQUILER'
                );
            }

            // Actualizar estado (CREAR NUEVO REQUEST)
            const updateRequest = new sql.Request(pool);
            await updateRequest
                .input('alquilerId', sql.Int, alquilerId)
                .query(`
                    UPDATE Alquiler
                    SET Estado = 'CANCELADO'
                    WHERE Id_alquiler = @alquilerId
                `);

            // Bitácora (CREAR NUEVO REQUEST)
            const bitacoraRequest = new sql.Request(pool);
            await transactionService.logToBitacora(
                transaction,
                bitacoraRequest,
                'Alquiler',
                'UPDATE',
                alquilerId,
                userId
            );

            console.log(`✅ Alquiler ${alquilerId} cancelado`);

            return {
                alquilerId,
                itemsRestored: detallesData.recordset.length,
                status: 'CANCELADO',
                motivo
            };
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
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(`
                    SELECT 
                        a.*,
                        c.Nombre as ClienteNombre,
                        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
                        c.Telefono as ClienteTelefono,
                        col.Nombre + ' ' + col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorNombre,
                        DATEDIFF(day, GETDATE(), a.FechaFin) as DiasRestantes,
                        CASE 
                            WHEN DATEDIFF(day, GETDATE(), a.FechaFin) < 0 THEN 'VENCIDO'
                            WHEN DATEDIFF(day, GETDATE(), a.FechaFin) <= 2 THEN 'POR_VENCER'
                            ELSE 'VIGENTE'
                        END as EstadoVigencia
                    FROM Alquiler a
                    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
                    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
                    WHERE a.Estado = 'ACTIVO'
                    ORDER BY a.FechaFin ASC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `);

            const countResult = await pool.request()
                .query('SELECT COUNT(*) as total FROM Alquiler WHERE Estado = \'ACTIVO\'');

            const total = countResult.recordset[0].total;

            return {
                data: result.recordset,
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
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(`
                    SELECT 
                        a.*,
                        c.Nombre as ClienteNombre,
                        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
                        c.Telefono as ClienteTelefono,
                        c.Correo as ClienteEmail,
                        DATEDIFF(day, a.FechaFin, GETDATE()) as DiasVencidos
                    FROM Alquiler a
                    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
                    WHERE a.Estado = 'ACTIVO'
                    AND a.FechaFin < GETDATE()
                    ORDER BY DiasVencidos DESC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `);

            const countResult = await pool.request()
                .query('SELECT COUNT(*) as total FROM Alquiler WHERE Estado = \'ACTIVO\' AND FechaFin < GETDATE()');

            const total = countResult.recordset[0].total;

            return {
                data: result.recordset,
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
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as TotalAlquileres,
                    SUM(CASE WHEN Estado = 'ACTIVO' THEN 1 ELSE 0 END) as Activos,
                    SUM(CASE WHEN Estado = 'FINALIZADO' THEN 1 ELSE 0 END) as Finalizados,
                    SUM(CASE WHEN Estado = 'CANCELADO' THEN 1 ELSE 0 END) as Cancelados,
                    SUM(CASE WHEN Estado = 'ACTIVO' AND FechaFin < GETDATE() THEN 1 ELSE 0 END) as Vencidos,
                    ISNULL(SUM(TotalAlquiler), 0) as IngresoTotal,
                    ISNULL(AVG(TotalAlquiler), 0) as PromedioIngresos
                FROM Alquiler
            `);

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
                .input('clienteId', sql.Int, clienteId)
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(`
                    SELECT 
                        a.*,
                        col.Nombre + ' ' + col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorNombre,
                        COUNT(da.Id_detalleAlquiler) as TotalProductos
                    FROM Alquiler a
                    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
                    LEFT JOIN DetalleAlquiler da ON a.Id_alquiler = da.Id_alquiler
                    WHERE a.Id_cliente = @clienteId
                    GROUP BY 
                        a.Id_alquiler, a.FechaInicio, a.FechaFin, a.Estado, a.TotalAlquiler,
                        a.Id_cliente, a.Id_colaborador,
                        col.Nombre, col.Apellido1, col.Apellido2
                    ORDER BY a.FechaInicio DESC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `);

            const countResult = await pool.request()
                .input('clienteId', sql.Int, clienteId)
                .query('SELECT COUNT(*) as total FROM Alquiler WHERE Id_cliente = @clienteId');

            const total = countResult.recordset[0].total;

            return {
                data: result.recordset,
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