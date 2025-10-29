const transactionService = require('./transactionService');
const { sql } = require('../config/database');

class CompraService {
    /**
     * Crear una nueva compra (ahora usa sp_CreateCompra)
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

            // Ejecutar SP para insertar la compra y obtener Id por OUTPUT
            const compraResult = await request
                .input('proveedorId', sql.Int, compraData.Id_Proveedor)
                .input('colaboradorId', sql.Int, compraData.Id_Colaborador)
                .input('productoId', sql.Int, compraData.Id_Producto)
                .input('cantidad', sql.Int, compraData.Cantidad)
                .input('precioUnitario', sql.Decimal(10, 2), compraData.PrecioUnitario)
                .input('total', sql.Decimal(10, 2), total)
                .output('newId', sql.Int)
                .execute('dbo.sp_CreateCompra');

            const compraId = compraResult.output.newId;

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
     * Obtener detalles de una compra (usa sp_GetCompraDetailsById)
     */
    async getCompraDetails(compraId) {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request()
            .input('compraId', sql.Int, compraId)
            .execute('dbo.sp_GetCompraDetailsById');

        if (!result.recordset || result.recordset.length === 0) {
            throw new Error(`Compra ${compraId} no encontrada`);
        }

        return result.recordset[0];
    }
}

module.exports = new CompraService();