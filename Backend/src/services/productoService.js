const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class ProductoService extends BaseService {
    constructor() {
        super('Producto', 'Id_Producto');
    }

    /**
     * Obtener listado paginado de productos (ahora via SP: dbo.sp_GetProductosPaged)
     * Mantengo la firma original: getAll(page, limit, filters)
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();

        const columns = Object.keys(filters);
        const values = columns.map(col => filters[col]);

        const filterColumnsJson = columns.length > 0 ? JSON.stringify(columns) : null;
        const filterValuesJson = values.length > 0 ? JSON.stringify(values) : null;

        const request = pool.request()
            .input('page', sql.Int, page)
            .input('limit', sql.Int, limit)
            .input('filterColumns', sql.NVarChar(sql.MAX), filterColumnsJson)
            .input('filterValues', sql.NVarChar(sql.MAX), filterValuesJson);

        const result = await request.execute('dbo.sp_GetProductosPaged');

        // sp_GetProductosPaged returns two resultsets: [0] => total, [1] => rows
        const recordsets = result.recordsets || [];
        let total = 0;
        let rows = [];

        if (recordsets.length === 2) {
            total = recordsets[0] && recordsets[0][0] ? recordsets[0][0].Total : 0;
            rows = recordsets[1] || [];
        } else if (recordsets.length === 1) {
            rows = recordsets[0] || [];
            total = rows.length;
        }

        return {
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener productos con stock bajo (SP: dbo.sp_GetLowStockProducts)
     */
    async getLowStock() {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.sp_GetLowStockProducts');
        return result.recordset || [];
    }

    /**
     * Ajustar stock (ahora usa SP: dbo.sp_AdjustStock)
     * Preservo la lógica transaccional (se abre transaction en el service)
     */
    async adjustStock(id, cantidad, motivo, userId = 'SYSTEM') {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            const request = transaction.request();

            // Llamada al SP que realiza: UPDATE Producto, INSERT Movimiento (devuelve movId), INSERT DetalleMovimiento
            const execResult = await request
                .input('prodId', sql.Int, id)
                .input('cantidad', sql.Int, cantidad)
                .input('descripcion', sql.NVarChar(4000), motivo)
                .input('userId', sql.NVarChar(200), userId)
                .input('tipoMovCode', sql.NVarChar(100), null)
                .output('movId', sql.Int)
                .execute('dbo.sp_AdjustStock');

            const movId = execResult.output ? execResult.output.movId : null;

            await transaction.commit();

            return {
                success: true,
                message: 'Stock ajustado correctamente',
                cantidad,
                motivo,
                movId
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

    /**
     * Obtener movimientos de un producto (SP: dbo.sp_GetMovimientosByProducto)
     */
    async getMovimientos(id, limit = 20) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('prodId', sql.Int, id)
            .input('limit', sql.Int, limit)
            .execute('dbo.sp_GetMovimientosByProducto');

        return result.recordset || [];
    }
}

module.exports = new ProductoService();