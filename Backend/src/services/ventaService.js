const { getConnection, sql } = require('../config/database');

class VentaService {
    /**
     * Obtener todas las ventas con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        const request = pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .input('estado', sql.VarChar, filters.estado || null)
            .input('fechaInicio', sql.DateTime, filters.fechaInicio || null)
            .input('fechaFin', sql.DateTime, filters.fechaFin || null)
            .input('clienteId', sql.Int, filters.clienteId || null);

        // Obtener filas paginadas
        const result = await request.execute('dbo.sp_GetVentasPaged');

        // Contar total separado (se hace en otro SP)
        const countReq = pool.request()
            .input('estado', sql.VarChar, filters.estado || null)
            .input('fechaInicio', sql.DateTime, filters.fechaInicio || null)
            .input('fechaFin', sql.DateTime, filters.fechaFin || null)
            .input('clienteId', sql.Int, filters.clienteId || null);

        const countResult = await countReq.execute('dbo.sp_GetVentasCount');
        const total = (countResult.recordset && countResult.recordset[0]) ? countResult.recordset[0].total : 0;

        return {
            data: result.recordset || [],
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

        const result = await pool.request()
            .input('id', sql.Int, id)
            .execute('dbo.sp_GetVentaById');

        if (!result.recordset || result.recordset.length === 0) return null;

        const venta = result.recordset[0];

        const detallesRes = await pool.request()
            .input('ventaId', sql.Int, id)
            .execute('dbo.sp_GetDetallesByVentaId');

        venta.detalles = detallesRes.recordset || [];

        return venta;
    }

    /**
     * Crear nueva venta
     */
    async create(data) {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // Calcular total
            let totalVenta = 0;
            data.detalles.forEach(detalle => {
                totalVenta += detalle.cantidad * detalle.precioUnitario;
            });

            // Insertar venta mediante SP y obtener Id
            const ventaResult = await transaction.request()
                .input('fecha', sql.DateTime, data.fecha || new Date())
                .input('total', sql.Decimal(12, 2), totalVenta)
                .input('metodoPago', sql.VarChar, data.metodoPago)
                .input('estado', sql.VarChar, 'Completada')
                .input('clienteId', sql.Int, data.clienteId)
                .input('colaboradorId', sql.Int, data.colaboradorId)
                .output('newId', sql.Int)
                .execute('dbo.sp_CreateVenta');

            const ventaId = ventaResult.output ? ventaResult.output.newId : null;

            if (!ventaId) {
                throw new Error('No se pudo insertar la venta');
            }

            // Insertar detalles y actualizar stock usando SPs
            for (let i = 0; i < data.detalles.length; i++) {
                const detalle = data.detalles[i];
                const subtotal = detalle.cantidad * detalle.precioUnitario;

                // Validar existencia y stock mediante sp_GetProductoById (ya definido en transactionService SPs)
                const stockCheck = await transaction.request()
                    .input('productId', sql.Int, detalle.productoId)
                    .execute('dbo.sp_GetProductoById');

                if (!stockCheck.recordset || stockCheck.recordset.length === 0) {
                    throw new Error(`Producto ${detalle.productoId} no encontrado`);
                }

                const stockActual = stockCheck.recordset[0].CantidadActual || 0;
                const nombreProducto = stockCheck.recordset[0].Nombre || `Id ${detalle.productoId}`;

                if (stockActual < detalle.cantidad) {
                    throw new Error(`Stock insuficiente para ${nombreProducto}. Disponible: ${stockActual}, Solicitado: ${detalle.cantidad}`);
                }

                // Insertar detalle via SP
                await transaction.request()
                    .input('cantidad', sql.Int, detalle.cantidad)
                    .input('numeroLinea', sql.Int, i + 1)
                    .input('precio', sql.Decimal(12, 2), detalle.precioUnitario)
                    .input('subtotal', sql.Decimal(12, 2), subtotal)
                    .input('ventaId', sql.Int, ventaId)
                    .input('productoId', sql.Int, detalle.productoId)
                    .execute('dbo.sp_InsertDetalleVenta');

                // Actualizar stock: usar sp_UpdateStock (debe existir, creado con TransactionService conversion)
                await transaction.request()
                    .input('productId', sql.Int, detalle.productoId)
                    .input('change', sql.Int, -detalle.cantidad)
                    .input('movType', sql.NVarChar, 'VENTA')
                    .input('quantity', sql.Int, detalle.cantidad)
                    .execute('dbo.sp_UpdateStock');
            }

            await transaction.commit();

            return await this.getById(ventaId);

        } catch (error) {
            try {
                await transaction.rollback();
            } catch (rbErr) {
                // noop
            }
            throw error;
        }
    }

    /**
     * Cancelar venta
     */
    async cancelarVenta(id, motivo) {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // Obtener venta y detalles
            const venta = await this.getById(id);

            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            if (venta.Estado === 'Cancelada') {
                throw new Error('La venta ya está cancelada');
            }

            // Actualizar estado mediante SP
            await transaction.request()
                .input('ventaId', sql.Int, id)
                .execute('dbo.sp_CancelVenta');

            // Devolver stock para cada detalle (usar sp_UpdateStock)
            for (const detalle of venta.detalles) {
                await transaction.request()
                    .input('productId', sql.Int, detalle.Id_Producto)
                    .input('change', sql.Int, detalle.CantidadVenta) // suma al stock
                    .input('movType', sql.NVarChar, 'DEVOLUCION_VENTA')
                    .input('quantity', sql.Int, detalle.CantidadVenta)
                    .execute('dbo.sp_UpdateStock');
            }

            await transaction.commit();

            return {
                id,
                estado: 'Cancelada',
                motivo,
                message: 'Venta cancelada y stock devuelto exitosamente'
            };
        } catch (error) {
            try {
                await transaction.rollback();
            } catch (rbErr) {
                // noop
            }
            throw error;
        }
    }
}

module.exports = new VentaService();