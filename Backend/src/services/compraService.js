const { getConnection, sql } = require('../config/database');

class CompraService {
    /**
     * Obtener todas las compras con paginación
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        try {
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.Id_proveedor) {
                whereClause += ' AND c.Id_proveedor = @idProveedor';
                params.push({ name: 'idProveedor', type: sql.Int, value: parseInt(filters.Id_proveedor) });
            }

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

            // Consulta principal
            const result = await request.query(`
                SELECT 
                    c.*,
                    p.Nombre as ProveedorNombre,
                    p.Telefono as ProveedorTelefono,
                    p.Direccion as ProveedorDireccion,
                    p.Correo_electronico as ProveedorCorreo,
                    COUNT(dc.Id_detalleCompra) as TotalProductos
                FROM Compra c
                INNER JOIN Proveedor p ON c.Id_proveedor = p.Id_proveedor
                LEFT JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
                ${whereClause}
                GROUP BY c.Id_compra, c.FechaCompra, c.TotalCompra, c.NumeroFactura,
                         c.Id_proveedor, p.Nombre, p.Telefono, p.Direccion, p.Correo_electronico
                ORDER BY c.FechaCompra DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

            // Contar total
            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const countResult = await request.query(`
                SELECT COUNT(DISTINCT c.Id_compra) as total
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
            console.error('❌ Error al obtener compras:', error);
            throw error;
        }
    }

    /**
     * Obtener compra por ID con detalles
     */
    async getById(id) {
        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        c.*,
                        p.Nombre as ProveedorNombre,
                        p.Telefono as ProveedorTelefono,
                        p.Direccion as ProveedorDireccion,
                        p.Correo_electronico as ProveedorCorreo
                    FROM Compra c
                    INNER JOIN Proveedor p ON c.Id_proveedor = p.Id_proveedor
                    WHERE c.Id_compra = @id
                `);

            if (result.recordset.length === 0) {
                throw new Error(`Compra con ID ${id} no encontrada`);
            }

            const compra = result.recordset[0];

            // Obtener detalles
            const detallesResult = await pool.request()
                .input('compraId', sql.Int, id)
                .query(`
                    SELECT 
                        dc.*,
                        p.Nombre as ProductoNombre,
                        p.Descripcion as ProductoDescripcion,
                        p.CodigoBarra,
                        c.Nombre as Categoria
                    FROM DetalleCompra dc
                    INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
                    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                    WHERE dc.Id_compra = @compraId
                    ORDER BY dc.NumeroLinea
                `);

            compra.detalles = detallesResult.recordset;

            return compra;

        } catch (error) {
            console.error(`❌ Error al obtener compra ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear nueva compra con detalles
     */
    async create(data) {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            console.log('🛒 Iniciando creación de compra:', data);

            // Validar datos requeridos
            if (!data.Id_proveedor) {
                throw new Error('El proveedor es requerido');
            }

            if (!data.detalles || !Array.isArray(data.detalles) || data.detalles.length === 0) {
                throw new Error('Debe incluir al menos un producto en la compra');
            }

            await transaction.begin();

            // 1. Crear la compra principal
            const compraRequest = new sql.Request(transaction);
            const compraResult = await compraRequest
                .input('fechaCompra', sql.DateTime, data.FechaCompra || new Date())
                .input('totalCompra', sql.Decimal(12, 2), data.TotalCompra || 0)
                .input('numeroFactura', sql.VarChar(50), data.NumeroFactura || null)
                .input('idProveedor', sql.Int, data.Id_proveedor)
                .query(`
                    INSERT INTO Compra (FechaCompra, TotalCompra, NumeroFactura, Id_proveedor)
                    OUTPUT INSERTED.*
                    VALUES (@fechaCompra, @totalCompra, @numeroFactura, @idProveedor)
                `);

            const compra = compraResult.recordset[0];
            console.log(`✅ Compra creada con ID: ${compra.Id_compra}`);

            // 2. Insertar detalles y actualizar inventario
            let totalCalculado = 0;
            const detallesCreados = [];

            for (let i = 0; i < data.detalles.length; i++) {
                const detalle = data.detalles[i];

                if (!detalle.Id_producto || !detalle.CantidadCompra || !detalle.PrecioUnitario) {
                    throw new Error(`Detalle ${i + 1}: Producto, cantidad y precio son requeridos`);
                }

                // Verificar que el producto existe
                const productoRequest = new sql.Request(transaction);
                const productoResult = await productoRequest
                    .input('idProducto', sql.Int, detalle.Id_producto)
                    .query('SELECT Id_Producto, Nombre, CantidadActual FROM Producto WHERE Id_Producto = @idProducto');

                if (productoResult.recordset.length === 0) {
                    throw new Error(`Producto con ID ${detalle.Id_producto} no encontrado`);
                }

                const producto = productoResult.recordset[0];
                const subtotal = detalle.CantidadCompra * detalle.PrecioUnitario;
                totalCalculado += subtotal;

                // Insertar detalle
                const detalleRequest = new sql.Request(transaction);
                const detalleResult = await detalleRequest
                    .input('cantidadCompra', sql.Int, detalle.CantidadCompra)
                    .input('numeroLinea', sql.Int, i + 1)
                    .input('precioUnitario', sql.Decimal(12, 2), detalle.PrecioUnitario)
                    .input('subtotal', sql.Decimal(12, 2), subtotal)
                    .input('idCompra', sql.Int, compra.Id_compra)
                    .input('idProducto', sql.Int, detalle.Id_producto)
                    .query(`
                        INSERT INTO DetalleCompra (CantidadCompra, NumeroLinea, PrecioUnitario, Subtotal, Id_compra, Id_producto)
                        OUTPUT INSERTED.*
                        VALUES (@cantidadCompra, @numeroLinea, @precioUnitario, @subtotal, @idCompra, @idProducto)
                    `);

                // Actualizar inventario (sumar stock y actualizar precio de compra)
                const updateStockRequest = new sql.Request(transaction);
                await updateStockRequest
                    .input('cantidad', sql.Int, detalle.CantidadCompra)
                    .input('idProducto', sql.Int, detalle.Id_producto)
                    .input('precioCompra', sql.Decimal(12, 2), detalle.PrecioUnitario)
                    .query(`
                        UPDATE Producto 
                        SET CantidadActual = CantidadActual + @cantidad,
                            PrecioCompra = @precioCompra,
                            FechaEntrada = GETDATE()
                        WHERE Id_Producto = @idProducto
                    `);

                detallesCreados.push(detalleResult.recordset[0]);
                console.log(`  ✓ Detalle ${i + 1}: ${producto.Nombre} - Cantidad: ${detalle.CantidadCompra} (Stock anterior: ${producto.CantidadActual}, Nuevo: ${producto.CantidadActual + detalle.CantidadCompra})`);
            }

            // 3. Actualizar total si es necesario
            if (data.TotalCompra === 0 || !data.TotalCompra) {
                const updateCompraRequest = new sql.Request(transaction);
                await updateCompraRequest
                    .input('total', sql.Decimal(12, 2), totalCalculado)
                    .input('idCompra', sql.Int, compra.Id_compra)
                    .query('UPDATE Compra SET TotalCompra = @total WHERE Id_compra = @idCompra');

                compra.TotalCompra = totalCalculado;
            }

            await transaction.commit();
            console.log(`✅ Compra completada exitosamente. Total: ${compra.TotalCompra}`);

            return {
                ...compra,
                detalles: detallesCreados,
                totalProductos: detallesCreados.length,
                inventarioActualizado: true
            };

        } catch (error) {
            if (transaction._aborted === false) {
                await transaction.rollback();
            }
            console.error('❌ Error al crear compra:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de compras
     */
    async getEstadisticas(filters = {}) {
        const pool = await getConnection();

        try {
            const params = [];
            let whereFechas = '';

            if (filters.fechaInicio || filters.fechaFin) {
                whereFechas = 'WHERE 1=1';

                if (filters.fechaInicio) {
                    whereFechas += ' AND FechaCompra >= @fechaInicio';
                    params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(filters.fechaInicio) });
                }

                if (filters.fechaFin) {
                    whereFechas += ' AND FechaCompra <= @fechaFin';
                    params.push({ name: 'fechaFin', type: sql.DateTime, value: new Date(filters.fechaFin) });
                }
            }

            let request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            const comprasStats = await request.query(`
                SELECT 
                    COUNT(*) as TotalCompras,
                    ISNULL(SUM(TotalCompra), 0) as CompraTotal,
                    ISNULL(AVG(TotalCompra), 0) as PromedioCompra,
                    ISNULL(MAX(TotalCompra), 0) as CompraMayor,
                    ISNULL(MIN(TotalCompra), 0) as CompraMenor,
                    COUNT(DISTINCT Id_proveedor) as ProveedoresUnicos
                FROM Compra
                ${whereFechas}
            `);

            const estadisticas = {
                TotalCompras: comprasStats.recordset[0].TotalCompras,
                CompraTotal: parseFloat(comprasStats.recordset[0].CompraTotal.toFixed(2)),
                PromedioCompra: parseFloat(comprasStats.recordset[0].PromedioCompra.toFixed(2)),
                CompraMayor: parseFloat(comprasStats.recordset[0].CompraMayor.toFixed(2)),
                CompraMenor: parseFloat(comprasStats.recordset[0].CompraMenor.toFixed(2)),
                ProveedoresUnicos: comprasStats.recordset[0].ProveedoresUnicos
            };

            console.log('📊 Estadísticas de compras calculadas:', estadisticas);

            return estadisticas;

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtener productos más comprados
     */
    async getProductosMasComprados(limit = 10, filters = {}) {
        const pool = await getConnection();

        try {
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.fechaInicio) {
                whereClause += ' AND c.FechaCompra >= @fechaInicio';
                params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(filters.fechaInicio) });
            }

            if (filters.fechaFin) {
                whereClause += ' AND c.FechaCompra <= @fechaFin';
                params.push({ name: 'fechaFin', type: sql.DateTime, value: new Date(filters.fechaFin) });
            }

            let request = pool.request()
                .input('limit', sql.Int, limit);

            params.forEach(p => request.input(p.name, p.type, p.value));

            const result = await request.query(`
                SELECT TOP (@limit)
                    p.Id_Producto,
                    p.Nombre,
                    p.Descripcion,
                    cat.Nombre as Categoria,
                    SUM(dc.CantidadCompra) as TotalComprado,
                    COUNT(DISTINCT c.Id_compra) as NumeroCompras,
                    SUM(dc.Subtotal) as TotalInvertido,
                    AVG(dc.PrecioUnitario) as PrecioPromedio
                FROM DetalleCompra dc
                INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
                INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
                LEFT JOIN Categoria cat ON p.Id_categoria = cat.Id_categoria
                ${whereClause}
                GROUP BY p.Id_Producto, p.Nombre, p.Descripcion, cat.Nombre
                ORDER BY TotalComprado DESC
            `);

            console.log(`📈 Top ${limit} productos más comprados obtenidos`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener productos más comprados:', error);
            throw error;
        }
    }
}

module.exports = new CompraService();