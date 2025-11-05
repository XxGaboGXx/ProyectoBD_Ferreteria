const { getConnection, sql } = require('../config/database');

class ProveedorService {
    /**
     * Obtener todos los proveedores con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP con filtros
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('Nombre', sql.VarChar(20), filters.nombre || null)
                .input('Telefono', sql.VarChar(20), filters.telefono || null)
                .input('Correo', sql.VarChar(100), filters.correo || null)
                .execute('SP_ObtenerProveedores');

            // El SP retorna 2 recordsets: [0] = datos, [1] = total
            const data = result.recordsets[0] || [];
            const total = result.recordsets[1] && result.recordsets[1][0] ? result.recordsets[1][0].Total : 0;

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error al obtener proveedores:', error);
            throw error;
        }
    }

    /**
     * Obtener proveedor por ID con estadísticas
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_ObtenerProveedorPorId');

            if (!result.recordset || result.recordset.length === 0) {
                throw new Error(`Proveedor con ID ${id} no encontrado`);
            }

            return result.recordset[0];

        } catch (error) {
            console.error(`❌ Error al obtener proveedor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear nuevo proveedor
     */
    async create(data) {
        const pool = await getConnection();

        try {
            console.log('🏢 Creando proveedor:', data);

            // Llamar al SP
            const result = await pool.request()
                .input('Nombre', sql.VarChar(20), data.Nombre)
                .input('Telefono', sql.VarChar(20), data.Telefono || null)
                .input('Direccion', sql.VarChar(255), data.Direccion || null)
                .input('Correo_electronico', sql.VarChar(100), data.Correo_electronico || null)
                .execute('SP_CrearProveedor');

            console.log(`✅ Proveedor creado con ID: ${result.recordset[0].Id_proveedor}`);

            return result.recordset[0];

        } catch (error) {
            console.error('❌ Error al crear proveedor:', error);
            throw error;
        }
    }

    /**
     * Actualizar proveedor existente
     */
    async update(id, data) {
        const pool = await getConnection();

        try {
            console.log(`🔄 Actualizando proveedor ${id}:`, data);

            // Llamar al SP
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .input('Nombre', sql.VarChar(20), data.Nombre || null)
                .input('Telefono', sql.VarChar(20), data.Telefono || null)
                .input('Direccion', sql.VarChar(255), data.Direccion || null)
                .input('Correo_electronico', sql.VarChar(100), data.Correo_electronico || null)
                .execute('SP_ActualizarProveedor');

            console.log(`✅ Proveedor ${id} actualizado exitosamente`);

            return result.recordset[0];

        } catch (error) {
            console.error('❌ Error al actualizar proveedor:', error);
            throw error;
        }
    }

    /**
     * Eliminar proveedor (con validaciones de compras asociadas)
     */
    async delete(id) {
        const pool = await getConnection();

        try {
            console.log(`🗑️  Intentando eliminar proveedor ${id}`);

            // Llamar al SP
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_EliminarProveedor');

            console.log(`✅ Proveedor ${id} eliminado exitosamente`);

            return result.recordset[0];

        } catch (error) {
            console.error('❌ Error al eliminar proveedor:', error);
            
            // Error de constraint de SQL Server
            if (error.number === 547) {
                throw {
                    statusCode: 400,
                    message: 'No se puede eliminar el proveedor porque tiene compras asociadas.',
                    code: 'REFERENCE_CONSTRAINT_VIOLATION'
                };
            }
            
            throw error;
        }
    }

    /**
     * Obtener historial de compras del proveedor
     */
    async getHistorialCompras(id, page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Id_proveedor', sql.Int, id)
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('FechaInicio', sql.DateTime, filters.fechaInicio ? new Date(filters.fechaInicio) : null)
                .input('FechaFin', sql.DateTime, filters.fechaFin ? new Date(filters.fechaFin) : null)
                .execute('SP_ObtenerHistorialComprasProveedor');

            // El SP retorna 2 recordsets: [0] = datos, [1] = total
            const data = result.recordsets[0] || [];
            const total = result.recordsets[1] && result.recordsets[1][0] ? result.recordsets[1][0].Total : 0;

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error(`❌ Error al obtener historial del proveedor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener productos suministrados por el proveedor
     */
    async getProductos(id, page = 1, limit = 50) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Id_proveedor', sql.Int, id)
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .execute('SP_ObtenerProductosProveedor');

            // El SP retorna 2 recordsets: [0] = datos, [1] = total
            const data = result.recordsets[0] || [];
            const total = result.recordsets[1] && result.recordsets[1][0] ? result.recordsets[1][0].Total : 0;

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error(`❌ Error al obtener productos del proveedor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas detalladas del proveedor
     */
    async getEstadisticas(id) {
        const pool = await getConnection();

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Id_proveedor', sql.Int, id)
                .execute('SP_ObtenerEstadisticasProveedor');

            const stats = result.recordset[0];

            console.log(`📊 Estadísticas del proveedor ${id} calculadas`);

            return {
                TotalCompras: stats.TotalCompras,
                MontoTotal: parseFloat(stats.MontoTotal?.toFixed(2) || 0),
                PromedioCompra: parseFloat(stats.PromedioCompra?.toFixed(2) || 0),
                CompraMayor: parseFloat(stats.CompraMayor?.toFixed(2) || 0),
                CompraMenor: parseFloat(stats.CompraMenor?.toFixed(2) || 0),
                ProductosDistintos: stats.ProductosDistintos || 0,
                CantidadTotalComprada: stats.CantidadTotalComprada || 0,
                UltimaCompra: stats.UltimaCompra,
                PrimeraCompra: stats.PrimeraCompra
            };

        } catch (error) {
            console.error(`❌ Error al obtener estadísticas del proveedor ${id}:`, error);
            throw error;
        }
    }
}

module.exports = new ProveedorService();