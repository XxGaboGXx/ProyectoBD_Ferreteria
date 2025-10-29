const BaseService = require('./baseService');
const { sql } = require('../config/database');

class ProductoService extends BaseService {
    constructor() {
        super('Producto', 'Id_Producto');
    }

    async getAll(page = 1, limit = 50, filters = {}) {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        let whereClause = '';
        let request = pool.request();

        if (Object.keys(filters).length > 0) {
            const conditions = [];
            Object.entries(filters).forEach(([key, value], index) => {
                const paramName = `filter${index}`;
                conditions.push(`p.${key} LIKE @${paramName}`);
                request.input(paramName, sql.VarChar, `%${value}%`);
            });
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }

        const countResult = await request.query(`
            SELECT COUNT(*) as total FROM Producto p ${whereClause}
        `);
        const total = countResult.recordset[0].total;

        request = pool.request();
        Object.entries(filters).forEach(([key, value], index) => {
            request.input(`filter${index}`, sql.VarChar, `%${value}%`);
        });

        const result = await request.query(`
            SELECT 
                p.*,
                c.Nombre as CategoriaNombre,
                c.Descripcion as CategoriaDescripcion
            FROM Producto p
            LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
            ${whereClause}
            ORDER BY p.Id_Producto DESC
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `);

        return {
            data: result.recordset,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getLowStock() {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request().query(`
            SELECT 
                p.*,
                c.Nombre as CategoriaNombre,
                (p.CantidadMinima - p.CantidadActual) as Faltante
            FROM Producto p
            LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
            WHERE p.CantidadActual <= p.CantidadMinima
            ORDER BY Faltante DESC
        `);

        return result.recordset;
    }

    async adjustStock(id, cantidad, motivo, userId = 'SYSTEM') {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // Actualizar stock
            await transaction.request()
                .input('id', sql.Int, id)
                .input('cantidad', sql.Int, cantidad)
                .query(`
                    UPDATE Producto 
                    SET CantidadActual = CantidadActual + @cantidad
                    WHERE Id_Producto = @id
                `);

            // Registrar movimiento
            const movResult = await transaction.request()
                .input('userId', sql.VarChar, userId)
                .query(`
                    INSERT INTO Movimiento (Fecha, Responsable, Id_colaborador)
                    OUTPUT INSERTED.Id_movimiento
                    VALUES (GETDATE(), @userId, 1)
                `);

            const movId = movResult.recordset[0].Id_movimiento;

            // Buscar tipo de movimiento de ajuste
            const tipoMov = await transaction.request().query(`
                SELECT TOP 1 Id_tipoDetalleMovimiento 
                FROM TipoDetalleMovimiento 
                WHERE Codigo = 'AJUSTE' OR Nombre LIKE '%AJUSTE%'
            `);

            const tipoMovId = tipoMov.recordset[0]?.Id_tipoDetalleMovimiento || 1;

            // Insertar detalle
            await transaction.request()
                .input('cantidad', sql.Int, cantidad)
                .input('descripcion', sql.VarChar, motivo)
                .input('tipoMovId', sql.Int, tipoMovId)
                .input('movId', sql.Int, movId)
                .input('prodId', sql.Int, id)
                .query(`
                    INSERT INTO DetalleMovimiento 
                    (Cantidad, Descripcion, Id_tipoDetalleMovimiento, Id_movimiento, Id_producto)
                    VALUES (@cantidad, @descripcion, @tipoMovId, @movId, @prodId)
                `);

            await transaction.commit();

            return {
                success: true,
                message: 'Stock ajustado correctamente',
                cantidad,
                motivo
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getMovimientos(id, limit = 20) {
        const { getConnection } = require('../config/database');
        const pool = await getConnection();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    dm.Cantidad,
                    dm.Descripcion,
                    m.Fecha,
                    tdm.Nombre as TipoMovimiento,
                    m.Responsable
                FROM DetalleMovimiento dm
                INNER JOIN Movimiento m ON dm.Id_movimiento = m.Id_movimiento
                INNER JOIN TipoDetalleMovimiento tdm ON dm.Id_tipoDetalleMovimiento = tdm.Id_tipoDetalleMovimiento
                WHERE dm.Id_producto = @id
                ORDER BY m.Fecha DESC
            `);

        return result.recordset;
    }
}

module.exports = new ProductoService();