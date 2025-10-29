const transactionService = require('./transactionService');
const { sql } = require('../config/database');

class CompraService {
    /**
     * Crear una nueva compra
     */
    async createCompra(compraData) {
        transactionService.validateTransactionData(compraData, [
            'Id_Proveedor',
            'Id_Colaborador',
            'Id_Producto',
            'Cantidad',
            'PrecioUnitario'
        ]);

        return await transactionService.executeWithRetry(async (transaction, request) => {
            const total = compraData.Cantidad * compraData.PrecioUnitario;

            // Insertar compra
            const compraResult = await request
                .input('proveedorId', sql.Int, compraData.Id_Proveedor)
                .input('colaboradorId', sql.Int, compraData.Id_Colaborador)
                .input('productoId', sql.Int, compraData.Id_Producto)
                .input('cantidad', sql.Int, compraData.Cantidad)
                .input('precioUnitario', sql.Decimal(10, 2), compraData.PrecioUnitario)
                .input('total', sql.Decimal(10, 2), total)
                .query(`
                    INSERT INTO Compra 
                    (Id_Proveedor, Id_Colaborador, Id_Producto, Cantidad, PrecioUnitario, Total, Fecha, Estado)
                    OUTPUT INSERTED.Id_Compra
                    VALUES 
                    (@proveedorId, @colaboradorId, @productoId, @cantidad, @precioUnitario, @total, GETDATE(), 'COMPLETADA')
                `);

            const compraId = compraResult.recordset[0].Id_Compra;

            // Actualizar stock (agregar cantidad)
            await transactionService.updateStock(
                transaction,
                request,
                compraData.Id_Producto,
                compraData.Cantidad,
                'ENTRADA'
            );

            // Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                'Compra',
                'INSERT',
                compraId,
                compraData.Id_Colaborador
            );

            return {
                compraId,
                total,
                cantidad: compraData.Cantidad
            };
        });
    }

    /**
     * Obtener detalles de una compra
     */
    async getCompraDetails(compraId) {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request()
            .input('compraId', sql.Int, compraId)
            .query(`
                SELECT 
                    c.*,
                    p.Nombre as ProductoNombre,
                    prov.Nombre as ProveedorNombre,
                    col.Nombre as ColaboradorNombre,
                    col.Apellidos as ColaboradorApellidos
                FROM Compra c
                INNER JOIN Producto p ON c.Id_Producto = p.Id_Producto
                INNER JOIN Proveedor prov ON c.Id_Proveedor = prov.Id_Proveedor
                INNER JOIN Colaborador col ON c.Id_Colaborador = col.Id_Colaborador
                WHERE c.Id_Compra = @compraId
            `);

        if (result.recordset.length === 0) {
            throw new Error(`Compra ${compraId} no encontrada`);
        }

        return result.recordset[0];
    }
}

module.exports = new CompraService();