const { getConnection, sql } = require('../config/database');

class ClienteService {
    /**
     * Obtener todos los clientes con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        const result = await pool.request()
            .input('Limit', sql.Int, limit)
            .input('Offset', sql.Int, offset)
            .input('Nombre', sql.VarChar, filters.Nombre || null)
            .execute('SP_ObtenerClientes');

        const clientes = result.recordsets[0];
        const total = result.recordsets[1][0].Total;

        return {
            data: clientes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener cliente por ID
     */
    async getById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .execute('SP_ObtenerClientePorId');

        if (result.recordset.length === 0) {
            throw new Error(`Cliente con ID ${id} no encontrado`);
        }

        return result.recordset[0];
    }

    /**
     * Buscar cliente por cédula (Ya no disponible - columna no existe)
     */
    async getByCedula(cedula) {
        throw new Error('Funcionalidad no disponible: la columna Cedula no existe en la tabla Cliente');
    }

    /**
     * Crear nuevo cliente
     */
    async create(clienteData) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('Nombre', sql.VarChar, clienteData.Nombre)
            .input('Apellido1', sql.VarChar, clienteData.Apellido1)
            .input('Apellido2', sql.VarChar, clienteData.Apellido2 || null)
            .input('Telefono', sql.VarChar, clienteData.Telefono || null)
            .input('Correo', sql.VarChar, clienteData.Correo || null)
            .input('Direccion', sql.VarChar, clienteData.Direccion || null)
            .execute('SP_CrearCliente');

        return result.recordset[0];
    }

    /**
     * Actualizar cliente
     */
    async update(id, clienteData) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('Nombre', sql.VarChar, clienteData.Nombre || null)
            .input('Apellido1', sql.VarChar, clienteData.Apellido1 || null)
            .input('Apellido2', sql.VarChar, clienteData.Apellido2 || null)
            .input('Telefono', sql.VarChar, clienteData.Telefono || null)
            .input('Correo', sql.VarChar, clienteData.Correo || null)
            .input('Direccion', sql.VarChar, clienteData.Direccion || null)
            .execute('SP_ActualizarCliente');

        return result.recordset[0];
    }

    /**
     * Eliminar cliente (solo si no tiene referencias)
     */
    async delete(id) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_EliminarCliente');

            const info = result.recordset[0];
            
            console.log(`✅ Cliente ${id} eliminado físicamente`);
            
            return { 
                success: true, 
                message: info.Mensaje,
                deleted: info,
                eliminacionLogica: false
            };
            
        } catch (error) {
            if (error.message && error.message.includes('tiene registros asociados')) {
                throw {
                    statusCode: 409,
                    message: 'No se puede eliminar el cliente porque tiene registros asociados',
                    details: error.message
                };
            }
            throw error;
        }
    }

    /**
     * Obtener historial de ventas del cliente
     */
    async getHistorialCompras(clienteId, page = 1, limit = 50) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        const result = await pool.request()
            .input('Id_cliente', sql.Int, clienteId)
            .input('Limit', sql.Int, limit)
            .input('Offset', sql.Int, offset)
            .execute('SP_ObtenerHistorialVentasCliente');

        const ventas = result.recordsets[0];
        const total = result.recordsets[1][0].Total;

        return {
            data: ventas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener estadísticas del cliente
     */
    async getEstadisticas(clienteId) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('Id_cliente', sql.Int, clienteId)
            .execute('SP_ObtenerEstadisticasCliente');

        return result.recordset[0];
    }

    /**
     * Obtener solo clientes activos (No disponible - columna Activo no existe)
     */
    async getActivos(page = 1, limit = 50, filters = {}) {
        // Retornar todos los clientes ya que no existe columna Activo
        return await this.getAll(page, limit, filters);
    }

    /**
     * Obtener clientes inactivos (No disponible - columna Activo no existe)
     */
    async getInactivos(page = 1, limit = 50) {
        throw new Error('Funcionalidad no disponible: la columna Activo no existe en la tabla Cliente');
    }

    /**
     * Desactivar cliente manualmente (No disponible - columna Activo no existe)
     */
    async desactivar(id) {
        throw new Error('Funcionalidad no disponible: la columna Activo no existe en la tabla Cliente');
    }

    /**
     * Reactivar cliente (No disponible - columna Activo no existe)
     */
    async reactivar(id) {
        throw new Error('Funcionalidad no disponible: la columna Activo no existe en la tabla Cliente');
    }
}

module.exports = new ClienteService();