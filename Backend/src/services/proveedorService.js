const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class ProveedorService extends BaseService {
    constructor() {
        super('Proveedor', 'Id_Proveedor');
    }

    /**
     * Obtener historial de compras al proveedor
     */
    async getHistorialCompras(proveedorId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('proveedorId', sql.Int, proveedorId)
            .query(`
                SELECT 
                    c.*,
                    col.Nombre as ColaboradorNombre,
                    col.Apellidos as ColaboradorApellidos
                FROM Compra c
                INNER JOIN Colaborador col ON c.Id_Colaborador = col.Id_Colaborador
                WHERE c.Id_Proveedor = @proveedorId
                ORDER BY c.Fecha DESC
            `);

        return result.recordset;
    }

    /**
     * Obtener productos del proveedor
     */
    async getProductos(proveedorId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('proveedorId', sql.Int, proveedorId)
            .query(`
                SELECT DISTINCT
                    p.*,
                    c.Nombre as CategoriaNombre
                FROM Producto p
                LEFT JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
                INNER JOIN Compra comp ON p.Id_Producto IN (
                    SELECT Id_Producto FROM Compra WHERE Id_Proveedor = @proveedorId
                )
                ORDER BY p.Nombre
            `);

        return result.recordset;
    }
}

module.exports = new ProveedorService();