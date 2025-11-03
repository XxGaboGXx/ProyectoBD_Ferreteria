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
                const paramName = `param${index}`;
                conditions.push(`${key} LIKE @${paramName}`);
                request.input(paramName, sql.VarChar, `%${value}%`);
            });
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        // Obtener total de registros
        const countResult = await request.query(`
            SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}
        `);
        const total = countResult.recordset[0].total;

        // Obtener registros paginados
        request = pool.request();
        Object.entries(filters).forEach(([key, value], index) => {
            request.input(`param${index}`, sql.VarChar, `%${value}%`);
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
                page,
                limit,
                total,
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
        /**
     * Crear un nuevo registro
     */
    async create(data) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // ✅ ELIMINAR la columna de ID (primaryKey) del objeto data
            const { [this.primaryKey]: removedId, ...cleanData } = data;
            
            const columns = Object.keys(cleanData);
            const values = columns.map(col => `@${col}`);
            
            console.log('📦 Creando registro en', this.tableName);
            console.log('🔑 Columnas a insertar:', columns);
            
            // Agregar inputs con tipos explícitos
            columns.forEach((col) => {
                const value = cleanData[col];
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        request.input(col, sql.Int, value);
                    } else {
                        request.input(col, sql.Decimal(12, 2), value);
                    }
                } else if (typeof value === 'string') {
                    request.input(col, sql.VarChar, value);
                } else if (value instanceof Date) {
                    request.input(col, sql.DateTime, value);
                } else if (value === null || value === undefined) {
                    request.input(col, sql.VarChar, null);
                } else {
                    request.input(col, value);
                }
            });
            
            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                OUTPUT INSERTED.*
                VALUES (${values.join(', ')})
            `;
            
            const result = await request.query(query);
            const newRecord = result.recordset[0];
            
            // 📝 Registrar en bitácora si es tabla Producto
            if (this.tableName === 'Producto') {
                const bitacoraRequest = new sql.Request(transaction);
                await transactionService.logToBitacora(
                    transaction,
                    bitacoraRequest,
                    this.tableName,
                    'INSERT',
                    newRecord[this.primaryKey],
                    `Producto creado: ${newRecord.Nombre || 'Sin nombre'}`,
                    { 
                        CantidadActual: newRecord.CantidadActual,
                        PrecioCompra: newRecord.PrecioCompra,
                        PrecioVenta: newRecord.PrecioVenta
                    }
                );
            }
            
            console.log(`✅ ${this.tableName} creado con ID: ${newRecord[this.primaryKey]}`);
            
            return newRecord;
        });
    }

    /**
     * Actualizar un registro
     */
    async update(id, data) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            const columns = Object.keys(data);
            const setClause = columns.map(col => `${col} = @${col}`).join(', ');
            
            console.log('📝 Actualizando registro en', this.tableName, 'ID:', id);
            
            // Agregar inputs
            request.input('id', sql.Int, id);
            columns.forEach((col) => {
                const value = data[col];
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        request.input(col, sql.Int, value);
                    } else {
                        request.input(col, sql.Decimal(12, 2), value);
                    }
                } else if (typeof value === 'string') {
                    request.input(col, sql.VarChar, value);
                } else if (value instanceof Date) {
                    request.input(col, sql.DateTime, value);
                } else {
                    request.input(col, value);
                }
            });
            
            const query = `
                UPDATE ${this.tableName} 
                SET ${setClause}
                OUTPUT INSERTED.*
                WHERE ${this.primaryKey} = @id
            `;
            
            const result = await request.query(query);
            
            if (result.recordset.length === 0) {
                throw new Error(`${this.tableName} con ID ${id} no encontrado`);
            }
            
            const updatedRecord = result.recordset[0];
            
            // 📝 Registrar en bitácora si es tabla Producto
            if (this.tableName === 'Producto') {
                await transactionService.logToBitacora(
                    transaction,
                    request,
                    this.tableName,
                    'UPDATE',
                    id,
                    `Producto actualizado: ${updatedRecord.Nombre || 'Sin nombre'}`,
                    data
                );
            }
            
            console.log(`✅ ${this.tableName} ID ${id} actualizado`);
            
            return updatedRecord;
        });
    }

    /**
     * Eliminar un registro
     */
    async delete(id) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            console.log('🗑️  Eliminando registro de', this.tableName, 'ID:', id);
            
            request.input('id', sql.Int, id);
            
            const result = await request.query(`
                DELETE FROM ${this.tableName} 
                OUTPUT DELETED.*
                WHERE ${this.primaryKey} = @id
            `);
            
            if (result.recordset.length === 0) {
                throw new Error(`${this.tableName} con ID ${id} no encontrado`);
            }
            
            const deletedRecord = result.recordset[0];
            
            // 📝 Registrar en bitácora si es tabla Producto
            if (this.tableName === 'Producto') {
                await transactionService.logToBitacora(
                    transaction,
                    request,
                    this.tableName,
                    'DELETE',
                    id,
                    `Producto eliminado: ${deletedRecord.Nombre || 'Sin nombre'}`,
                    { 
                        CantidadActual: deletedRecord.CantidadActual,
                        PrecioVenta: deletedRecord.PrecioVenta
                    }
                );
            }
            
            console.log(`✅ ${this.tableName} ID ${id} eliminado`);
            
            return { success: true, deleted: deletedRecord };
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
            const paramName = `param${index}`;
            conditions.push(`${key} LIKE @${paramName}`);
            request.input(paramName, sql.VarChar, `%${value}%`);
        });
        
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        
        const result = await request.query(`
            SELECT * FROM ${this.tableName}
            ${whereClause}
            ORDER BY ${this.primaryKey} DESC
        `);
        
        return result.recordset;
    }
}

module.exports = BaseService;