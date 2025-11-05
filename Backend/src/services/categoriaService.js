const { getConnection, sql } = require('../config/database');

class CategoriaService {
    /**
     * Obtener todas las categorías con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('Nombre', sql.VarChar, filters.nombre || null)
                .execute('SP_ObtenerCategorias');

            const categorias = result.recordsets[0];
            const total = result.recordsets[1][0].Total;

            return {
                data: categorias,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('❌ Error al obtener categorías:', error);
            throw error;
        }
    }

    /**
     * Obtener categoría por ID con estadísticas
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_ObtenerCategoriaPorId');

            if (result.recordset.length === 0) {
                throw new Error(`Categoría con ID ${id} no encontrada`);
            }

            return result.recordset[0];
        } catch (error) {
            console.error(`❌ Error al obtener categoría ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear nueva categoría
     */
    async create(data) {
        const pool = await getConnection();

        try {
            console.log('📁 Creando categoría:', data);

            const result = await pool.request()
                .input('Nombre', sql.VarChar, data.Nombre)
                .input('Descripcion', sql.VarChar, data.Descripcion)
                .execute('SP_CrearCategoria');

            console.log(`✅ Categoría creada con ID: ${result.recordset[0].Id_categoria}`);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error al crear categoría:', error);
            throw error;
        }
    }

    /**
     * Actualizar categoría
     */
    async update(id, data) {
        const pool = await getConnection();

        try {
            console.log(`🔄 Actualizando categoría ${id}:`, data);

            const result = await pool.request()
                .input('Id', sql.Int, id)
                .input('Nombre', sql.VarChar, data.Nombre || null)
                .input('Descripcion', sql.VarChar, data.Descripcion || null)
                .execute('SP_ActualizarCategoria');

            console.log(`✅ Categoría ${id} actualizada correctamente`);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error al actualizar categoría:', error);
            throw error;
        }
    }

    /**
     * Eliminar categoría
     */
    async delete(id) {
        const pool = await getConnection();

        try {
            console.log(`🗑️  Intentando eliminar categoría ${id}`);

            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_EliminarCategoria');

            console.log(`✅ Categoría ${id} eliminada exitosamente`);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error al eliminar categoría:', error);
            
            // Mantener compatibilidad con manejo de errores existente
            if (error.message && error.message.includes('tiene') && error.message.includes('producto(s)')) {
                throw {
                    statusCode: 400,
                    message: error.message,
                    code: 'REFERENCE_CONSTRAINT_VIOLATION'
                };
            }
            
            throw error;
        }
    }

    /**
     * Obtener productos de una categoría
     */
    async getProductos(id, page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            const result = await pool.request()
                .input('Id_categoria', sql.Int, id)
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('Nombre', sql.VarChar, filters.nombre || null)
                .input('StockBajo', sql.Bit, filters.stockBajo === 'true' ? 1 : null)
                .execute('SP_ObtenerProductosCategoria');

            const productos = result.recordsets[0];
            const total = result.recordsets[1][0].Total;

            return {
                data: productos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error(`❌ Error al obtener productos de categoría ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de una categoría
     */
    async getEstadisticas(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('Id_categoria', sql.Int, id)
                .execute('SP_ObtenerEstadisticasCategoria');

            if (result.recordset.length === 0) {
                throw new Error(`Categoría con ID ${id} no encontrada`);
            }

            const stats = result.recordset[0];

            return {
                CategoriaNombre: stats.CategoriaNombre,
                Descripcion: stats.Descripcion,
                TotalProductos: stats.TotalProductos || 0,
                StockTotal: stats.StockTotal || 0,
                ProductosStockBajo: stats.ProductosStockBajo || 0,
                ProductosSinStock: stats.ProductosSinStock || 0,
                PrecioMinimo: parseFloat(stats.PrecioMinimo?.toFixed(2) || 0),
                PrecioMaximo: parseFloat(stats.PrecioMaximo?.toFixed(2) || 0),
                PrecioPromedio: parseFloat(stats.PrecioPromedio?.toFixed(2) || 0),
                ValorInventarioCompra: parseFloat(stats.ValorInventarioCompra?.toFixed(2) || 0),
                ValorInventarioVenta: parseFloat(stats.ValorInventarioVenta?.toFixed(2) || 0)
            };
        } catch (error) {
            console.error(`❌ Error al obtener estadísticas de categoría ${id}:`, error);
            throw error;
        }
    }
}

module.exports = new CategoriaService();