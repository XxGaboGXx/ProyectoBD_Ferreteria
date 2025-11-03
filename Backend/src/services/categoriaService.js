const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class CategoriaService extends BaseService {
    constructor() {
        super('Categoria', 'Id_categoria');
    }

    /**
     * Sobrescribir getAll para incluir conteo de productos
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.nombre) {
                whereClause += ' AND c.Nombre LIKE @nombre';
                params.push({ name: 'nombre', type: sql.VarChar(50), value: `%${filters.nombre}%` });
            }

            let request = pool.request()
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset);

            params.forEach(p => request.input(p.name, p.type, p.value));

            const result = await request.query(`
                SELECT 
                    c.Id_categoria,
                    c.Nombre,
                    c.Descripcion,
                    COUNT(p.Id_Producto) as TotalProductos,
                    SUM(p.CantidadActual) as StockTotal,
                    MIN(p.PrecioVenta) as PrecioMinimo,
                    MAX(p.PrecioVenta) as PrecioMaximo
                FROM Categoria c
                LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
                ${whereClause}
                GROUP BY c.Id_categoria, c.Nombre, c.Descripcion
                ORDER BY c.Nombre ASC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const countResult = await request.query(`
                SELECT COUNT(*) as total
                FROM Categoria c
                ${whereClause}
            `);

            const total = countResult.recordset[0].total;

            return {
                data: result.recordset,
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
     * Sobrescribir getById para incluir información de productos
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        c.Id_categoria,
                        c.Nombre,
                        c.Descripcion,
                        COUNT(p.Id_Producto) as TotalProductos,
                        SUM(p.CantidadActual) as StockTotal,
                        MIN(p.PrecioVenta) as PrecioMinimo,
                        MAX(p.PrecioVenta) as PrecioMaximo,
                        AVG(p.PrecioVenta) as PrecioPromedio
                    FROM Categoria c
                    LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
                    WHERE c.Id_categoria = @id
                    GROUP BY c.Id_categoria, c.Nombre, c.Descripcion
                `);

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
     * Crear categoría con validación
     */
    async create(data) {
        const pool = await getConnection();

        try {
            console.log('📁 Creando categoría:', data);

            if (!data.Nombre) {
                throw new Error('El nombre de la categoría es requerido');
            }

            if (!data.Descripcion) {
                throw new Error('La descripción de la categoría es requerida');
            }

            // Verificar nombre único
            const existeResult = await pool.request()
                .input('nombre', sql.VarChar(50), data.Nombre)
                .query('SELECT Id_categoria FROM Categoria WHERE Nombre = @nombre');

            if (existeResult.recordset.length > 0) {
                throw new Error('Ya existe una categoría con ese nombre');
            }

            // Crear
            const result = await pool.request()
                .input('nombre', sql.VarChar(50), data.Nombre)
                .input('descripcion', sql.VarChar(100), data.Descripcion)
                .query(`
                    INSERT INTO Categoria (Nombre, Descripcion)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @descripcion)
                `);

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

            const existeResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT Id_categoria FROM Categoria WHERE Id_categoria = @id');

            if (existeResult.recordset.length === 0) {
                throw new Error(`Categoría con ID ${id} no encontrada`);
            }

            if (data.Nombre) {
                const nombreExisteResult = await pool.request()
                    .input('nombre', sql.VarChar(50), data.Nombre)
                    .input('id', sql.Int, id)
                    .query('SELECT Id_categoria FROM Categoria WHERE Nombre = @nombre AND Id_categoria != @id');

                if (nombreExisteResult.recordset.length > 0) {
                    throw new Error('Ya existe otra categoría con ese nombre');
                }
            }

            const updates = [];
            const request = pool.request().input('id', sql.Int, id);

            if (data.Nombre !== undefined) {
                updates.push('Nombre = @nombre');
                request.input('nombre', sql.VarChar(50), data.Nombre);
            }

            if (data.Descripcion !== undefined) {
                updates.push('Descripcion = @descripcion');
                request.input('descripcion', sql.VarChar(100), data.Descripcion);
            }

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            const result = await request.query(`
                UPDATE Categoria
                SET ${updates.join(', ')}
                OUTPUT INSERTED.*
                WHERE Id_categoria = @id
            `);

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

            const existeResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT Nombre FROM Categoria WHERE Id_categoria = @id');

            if (existeResult.recordset.length === 0) {
                throw new Error(`Categoría con ID ${id} no encontrada`);
            }

            const categoria = existeResult.recordset[0];

            const productosResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT COUNT(*) as total FROM Producto WHERE Id_categoria = @id');

            const totalProductos = productosResult.recordset[0].total;

            if (totalProductos > 0) {
                throw {
                    statusCode: 400,
                    message: `No se puede eliminar la categoría "${categoria.Nombre}" porque tiene ${totalProductos} producto(s) asociado(s).`,
                    details: {
                        categoria: categoria.Nombre,
                        totalProductos: totalProductos
                    }
                };
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM Categoria
                    OUTPUT DELETED.*
                    WHERE Id_categoria = @id
                `);

            console.log(`✅ Categoría ${id} eliminada exitosamente`);

            return result.recordset[0];

        } catch (error) {
            console.error('❌ Error al eliminar categoría:', error);
            
            if (error.number === 547) {
                throw {
                    statusCode: 400,
                    message: 'No se puede eliminar la categoría porque tiene productos asociados.',
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
            let whereClause = 'WHERE p.Id_categoria = @id';
            const params = [{ name: 'id', type: sql.Int, value: id }];

            if (filters.nombre) {
                whereClause += ' AND p.Nombre LIKE @nombre';
                params.push({ name: 'nombre', type: sql.VarChar(60), value: `%${filters.nombre}%` });
            }

            if (filters.stockBajo === 'true') {
                whereClause += ' AND p.CantidadActual <= p.CantidadMinima';
            }

            let request = pool.request()
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset);

            params.forEach(p => request.input(p.name, p.type, p.value));

            const result = await request.query(`
                SELECT 
                    p.Id_Producto,
                    p.Nombre,
                    p.Descripcion,
                    p.PrecioCompra,
                    p.PrecioVenta,
                    p.CantidadActual,
                    p.CantidadMinima,
                    p.CodigoBarra,
                    CASE 
                        WHEN p.CantidadActual <= 0 THEN 'Sin Stock'
                        WHEN p.CantidadActual <= p.CantidadMinima THEN 'Stock Bajo'
                        ELSE 'Stock Normal'
                    END as EstadoStock
                FROM Producto p
                ${whereClause}
                ORDER BY p.Nombre ASC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const countResult = await request.query(`
                SELECT COUNT(*) as total
                FROM Producto p
                ${whereClause}
            `);

            const total = countResult.recordset[0].total;

            return {
                data: result.recordset,
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
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        c.Id_categoria,
                        c.Nombre as CategoriaNombre,
                        c.Descripcion,
                        COUNT(p.Id_Producto) as TotalProductos,
                        SUM(p.CantidadActual) as StockTotal,
                        SUM(CASE WHEN p.CantidadActual <= p.CantidadMinima THEN 1 ELSE 0 END) as ProductosStockBajo,
                        SUM(CASE WHEN p.CantidadActual <= 0 THEN 1 ELSE 0 END) as ProductosSinStock,
                        MIN(p.PrecioVenta) as PrecioMinimo,
                        MAX(p.PrecioVenta) as PrecioMaximo,
                        AVG(p.PrecioVenta) as PrecioPromedio,
                        SUM(p.CantidadActual * p.PrecioCompra) as ValorInventarioCompra,
                        SUM(p.CantidadActual * p.PrecioVenta) as ValorInventarioVenta
                    FROM Categoria c
                    LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
                    WHERE c.Id_categoria = @id
                    GROUP BY c.Id_categoria, c.Nombre, c.Descripcion
                `);

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