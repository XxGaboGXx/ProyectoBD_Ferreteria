const transactionService = require('./transactionService');
const { sql } = require('../config/database');
const { constants } = require('../config');

class VentaService {
    /**
     * Crear una nueva venta con sus detalles
     */
    async createVenta(ventaData) {
        // Validar datos
        transactionService.validateTransactionData(ventaData, [
            'Id_Cliente',
            'Id_Colaborador',
            'items' // Array de productos
        ]);

        if (!Array.isArray(ventaData.items) || ventaData.items.length === 0) {
            throw new Error('Debe incluir al menos un producto en la venta');
        }

        return await transactionService.executeWithRetry(async (transaction, request) => {
            // 1. Validar stock de todos los productos
            for (const item of ventaData.items) {
                await transactionService.validateStock(
                    transaction, 
                    request, 
                    item.Id_Producto, 
                    item.Cantidad
                );
            }

            // 2. Calcular totales
            const totales = transactionService.calculateTotals(
                ventaData.items.map(item => ({
                    precio: item.PrecioUnitario,
                    cantidad: item.Cantidad,
                    descuento: item.Descuento || 0
                }))
            );

            // 3. Insertar venta
            const ventaResult = await request
                .input('clienteId', sql.Int, ventaData.Id_Cliente)
                .input('colaboradorId', sql.Int, ventaData.Id_Colaborador)
                .input('subtotal', sql.Decimal(10, 2), totales.subtotal)
                .input('descuento', sql.Decimal(10, 2), totales.descuento)
                .input('impuesto', sql.Decimal(10, 2), totales.impuesto)
                .input('total', sql.Decimal(10, 2), totales.total)
                .input('metodoPago', sql.VarChar, ventaData.MetodoPago || 'EFECTIVO')
                .query(`
                    INSERT INTO Venta 
                    (Id_Cliente, Id_Colaborador, Subtotal, Descuento, Impuesto, Total, MetodoPago, Fecha, Estado)
                    OUTPUT INSERTED.Id_Venta
                    VALUES 
                    (@clienteId, @colaboradorId, @subtotal, @descuento, @impuesto, @total, @metodoPago, GETDATE(), 'COMPLETADA')
                `);

            const ventaId = ventaResult.recordset[0].Id_Venta;
            console.log(`✅ Venta creada con ID: ${ventaId}`);

            // 4. Insertar detalles y actualizar stock
            const alerts = [];
            for (const item of ventaData.items) {
                // Insertar detalle
                await request
                    .input('ventaId', sql.Int, ventaId)
                    .input('productoId', sql.Int, item.Id_Producto)
                    .input('cantidad', sql.Int, item.Cantidad)
                    .input('precioUnitario', sql.Decimal(10, 2), item.PrecioUnitario)
                    .input('descuentoItem', sql.Decimal(10, 2), item.Descuento || 0)
                    .input('subtotalItem', sql.Decimal(10, 2), item.PrecioUnitario * item.Cantidad)
                    .query(`
                        INSERT INTO DetalleVenta 
                        (Id_Venta, Id_Producto, Cantidad, PrecioUnitario, Descuento, Subtotal)
                        VALUES 
                        (@ventaId, @productoId, @cantidad, @precioUnitario, @descuentoItem, @subtotalItem)
                    `);

                // Actualizar stock (restar cantidad)
                await transactionService.updateStock(
                    transaction,
                    request,
                    item.Id_Producto,
                    -item.Cantidad, // Negativo porque es una salida
                    'SALIDA'
                );

                // Verificar alertas de stock
                const alert = await transactionService.checkStockAlerts(
                    transaction,
                    request,
                    item.Id_Producto
                );
                
                if (alert.alert) {
                    alerts.push(alert.product);
                }
            }

            // 5. Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                'Venta',
                'INSERT',
                ventaId,
                ventaData.Id_Colaborador
            );

            return {
                ventaId,
                totales,
                items: ventaData.items.length,
                alerts: alerts.length > 0 ? alerts : null
            };
        });
    }

    /**
     * Cancelar una venta (devolver stock)
     */
    async cancelVenta(ventaId, userId) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // 1. Obtener detalles de la venta
            const detalles = await request
                .input('ventaId', sql.Int, ventaId)
                .query(`
                    SELECT Id_Producto, Cantidad
                    FROM DetalleVenta
                    WHERE Id_Venta = @ventaId
                `);

            if (detalles.recordset.length === 0) {
                throw new Error(`Venta ${ventaId} no encontrada o sin detalles`);
            }

            // 2. Devolver stock
            for (const detalle of detalles.recordset) {
                await transactionService.updateStock(
                    transaction,
                    request,
                    detalle.Id_Producto,
                    detalle.Cantidad, // Positivo porque devolvemos
                    'ENTRADA'
                );
            }

            // 3. Actualizar estado de la venta
            await request.query(`
                UPDATE Venta
                SET Estado = 'CANCELADA',
                    FechaActualizacion = GETDATE()
                WHERE Id_Venta = @ventaId
            `);

            // 4. Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                'Venta',
                'UPDATE',
                ventaId,
                userId
            );

            console.log(`✅ Venta ${ventaId} cancelada y stock devuelto`);

            return {
                ventaId,
                itemsRestored: detalles.recordset.length,
                status: 'CANCELADA'
            };
        });
    }

    /**
     * Obtener detalles de una venta
     */
    async getVentaDetails(ventaId) {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request()
            .input('ventaId', sql.Int, ventaId)
            .query(`
                SELECT 
                    v.*,
                    c.Nombre as ClienteNombre,
                    c.Apellidos as ClienteApellidos,
                    col.Nombre as ColaboradorNombre,
                    col.Apellidos as ColaboradorApellidos
                FROM Venta v
                INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
                INNER JOIN Colaborador col ON v.Id_Colaborador = col.Id_Colaborador
                WHERE v.Id_Venta = @ventaId
            `);

        if (result.recordset.length === 0) {
            throw new Error(`Venta ${ventaId} no encontrada`);
        }

        const venta = result.recordset[0];

        // Obtener detalles
        const detalles = await pool.request()
            .input('ventaId', sql.Int, ventaId)
            .query(`
                SELECT 
                    dv.*,
                    p.Nombre as ProductoNombre,
                    p.CantidadActual as StockActual
                FROM DetalleVenta dv
                INNER JOIN Producto p ON dv.Id_Producto = p.Id_Producto
                WHERE dv.Id_Venta = @ventaId
            `);

        return {
            ...venta,
            items: detalles.recordset
        };
    }
}

module.exports = new VentaService();