const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class ClienteService extends BaseService {
    constructor() {
        super('Cliente', 'Id_cliente');
    }

    /**
     * Buscar cliente por cédula
     */
    async getByCedula(cedula) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('cedula', sql.VarChar, cedula)
            .query(`
                SELECT * FROM Cliente 
                WHERE Cedula = @cedula 
                AND Activo = 1
            `);

        if (result.recordset.length === 0) {
            throw new Error(`Cliente con cédula ${cedula} no encontrado o inactivo`);
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
                    col.Apellido1 as ColaboradorApellido1,
                    COUNT(dv.Id_detalleVenta) as TotalProductos
                FROM Venta v
                INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
                LEFT JOIN DetalleVenta dv ON v.Id_venta = dv.Id_venta
                WHERE v.Id_cliente = @clienteId
                GROUP BY v.Id_venta, v.Id_cliente, v.Id_colaborador, v.Subtotal, 
                         v.Descuento, v.Impuesto, v.Total, v.MetodoPago, v.Fecha, 
                         v.Estado, col.Nombre, col.Apellido1
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
                    COUNT(v.Id_venta) as TotalCompras,
                    ISNULL(SUM(v.Total), 0) as TotalGastado,
                    ISNULL(AVG(v.Total), 0) as PromedioCompra,
                    MAX(v.Fecha) as UltimaCompra,
                    MIN(v.Fecha) as PrimeraCompra,
                    (SELECT COUNT(*) FROM Alquiler WHERE Id_cliente = @clienteId) as TotalAlquileres
                FROM Venta v
                WHERE v.Id_cliente = @clienteId
                AND v.Estado = 'COMPLETADA'
            `);

        return result.recordset[0];
    }

    /**
     * Eliminar cliente (eliminación lógica si tiene referencias)
     */
    async delete(id) {
        const pool = await getConnection();
        
        try {
            // Verificar referencias en otras tablas
            const referencias = await pool.request()
                .input('clienteId', sql.Int, id)
                .query(`
                    SELECT 
                        (SELECT COUNT(*) FROM Alquiler WHERE Id_cliente = @clienteId) as totalAlquileres,
                        (SELECT COUNT(*) FROM Venta WHERE Id_cliente = @clienteId) as totalVentas
                `);
            
            const { totalAlquileres, totalVentas } = referencias.recordset[0];
            const totalReferencias = totalAlquileres + totalVentas;
            
            if (totalReferencias > 0) {
                // Eliminación lógica: marcar como inactivo
                const result = await pool.request()
                    .input('id', sql.Int, id)
                    .query(`
                        UPDATE Cliente 
                        SET Activo = 0
                        OUTPUT INSERTED.*
                        WHERE Id_cliente = @id
                    `);
                
                if (result.recordset.length === 0) {
                    throw new Error(`Cliente con ID ${id} no encontrado`);
                }
                
                const detalles = [];
                if (totalAlquileres > 0) detalles.push(`${totalAlquileres} alquiler(es)`);
                if (totalVentas > 0) detalles.push(`${totalVentas} venta(s)`);
                
                console.log(`⚠️  Cliente ${id} desactivado (tiene ${detalles.join(' y ')})`);
                
                return { 
                    success: true, 
                    message: `Cliente desactivado correctamente. Tiene ${detalles.join(' y ')} registrados.`,
                    deleted: result.recordset[0],
                    eliminacionLogica: true,
                    referencias: {
                        alquileres: totalAlquileres,
                        ventas: totalVentas
                    }
                };
            }
            
            // Si no tiene referencias, eliminar físicamente
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM Cliente 
                    OUTPUT DELETED.*
                    WHERE Id_cliente = @id
                `);
            
            if (result.recordset.length === 0) {
                throw new Error(`Cliente con ID ${id} no encontrado`);
            }
            
            console.log(`✅ Cliente ${id} eliminado físicamente`);
            
            return { 
                success: true, 
                message: 'Cliente eliminado correctamente',
                deleted: result.recordset[0],
                eliminacionLogica: false
            };
            
        } catch (error) {
            // Capturar error de FK constraint por si acaso
            if (error.number === 547) {
                throw {
                    statusCode: 409,
                    message: 'No se puede eliminar el cliente porque tiene registros asociados',
                    details: {
                        sugerencia: 'El cliente fue desactivado automáticamente'
                    }
                };
            }
            
            throw error;
        }
    }

    /**
     * Obtener solo clientes activos
     */
    async getActivos(page = 1, limit = 50, filters = {}) {
        return await this.getAll(page, limit, { ...filters, Activo: 1 });
    }

    /**
     * Obtener clientes inactivos
     */
    async getInactivos(page = 1, limit = 50) {
        return await this.getAll(page, limit, { Activo: 0 });
    }

    /**
     * Desactivar cliente manualmente
     */
    async desactivar(id) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE Cliente 
                SET Activo = 0
                OUTPUT INSERTED.*
                WHERE Id_cliente = @id
            `);
        
        if (result.recordset.length === 0) {
            throw new Error(`Cliente con ID ${id} no encontrado`);
        }
        
        console.log(`⚠️  Cliente ${id} desactivado manualmente`);
        
        return result.recordset[0];
    }

    /**
     * Reactivar cliente
     */
    async reactivar(id) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE Cliente 
                SET Activo = 1
                OUTPUT INSERTED.*
                WHERE Id_cliente = @id
            `);
        
        if (result.recordset.length === 0) {
            throw new Error(`Cliente con ID ${id} no encontrado`);
        }
        
        console.log(`✅ Cliente ${id} reactivado`);
        
        return result.recordset[0];
    }
}

module.exports = new ClienteService();