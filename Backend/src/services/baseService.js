const { getConnection, sql } = require('../config/database');
const transactionService = require('./transactionService');

class BaseService {
    constructor(tableName, primaryKey = 'Id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    /**
     * Obtener todos los registros con paginación
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        // Construir WHERE clause si hay filtros
        let whereClause = '';
        let request = pool.request();

        if (Object.keys(filters).length > 0) {
            const conditions = [];
            Object.entries(filters).forEach(([key, value], index) => {
                const paramName = `filter${index}`;
                conditions.push(`${key} LIKE @${paramName}`);
                request.input(paramName, sql.VarChar, `%${value}%`);
            });
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }

        // Obtener total de registros
        const countResult = await request.query(`
            SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}
        `);
        const total = countResult.recordset[0].total;

        // Obtener registros paginados
        request = pool.request();
        Object.entries(filters).forEach(([key, value], index) => {
            request.input(`filter${index}`, sql.VarChar, `%${value}%`);
        });

        const result = await request.query(`
            SELECT * FROM ${this.tableName} 
            ${whereClause}
            ORDER BY ${this.primaryKey} DESC
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

    /**
     * Obtener un registro por ID
     */
    async getById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = @id`);

        if (result.recordset.length === 0) {
            throw new Error(`${this.tableName} con ID ${id} no encontrado`);
        }

        return result.recordset[0];
    }

    /**
     * Crear un nuevo registro
     */
    async create(data) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // Construir columnas y valores
            const columns = Object.keys(data);
            const values = columns.map(col => `@${col}`);

            // Agregar inputs
            columns.forEach(col => {
                request.input(col, data[col]);
            });

            // Ejecutar INSERT
            const result = await request.query(`
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                OUTPUT INSERTED.${this.primaryKey}
                VALUES (${values.join(', ')})
            `);

            const newId = result.recordset[0][this.primaryKey];

            // Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                this.tableName,
                'INSERT',
                newId
            );

            return await this.getById(newId);
        });
    }

    /**
     * Actualizar un registro
     */
    async update(id, data) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // Verificar que existe
            await this.getById(id);

            // Construir SET clause
            const setClause = Object.keys(data)
                .map(col => `${col} = @${col}`)
                .join(', ');

            // Agregar inputs
            request.input('id', sql.Int, id);
            Object.keys(data).forEach(col => {
                request.input(col, data[col]);
            });

            // Ejecutar UPDATE
            await request.query(`
                UPDATE ${this.tableName}
                SET ${setClause}
                WHERE ${this.primaryKey} = @id
            `);

            // Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                this.tableName,
                'UPDATE',
                id
            );

            return await this.getById(id);
        });
    }

    /**
     * Eliminar un registro
     */
    async delete(id) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // Verificar que existe
            const record = await this.getById(id);

            request.input('id', sql.Int, id);

            // Ejecutar DELETE
            await request.query(`
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = @id
            `);

            // Registrar en bitácora
            await transactionService.logToBitacora(
                transaction,
                request,
                this.tableName,
                'DELETE',
                id
            );

            return record;
        });
    }

    /**
     * Búsqueda por múltiples criterios
     */
    async search(criteria) {
        const pool = await getConnection();
        const request = pool.request();
        
        const conditions = [];
        Object.entries(criteria).forEach(([key, value], index) => {
            const paramName = `search${index}`;
            conditions.push(`${key} LIKE @${paramName}`);
            request.input(paramName, sql.VarChar, `%${value}%`);
        });

        const result = await request.query(`
            SELECT * FROM ${this.tableName}
            WHERE ${conditions.join(' AND ')}
            ORDER BY ${this.primaryKey} DESC
        `);

        return result.recordset;
    }
}

module.exports = BaseService;