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
            .query(`SELECT * FROM Cliente WHERE Cedula = @cedula`);

        if (result.recordset.length === 0) {
            throw new Error(`Cliente con cédula ${cedula} no encontrado`);
        }

        return result.recordset[0];
    }

    /**
     * Obtener historial de compras del cliente
     */
    async getHistorialCompras(clienteId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT 
                    v.*,
                    col.Nombre as ColaboradorNombre,
                    col.Apellidos as ColaboradorApellidos,
                    COUNT(dv.Id_DetalleVenta) as TotalProductos
                FROM Venta v
                INNER JOIN Colaborador col ON v.Id_Colaborador = col.Id_Colaborador
                LEFT JOIN DetalleVenta dv ON v.Id_Venta = dv.Id_Venta
                WHERE v.Id_Cliente = @clienteId
                GROUP BY v.Id_Venta, v.Id_Cliente, v.Id_Colaborador, v.Subtotal, 
                         v.Descuento, v.Impuesto, v.Total, v.MetodoPago, v.Fecha, 
                         v.Estado, col.Nombre, col.Apellidos
                ORDER BY v.Fecha DESC
            `);

        return result.recordset;
    }

    /**
     * Obtener estadísticas del cliente
     */
    async getEstadisticas(clienteId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT 
                    COUNT(v.Id_Venta) as TotalCompras,
                    SUM(v.Total) as TotalGastado,
                    AVG(v.Total) as PromedioCompra,
                    MAX(v.Fecha) as UltimaCompra,
                    MIN(v.Fecha) as PrimeraCompra
                FROM Venta v
                WHERE v.Id_Cliente = @clienteId
                AND v.Estado = 'COMPLETADA'
            `);

        return result.recordset[0];
    }
}

module.exports = new ClienteService();