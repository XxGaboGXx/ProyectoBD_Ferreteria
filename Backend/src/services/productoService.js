const { getConnection, sql } = require('../config/database');

class ProductoService {
    /**
     * Obtener todos los productos con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP con filtros
            const result = await pool.request()
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .input('Nombre', sql.VarChar(50), filters.nombre || null)
                .input('Id_categoria', sql.Int, filters.Id_categoria ? parseInt(filters.Id_categoria) : null)
                .input('CantidadMinima', sql.Int, filters.cantidadMinima ? parseInt(filters.cantidadMinima) : null)
                .input('CantidadMaxima', sql.Int, filters.cantidadMaxima ? parseInt(filters.cantidadMaxima) : null)
                .execute('SP_ObtenerProductos');

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
            console.error('❌ Error al obtener productos:', error);
            throw error;
        }
    }

    /**
     * Obtener producto por ID con estadísticas completas
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            // Llamar al SP que retorna 4 recordsets: [0] = producto, [1] = ventas, [2] = compras, [3] = bitácora
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_ObtenerProductoPorId');

            if (!result.recordsets[0] || result.recordsets[0].length === 0) {
                throw new Error(`Producto con ID ${id} no encontrado`);
            }

            const producto = result.recordsets[0][0];
            producto.estadisticasVentas = result.recordsets[1] ? result.recordsets[1][0] : null;
            producto.estadisticasCompras = result.recordsets[2] ? result.recordsets[2][0] : null;
            producto.ultimosMovimientos = result.recordsets[3] || [];

            return producto;

        } catch (error) {
            console.error(`❌ Error al obtener producto ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear nuevo producto
     */
    async create(data) {
        const pool = await getConnection();

        try {
            console.log('📦 Creando producto:', data);

            // Llamar al SP
            const result = await pool.request()
                .input('Nombre', sql.VarChar(20), data.Nombre)
                .input('Descripcion', sql.VarChar(100), data.Descripcion || null)
                .input('CantidadActual', sql.Int, data.CantidadActual || data.Stock || 0)
                .input('PrecioVenta', sql.Decimal(12, 2), data.PrecioVenta)
                .input('PrecioCompra', sql.Decimal(12, 2), data.PrecioCompra || 0)
                .input('CantidadMinima', sql.Int, data.CantidadMinima || data.StockMinimo || 5)
                .input('Id_categoria', sql.Int, data.Id_categoria || null)
                .input('CodigoBarra', sql.VarChar(50), data.CodigoBarra || null)
                .execute('SP_CrearProducto');

            const producto = result.recordset[0];
            console.log(`✅ Producto creado con ID: ${producto.Id_producto}`);

            return producto;

        } catch (error) {
            console.error('❌ Error al crear producto:', error);
            throw error;
        }
    }

    /**
     * Actualizar producto
     */
    async update(id, data) {
        const pool = await getConnection();

        try {
            console.log(`🔄 Actualizando producto ${id}:`, JSON.stringify(data, null, 2));

            // Validar que el ID sea un número válido
            if (!id || isNaN(id)) {
                throw new Error('ID de producto inválido');
            }

            // Llamar al SP (solo envía los campos que se quieren actualizar)
            const request = pool.request()
                .input('Id', sql.Int, parseInt(id));

            // Solo agregar inputs si el valor está definido
            if (data.Nombre !== undefined) {
                request.input('Nombre', sql.VarChar(20), data.Nombre);
            } else {
                request.input('Nombre', sql.VarChar(20), null);
            }

            if (data.Descripcion !== undefined) {
                request.input('Descripcion', sql.VarChar(100), data.Descripcion);
            } else {
                request.input('Descripcion', sql.VarChar(100), null);
            }

            if (data.PrecioVenta !== undefined) {
                request.input('PrecioVenta', sql.Decimal(12, 2), data.PrecioVenta);
            } else {
                request.input('PrecioVenta', sql.Decimal(12, 2), null);
            }

            if (data.PrecioCompra !== undefined) {
                request.input('PrecioCompra', sql.Decimal(12, 2), data.PrecioCompra);
            } else {
                request.input('PrecioCompra', sql.Decimal(12, 2), null);
            }

            if (data.CantidadMinima !== undefined) {
                request.input('CantidadMinima', sql.Int, data.CantidadMinima);
            } else {
                request.input('CantidadMinima', sql.Int, null);
            }

            if (data.Id_categoria !== undefined) {
                request.input('Id_categoria', sql.Int, data.Id_categoria);
            } else {
                request.input('Id_categoria', sql.Int, null);
            }

            if (data.CodigoBarra !== undefined) {
                request.input('CodigoBarra', sql.VarChar(50), data.CodigoBarra);
            } else {
                request.input('CodigoBarra', sql.VarChar(50), null);
            }

            const result = await request.execute('SP_ActualizarProducto');

            if (!result.recordset || result.recordset.length === 0) {
                throw new Error(`No se pudo actualizar el producto ${id}`);
            }

            const producto = result.recordset[0];
            console.log(`✅ Producto ${id} actualizado correctamente`);

            return producto;

        } catch (error) {
            console.error('❌ Error al actualizar producto:', error.message);
            console.error('❌ Stack:', error.stack);
            throw error;
        }
    }

    /**
     * Eliminar producto
     */
    async delete(id) {
        const pool = await getConnection();

        try {
            console.log(`🗑️  Intentando eliminar producto ${id}`);

            // Llamar al SP (verifica automáticamente dependencias)
            const result = await pool.request()
                .input('Id', sql.Int, id)
                .execute('SP_EliminarProducto');

            const producto = result.recordset[0];
            console.log(`✅ Producto ${id} eliminado exitosamente`);

            return producto;

        } catch (error) {
            console.error('❌ Error al eliminar producto:', error);
            throw error;
        }
    }

    /**
     * Ajustar manualmente el inventario de un producto
     */
    async ajustarInventario(id, ajuste) {
        const pool = await getConnection();

        try {
            console.log(`📊 Ajustando inventario del producto ${id}:`, ajuste);

            // Validar datos
            if (!ajuste.CantidadAjuste || ajuste.CantidadAjuste === 0) {
                throw new Error('Debe especificar una cantidad de ajuste diferente de cero');
            }

            if (!ajuste.TipoMovimiento) {
                throw new Error('Debe especificar el tipo de movimiento');
            }

            // Llamar al SP
            const result = await pool.request()
                .input('Id_producto', sql.Int, id)
                .input('CantidadAjuste', sql.Int, ajuste.CantidadAjuste)
                .input('TipoMovimiento', sql.VarChar(50), ajuste.TipoMovimiento)
                .input('Descripcion', sql.VarChar(255), ajuste.Descripcion || null)
                .execute('SP_AjustarInventario');

            const resultado = result.recordset[0];
            console.log(`✅ Inventario ajustado: ${resultado.StockAnterior} → ${resultado.StockActual}`);

            return resultado;

        } catch (error) {
            console.error('❌ Error al ajustar inventario:', error);
            throw error;
        }
    }

    /**
     * Obtener productos con stock bajo o crítico
     */
    async getProductosBajoStock() {
        const pool = await getConnection();

        try {
            // Llamar al SP
            const result = await pool.request()
                .execute('SP_ObtenerProductosBajoStock');

            console.log(`⚠️  ${result.recordset.length} productos con stock bajo`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener productos con stock bajo:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas generales del inventario
     */
    async getEstadisticasInventario() {
        const pool = await getConnection();

        try {
            // Llamar al SP
            const result = await pool.request()
                .execute('SP_ObtenerEstadisticasInventario');

            const estadisticas = result.recordset[0];

            const estadisticasFormateadas = {
                TotalProductos: estadisticas.TotalProductos,
                StockTotal: estadisticas.StockTotal,
                ValorInventarioCompra: parseFloat(estadisticas.ValorInventarioCompra?.toFixed(2) || 0),
                ValorInventarioVenta: parseFloat(estadisticas.ValorInventarioVenta?.toFixed(2) || 0),
                GananciaPotencial: parseFloat(estadisticas.GananciaPotencial?.toFixed(2) || 0),
                PromedioPrecios: parseFloat(estadisticas.PromedioPrecios?.toFixed(2) || 0),
                ProductosBajoStock: estadisticas.ProductosBajoStock,
                ProductosSinStock: estadisticas.ProductosSinStock,
                ProductosAltoStock: estadisticas.ProductosAltoStock
            };

            console.log('📊 Estadísticas de inventario calculadas:', estadisticasFormateadas);

            return estadisticasFormateadas;

        } catch (error) {
            console.error('❌ Error al obtener estadísticas de inventario:', error);
            throw error;
        }
    }

    /**
     * Obtener productos de una categoría específica
     */
    async getByCategoria(idCategoria, page = 1, limit = 50) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            // Llamar al SP
            const result = await pool.request()
                .input('Id_categoria', sql.Int, idCategoria)
                .input('Limit', sql.Int, limit)
                .input('Offset', sql.Int, offset)
                .execute('SP_ObtenerProductosPorCategoria');

            // El SP retorna 2 recordsets: [0] = productos, [1] = total
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
            console.error(`❌ Error al obtener productos de categoría ${idCategoria}:`, error);
            throw error;
        }
    }
}

module.exports = new ProductoService();