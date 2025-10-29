const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class ClienteService extends BaseService {
    constructor() {
        super('Cliente', 'Id_Cliente');
    }

    /**
     * Buscar cliente por cédula
     */
    async getByCedula(cedula) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('cedula', sql.VarChar, cedula)
            .execute('dbo.sp_GetClienteByCedula');

        const rows = result.recordset || [];
        if (rows.length === 0) {
            throw new Error(`Cliente con cédula ${cedula} no encontrado`);
        }

        return rows[0];
    }

    /**
     * Obtener historial de compras del cliente
     */
    async getHistorialCompras(clienteId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .execute('dbo.sp_GetHistorialComprasByClienteId');

        return result.recordset || [];
    }

    /**
     * Obtener estadísticas del cliente
     */
    async getEstadisticas(clienteId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .execute('dbo.sp_GetEstadisticasCliente');

        const row = (result.recordset && result.recordset[0]) ? result.recordset[0] : null;
        return row;
    }
}

module.exports = new ClienteService();