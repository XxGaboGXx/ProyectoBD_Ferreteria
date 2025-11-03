const BaseService = require('./baseService');
const { getConnection, sql } = require('../config/database');

class ProveedorService extends BaseService {
    constructor() {
        super('Proveedor', 'Id_proveedor');
    }

    /**
     * Sobrescribir getAll para incluir estadísticas de compras
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.nombre) {
                whereClause += ' AND p.Nombre LIKE @nombre';
                params.push({ name: 'nombre', type: sql.VarChar(20), value: `%${filters.nombre}%` });
            }

            if (filters.telefono) {
                whereClause += ' AND p.Telefono LIKE @telefono';
                params.push({ name: 'telefono', type: sql.VarChar(20), value: `%${filters.telefono}%` });
            }

            if (filters.correo) {
                whereClause += ' AND p.Correo_electronico LIKE @correo';
                params.push({ name: 'correo', type: sql.VarChar(100), value: `%${filters.correo}%` });
            }

            let request = pool.request()
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset);

            params.forEach(p => request.input(p.name, p.type, p.value));

            // Consulta principal con estadísticas
            const result = await request.query(`
                SELECT 
                    p.*,
                    COUNT(DISTINCT c.Id_compra) as TotalCompras,
                    ISNULL(SUM(c.TotalCompra), 0) as MontoTotalComprado,
                    MAX(c.FechaCompra) as UltimaCompra
                FROM Proveedor p
                LEFT JOIN Compra c ON p.Id_proveedor = c.Id_proveedor
                ${whereClause}
                GROUP BY p.Id_proveedor, p.Nombre, p.Telefono, p.Direccion, p.Correo_electronico
                ORDER BY p.Nombre ASC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            // Contar total
            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const countResult = await request.query(`
                SELECT COUNT(*) as total
                FROM Proveedor p
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
            console.error('❌ Error al obtener proveedores:', error);
            throw error;
        }
    }

    /**
     * Sobrescribir getById para incluir estadísticas
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        p.*,
                        COUNT(DISTINCT c.Id_compra) as TotalCompras,
                        ISNULL(SUM(c.TotalCompra), 0) as MontoTotalComprado,
                        MAX(c.FechaCompra) as UltimaCompra,
                        MIN(c.FechaCompra) as PrimeraCompra
                    FROM Proveedor p
                    LEFT JOIN Compra c ON p.Id_proveedor = c.Id_proveedor
                    WHERE p.Id_proveedor = @id
                    GROUP BY p.Id_proveedor, p.Nombre, p.Telefono, p.Direccion, p.Correo_electronico
                `);

            if (result.recordset.length === 0) {
                throw new Error(`Proveedor con ID ${id} no encontrado`);
            }

            return result.recordset[0];

        } catch (error) {
            console.error(`❌ Error al obtener proveedor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Sobrescribir create para validar nombre único
     */
    async create(data) {
        const pool = await getConnection();

        try {
            console.log('🏢 Creando proveedor:', data);

            // Validar nombre requerido
            if (!data.Nombre) {
                throw new Error('El nombre del proveedor es requerido');
            }

            // Verificar nombre único
            const existeResult = await pool.request()
                .input('nombre', sql.VarChar(20), data.Nombre)
                .query('SELECT Id_proveedor FROM Proveedor WHERE Nombre = @nombre');

            if (existeResult.recordset.length > 0) {
                throw new Error('Ya existe un proveedor con ese nombre');
            }

            // Usar el método create del BaseService
            return await super.create(data);

        } catch (error) {
            console.error('❌ Error al crear proveedor:', error);
            throw error;
        }
    }

    /**
     * Sobrescribir update para validar nombre único
     */
    async update(id, data) {
        const pool = await getConnection();

        try {
            console.log(`🔄 Actualizando proveedor ${id}:`, data);

            // Si se está actualizando el nombre, verificar que no exista otro
            if (data.Nombre) {
                const nombreExisteResult = await pool.request()
                    .input('nombre', sql.VarChar(20), data.Nombre)
                    .input('id', sql.Int, id)
                    .query('SELECT Id_proveedor FROM Proveedor WHERE Nombre = @nombre AND Id_proveedor != @id');

                if (nombreExisteResult.recordset.length > 0) {
                    throw new Error('Ya existe otro proveedor con ese nombre');
                }
            }

            // Usar el método update del BaseService
            return await super.update(id, data);

        } catch (error) {
            console.error('❌ Error al actualizar proveedor:', error);
            throw error;
        }
    }

    /**
     * Sobrescribir delete para validar compras asociadas
     */
    async delete(id) {
        const pool = await getConnection();

        try {
            console.log(`🗑️  Intentando eliminar proveedor ${id}`);

            // Verificar que existe
            const existeResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT Nombre FROM Proveedor WHERE Id_proveedor = @id');

            if (existeResult.recordset.length === 0) {
                throw new Error(`Proveedor con ID ${id} no encontrado`);
            }

            const proveedor = existeResult.recordset[0];

            // Verificar compras asociadas
            const comprasResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        COUNT(*) as TotalCompras,
                        ISNULL(SUM(TotalCompra), 0) as MontoTotal
                    FROM Compra 
                    WHERE Id_proveedor = @id
                `);

            const totalCompras = comprasResult.recordset[0].TotalCompras;
            const montoTotal = comprasResult.recordset[0].MontoTotal;

            if (totalCompras > 0) {
                throw {
                    statusCode: 400,
                    message: `No se puede eliminar el proveedor "${proveedor.Nombre}" porque tiene ${totalCompras} compra(s) registrada(s) por un monto total de ₡${montoTotal.toLocaleString('es-CR', {minimumFractionDigits: 2})}.`,
                    details: {
                        proveedor: proveedor.Nombre,
                        totalCompras: totalCompras,
                        montoTotal: parseFloat(montoTotal.toFixed(2))
                    }
                };
            }

            // Usar el método delete del BaseService
            return await super.delete(id);

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
            let whereClause = 'WHERE c.Id_proveedor = @id';
            const params = [{ name: 'id', type: sql.Int, value: id }];

            if (filters.fechaInicio) {
                whereClause += ' AND c.FechaCompra >= @fechaInicio';
                params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(filters.fechaInicio) });
            }

            if (filters.fechaFin) {
                whereClause += ' AND c.FechaCompra <= @fechaFin';
                params.push({ name: 'fechaFin', type: sql.DateTime, value: new Date(filters.fechaFin) });
            }

            let request = pool.request()
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset);

            params.forEach(p => request.input(p.name, p.type, p.value));

            const result = await request.query(`
                SELECT 
                    c.*,
                    COUNT(dc.Id_detalleCompra) as TotalProductos,
                    SUM(dc.CantidadCompra) as CantidadTotal
                FROM Compra c
                LEFT JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
                ${whereClause}
                GROUP BY c.Id_compra, c.FechaCompra, c.TotalCompra, c.NumeroFactura, c.Id_proveedor
                ORDER BY c.FechaCompra DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            // Contar total
            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const countResult = await request.query(`
                SELECT COUNT(*) as total
                FROM Compra c
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
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(`
                    SELECT 
                        p.Id_Producto,
                        p.Nombre,
                        p.Descripcion,
                        p.PrecioCompra,
                        p.PrecioVenta,
                        p.CantidadActual,
                        cat.Nombre as Categoria,
                        COUNT(DISTINCT dc.Id_compra) as VecesComprado,
                        SUM(dc.CantidadCompra) as TotalComprado,
                        MAX(c.FechaCompra) as UltimaCompra,
                        AVG(dc.PrecioUnitario) as PrecioPromedio
                    FROM Producto p
                    INNER JOIN DetalleCompra dc ON p.Id_Producto = dc.Id_producto
                    INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
                    LEFT JOIN Categoria cat ON p.Id_categoria = cat.Id_categoria
                    WHERE c.Id_proveedor = @id
                    GROUP BY p.Id_Producto, p.Nombre, p.Descripcion, p.PrecioCompra, 
                             p.PrecioVenta, p.CantidadActual, cat.Nombre
                    ORDER BY TotalComprado DESC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `);

            // Contar total
            const countResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(DISTINCT p.Id_Producto) as total
                    FROM Producto p
                    INNER JOIN DetalleCompra dc ON p.Id_Producto = dc.Id_producto
                    INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
                    WHERE c.Id_proveedor = @id
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
            console.error(`❌ Error al obtener productos del proveedor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del proveedor
     */
    async getEstadisticas(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        COUNT(DISTINCT c.Id_compra) as TotalCompras,
                        ISNULL(SUM(c.TotalCompra), 0) as MontoTotal,
                        ISNULL(AVG(c.TotalCompra), 0) as PromedioCompra,
                        ISNULL(MAX(c.TotalCompra), 0) as CompraMayor,
                        ISNULL(MIN(c.TotalCompra), 0) as CompraMenor,
                        COUNT(DISTINCT dc.Id_producto) as ProductosDistintos,
                        SUM(dc.CantidadCompra) as CantidadTotalComprada,
                        MAX(c.FechaCompra) as UltimaCompra,
                        MIN(c.FechaCompra) as PrimeraCompra
                    FROM Compra c
                    LEFT JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
                    WHERE c.Id_proveedor = @id
                `);

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