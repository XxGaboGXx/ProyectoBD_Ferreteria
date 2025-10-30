const { getConnection, sql } = require('../config/database');
const transactionService = require('./transactionService');

/**
 * Nuevo BaseService que utiliza procedimientos almacenados (SP) genéricos.
 * - Reemplaza las consultas inline por llamadas a SP: sp_GetAllPaged, sp_GetById,
 *   sp_CreateRecord, sp_UpdateRecord, sp_DeleteRecord, sp_Search.
 *
 * NOTAS:
 * - Los procedimientos esperan arrays JSON (strings) para columnas y valores cuando aplicable.
 * - Este servicio preserva los nombres de métodos y firmas para no romper controladores.
 */
class BaseService {
    constructor(tableName, primaryKey = 'Id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    /**
     * Obtener todos los registros con paginación
     * page, limit, filters: filters is object { colName: value, ... }
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();

        // Convert filters to JSON arrays
        const columns = Object.keys(filters);
        const values = columns.map(col => filters[col]);

        const filterColumnsJson = columns.length > 0 ? JSON.stringify(columns) : null;
        const filterValuesJson = values.length > 0 ? JSON.stringify(values) : null;

        const request = pool.request()
            .input('tableName', sql.NVarChar(128), this.tableName)
            .input('primaryKey', sql.NVarChar(128), this.primaryKey)
            .input('page', sql.Int, page)
            .input('limit', sql.Int, limit)
            .input('filterColumns', sql.NVarChar(sql.MAX), filterColumnsJson)
            .input('filterValues', sql.NVarChar(sql.MAX), filterValuesJson);

        const result = await request.execute('dbo.sp_GetAllPaged');

        // sp_GetAllPaged returns two result sets: first -> Total (COUNT), second -> rows
        // Depending on mssql driver, result.recordsets[0] is first set (Total), recordsets[1] is rows
        const recordsets = result.recordsets || [];
        let total = 0;
        let rows = [];

        if (recordsets.length === 2) {
            total = recordsets[0][0] ? recordsets[0][0].Total : 0;
            rows = recordsets[1];
        } else if (recordsets.length === 1) {
            // Fallback: if only rows returned (no total), infer total = rows.length
            rows = recordsets[0];
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
     * Obtener un registro por ID
     */
    async getById(id) {
        const pool = await getConnection();

        const request = pool.request()
            .input('tableName', sql.NVarChar(128), this.tableName)
            .input('primaryKey', sql.NVarChar(128), this.primaryKey)
            .input('id', sql.NVarChar(sql.MAX), id);

        const result = await request.execute('dbo.sp_GetById');

        const rows = result.recordset || [];
        if (rows.length === 0) {
            throw new Error(`${this.tableName} con ID ${id} no encontrado`);
        }

        return rows[0];
    }

    /**
     * Crear un nuevo registro
     * data: object with column:value
     */
    async create(data) {
        return await transactionService.executeTransaction(async (transaction, request) => {
            // Prepare columns and values arrays as JSON strings
            const columns = Object.keys(data);
            const values = columns.map(col => data[col] === undefined || data[col] === null ? '' : String(data[col]));

            const spRequest = request // request is tied to transaction
                .input('tableName', sql.NVarChar(128), this.tableName)
                .input('columns', sql.NVarChar(sql.MAX), JSON.stringify(columns))
                .input('values', sql.NVarChar(sql.MAX), JSON.stringify(values))
                .input('primaryKey', sql.NVarChar(128), this.primaryKey);

            const result = await spRequest.execute('dbo.sp_CreateRecord');

            // sp_CreateRecord returns a resultset with inserted PK value (NewId)
            const inserted = result.recordset && result.recordset[0] ? Object.values(result.recordset[0])[0] : null;
            const newId = inserted ? inserted : null;

            // Registrar en bitácora (preservando tu lógica)
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

            const columns = Object.keys(data);
            const values = columns.map(col => data[col] === undefined || data[col] === null ? '' : String(data[col]));

            const spRequest = request
                .input('tableName', sql.NVarChar(128), this.tableName)
                .input('primaryKey', sql.NVarChar(128), this.primaryKey)
                .input('id', sql.NVarChar(sql.MAX), id)
                .input('columns', sql.NVarChar(sql.MAX), JSON.stringify(columns))
                .input('values', sql.NVarChar(sql.MAX), JSON.stringify(values));

            await spRequest.execute('dbo.sp_UpdateRecord');

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

            const spRequest = request
                .input('tableName', sql.NVarChar(128), this.tableName)
                .input('primaryKey', sql.NVarChar(128), this.primaryKey)
                .input('id', sql.NVarChar(sql.MAX), id);

            await spRequest.execute('dbo.sp_DeleteRecord');

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
     * criteria: object { colName: value, ... }
     */
    async search(criteria) {
        const pool = await getConnection();

        const columns = Object.keys(criteria);
        const values = columns.map(col => criteria[col]);

        const request = pool.request()
            .input('tableName', sql.NVarChar(128), this.tableName)
            .input('primaryKey', sql.NVarChar(128), this.primaryKey)
            .input('filterColumns', sql.NVarChar(sql.MAX), JSON.stringify(columns))
            .input('filterValues', sql.NVarChar(sql.MAX), JSON.stringify(values));

        const result = await request.execute('dbo.sp_Search');

        return result.recordset || [];
    }
}

module.exports = BaseService;