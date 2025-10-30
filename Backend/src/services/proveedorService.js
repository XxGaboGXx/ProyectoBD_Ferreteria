const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class ProveedorService extends BaseService {
    constructor() {
        super('Proveedor', 'Id_Proveedor');
    }

    /**
     * Obtener historial de compras al proveedor
     * Ahora usa el procedimiento almacenado dbo.sp_GetHistorialComprasProveedor
     */
    async getHistorialCompras(proveedorId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('proveedorId', sql.Int, proveedorId)
            .execute('dbo.sp_GetHistorialComprasProveedor');

        return result.recordset || [];
    }

    /**
     * Obtener productos del proveedor
     * Ahora usa el procedimiento almacenado dbo.sp_GetProductosByProveedor
     */
    async getProductos(proveedorId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('proveedorId', sql.Int, proveedorId)
            .execute('dbo.sp_GetProductosByProveedor');

        return result.recordset || [];
    }
}

module.exports = new ProveedorService();