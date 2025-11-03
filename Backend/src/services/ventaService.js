const { getConnection, sql } = require('../config/database');

class VentaService {
    /**
     * Obtener todas las ventas con paginación y filtros
     */
    async getAll(page = 1, limit = 50, filters = {}) {
        const pool = await getConnection();
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (filters.estado) {
            whereClause += ' AND v.Estado = @estado';
            params.push({ name: 'estado', type: sql.VarChar, value: filters.estado });
        }

        if (filters.fechaInicio) {
            whereClause += ' AND v.Fecha >= @fechaInicio';
            params.push({ name: 'fechaInicio', type: sql.DateTime, value: filters.fechaInicio });
        }

        if (filters.fechaFin) {
            whereClause += ' AND v.Fecha <= @fechaFin';
            params.push({ name: 'fechaFin', type: sql.DateTime, value: filters.fechaFin });
        }

        if (filters.clienteId) {
            whereClause += ' AND v.Id_cliente = @clienteId';
            params.push({ name: 'clienteId', type: sql.Int, value: filters.clienteId });
        }

        const query = `
            SELECT 
                v.Id_venta,
                v.Fecha,
                v.TotalVenta,
                v.MetodoPago,
                v.Estado,
                c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') as Cliente,
                col.Nombre + ' ' + col.Apellido1 + ISNULL(' ' + col.Apellido2, '') as Colaborador,
                (SELECT COUNT(*) FROM DetalleVenta WHERE Id_venta = v.Id_venta) as CantidadItems
            FROM Venta v
            INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
            INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
            ${whereClause}
            ORDER BY v.Fecha DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        let request = pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit);

        params.forEach(p => request.input(p.name, p.type, p.value));

        const result = await request.query(query);

        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM Venta v ${whereClause}`;
        let countRequest = pool.request();
        params.forEach(p => countRequest.input(p.name, p.type, p.value));
        const countResult = await countRequest.query(countQuery);

        return {
            data: result.recordset,
            pagination: {
                page,
                limit,
                total: countResult.recordset[0].total,
                totalPages: Math.ceil(countResult.recordset[0].total / limit)
            }
        };
    }

    /**
     * Obtener venta por ID con detalles
     */
    async getById(id) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    v.*,
                    c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') as ClienteNombre,
                    c.Telefono as ClienteTelefono,
                    c.Correo as ClienteCorreo,
                    col.Nombre + ' ' + col.Apellido1 + ISNULL(' ' + col.Apellido2, '') as ColaboradorNombre
                FROM Venta v
                INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
                INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
                WHERE v.Id_venta = @id
            `);

        if (result.recordset.length === 0) return null;

        const venta = result.recordset[0];

        // Obtener detalles
        const detalles = await pool.request()
            .input('ventaId', sql.Int, id)
            .query(`
                SELECT 
                    dv.Id_detalleVenta,
                    dv.CantidadVenta,
                    dv.NumeroLinea,
                    dv.PrecioUnitario,
                    dv.Subtotal,
                    p.Id_Producto,
                    p.Nombre as ProductoNombre,
                    p.Descripcion as ProductoDescripcion
                FROM DetalleVenta dv
                INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
                WHERE dv.Id_venta = @ventaId
                ORDER BY dv.NumeroLinea
            `);

        venta.detalles = detalles.recordset;

        return venta;
    }
    async getDetalles(ventaId) {
        const pool = await getConnection();
        
        try {
            // Verificar que la venta existe
            const ventaExists = await pool.request()
                .input('ventaId', sql.Int, ventaId)
                .query('SELECT Id_venta FROM Venta WHERE Id_venta = @ventaId');
            
            if (ventaExists.recordset.length === 0) {
                throw new Error(`Venta con ID ${ventaId} no encontrada`);
            }

            // Obtener detalles con información completa
            const result = await pool.request()
                .input('ventaId', sql.Int, ventaId)
                .query(`
                    SELECT 
                        dv.Id_detalleVenta,
                        dv.CantidadVenta,
                        dv.NumeroLinea,
                        dv.PrecioUnitario,
                        dv.Subtotal,
                        dv.Id_producto,
                        p.Nombre as ProductoNombre,
                        p.Descripcion as ProductoDescripcion,
                        p.CodigoBarra,
                        c.Nombre as Categoria
                    FROM DetalleVenta dv
                    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
                    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                    WHERE dv.Id_venta = @ventaId
                    ORDER BY dv.NumeroLinea
                `);

            console.log(`📋 Detalles de venta ${ventaId}: ${result.recordset.length} items`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener detalles de venta:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de ventas
     */
   async getEstadisticas(filters = {}) {
        const pool = await getConnection();
        
        try {
            const params = [];
            let whereFechas = '';

            if (filters.fechaInicio || filters.fechaFin) {
                whereFechas = 'WHERE 1=1';
                
                if (filters.fechaInicio) {
                    whereFechas += ' AND Fecha >= @fechaInicio';
                    params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(filters.fechaInicio) });
                }

                if (filters.fechaFin) {
                    whereFechas += ' AND Fecha <= @fechaFin';
                    params.push({ name: 'fechaFin', type: sql.DateTime, value: new Date(filters.fechaFin) });
                }
            }

            let request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));

            // 1. Estadísticas de ventas completadas
            const ventasCompletadas = await request.query(`
                SELECT 
                    COUNT(*) as TotalVentas,
                    ISNULL(SUM(TotalVenta), 0) as VentaTotal,
                    ISNULL(AVG(TotalVenta), 0) as PromedioVenta,
                    ISNULL(MAX(TotalVenta), 0) as VentaMayor,
                    ISNULL(MIN(TotalVenta), 0) as VentaMenor,
                    COUNT(DISTINCT Id_cliente) as ClientesUnicos
                FROM Venta
                WHERE Estado = 'Completada'
                ${whereFechas.replace('WHERE 1=1', '')}
            `);

            // 2. Ventas canceladas
            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));
            
            const ventasCanceladas = await request.query(`
                SELECT COUNT(*) as total
                FROM Venta
                WHERE Estado = 'Cancelada'
                ${whereFechas.replace('WHERE 1=1', '')}
            `);

            // 3. Ventas pendientes
            request = pool.request();
            params.forEach(p => request.input(p.name, p.type, p.value));
            
            const ventasPendientes = await request.query(`
                SELECT COUNT(*) as total
                FROM Venta
                WHERE Estado = 'Pendiente'
                ${whereFechas.replace('WHERE 1=1', '')}
            `);

            const estadisticas = {
                TotalVentas: ventasCompletadas.recordset[0].TotalVentas,
                VentaTotal: parseFloat(ventasCompletadas.recordset[0].VentaTotal.toFixed(2)),
                PromedioVenta: parseFloat(ventasCompletadas.recordset[0].PromedioVenta.toFixed(2)),
                VentaMayor: parseFloat(ventasCompletadas.recordset[0].VentaMayor.toFixed(2)),
                VentaMenor: parseFloat(ventasCompletadas.recordset[0].VentaMenor.toFixed(2)),
                ClientesUnicos: ventasCompletadas.recordset[0].ClientesUnicos,
                VentasCanceladas: ventasCanceladas.recordset[0].total,
                VentasPendientes: ventasPendientes.recordset[0].total
            };

            console.log('📊 Estadísticas de ventas calculadas:', estadisticas);

            return estadisticas;

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }
    /**
     * Obtener productos más vendidos
     */
    async getProductosMasVendidos(limit = 10, filters = {}) {
        const pool = await getConnection();
        
        try {
            let whereClause = "WHERE v.Estado = 'Completada'";
            const params = [];

            if (filters.fechaInicio) {
                whereClause += ' AND v.Fecha >= @fechaInicio';
                params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(filters.fechaInicio) });
            }

            if (filters.fechaFin) {
                whereClause += ' AND v.Fecha <= @fechaFin';
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
                    c.Nombre as Categoria,
                    SUM(dv.CantidadVenta) as TotalVendido,
                    COUNT(DISTINCT v.Id_venta) as NumeroVentas,
                    SUM(dv.Subtotal) as TotalIngresos,
                    AVG(dv.PrecioUnitario) as PrecioPromedio
                FROM DetalleVenta dv
                INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
                INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
                LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                ${whereClause}
                GROUP BY p.Id_Producto, p.Nombre, p.Descripcion, c.Nombre
                ORDER BY TotalVendido DESC
            `);

            console.log(`📈 Top ${limit} productos más vendidos obtenidos`);

            return result.recordset;

        } catch (error) {
            console.error('❌ Error al obtener productos más vendidos:', error);
            throw error;
        }
    }

    /**
     * Crear nueva venta
     */
   async create(data) {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            console.log('🛒 Iniciando creación de venta:', data);

            // Validar datos requeridos
            if (!data.Id_cliente || !data.Id_colaborador) {
                throw new Error('Cliente y colaborador son requeridos');
            }

            if (!data.detalles || !Array.isArray(data.detalles) || data.detalles.length === 0) {
                throw new Error('Debe incluir al menos un producto en la venta');
            }

            // Iniciar transacción
            await transaction.begin();

            // 1. Crear la venta principal
            const ventaRequest = new sql.Request(transaction);
            const ventaResult = await ventaRequest
                .input('fecha', sql.DateTime, data.Fecha || new Date())
                .input('totalVenta', sql.Decimal(12, 2), data.TotalVenta || 0)
                .input('metodoPago', sql.VarChar(20), data.MetodoPago || 'Efectivo')
                .input('estado', sql.VarChar(20), data.Estado || 'Completada')
                .input('idCliente', sql.Int, data.Id_cliente)
                .input('idColaborador', sql.Int, data.Id_colaborador)
                .query(`
                    INSERT INTO Venta (Fecha, TotalVenta, MetodoPago, Estado, Id_cliente, Id_colaborador)
                    OUTPUT INSERTED.*
                    VALUES (@fecha, @totalVenta, @metodoPago, @estado, @idCliente, @idColaborador)
                `);

            const venta = ventaResult.recordset[0];
            console.log(`✅ Venta creada con ID: ${venta.Id_venta}`);

            // 2. Insertar detalles de la venta y actualizar inventario
            let totalCalculado = 0;
            const detallesCreados = [];

            for (let i = 0; i < data.detalles.length; i++) {
                const detalle = data.detalles[i];

                // Validar producto
                if (!detalle.Id_producto || !detalle.CantidadVenta || !detalle.PrecioUnitario) {
                    throw new Error(`Detalle ${i + 1}: Producto, cantidad y precio son requeridos`);
                }

                // Verificar stock disponible
                const stockRequest = new sql.Request(transaction);
                const stockResult = await stockRequest
                    .input('idProducto', sql.Int, detalle.Id_producto)
                    .query('SELECT CantidadActual, Nombre FROM Producto WHERE Id_Producto = @idProducto');

                if (stockResult.recordset.length === 0) {
                    throw new Error(`Producto con ID ${detalle.Id_producto} no encontrado`);
                }

                const producto = stockResult.recordset[0];
                if (producto.CantidadActual < detalle.CantidadVenta) {
                    throw new Error(`Stock insuficiente para ${producto.Nombre}. Disponible: ${producto.CantidadActual}, Solicitado: ${detalle.CantidadVenta}`);
                }

                // Calcular subtotal
                const subtotal = detalle.CantidadVenta * detalle.PrecioUnitario;
                totalCalculado += subtotal;

                // Insertar detalle de venta
                const detalleRequest = new sql.Request(transaction);
                const detalleResult = await detalleRequest
                    .input('cantidadVenta', sql.Int, detalle.CantidadVenta)
                    .input('numeroLinea', sql.Int, i + 1)
                    .input('precioUnitario', sql.Decimal(10, 2), detalle.PrecioUnitario)
                    .input('subtotal', sql.Decimal(10, 2), subtotal)
                    .input('idVenta', sql.Int, venta.Id_venta)
                    .input('idProducto', sql.Int, detalle.Id_producto)
                    .query(`
                        INSERT INTO DetalleVenta (CantidadVenta, NumeroLinea, PrecioUnitario, Subtotal, Id_venta, Id_producto)
                        OUTPUT INSERTED.*
                        VALUES (@cantidadVenta, @numeroLinea, @precioUnitario, @subtotal, @idVenta, @idProducto)
                    `);

                // Actualizar inventario
                const updateStockRequest = new sql.Request(transaction);
                await updateStockRequest
                    .input('cantidad', sql.Int, detalle.CantidadVenta)
                    .input('idProducto', sql.Int, detalle.Id_producto)
                    .query(`
                        UPDATE Producto 
                        SET CantidadActual = CantidadActual - @cantidad,
                            FechaSalida = GETDATE()
                        WHERE Id_Producto = @idProducto
                    `);

                detallesCreados.push(detalleResult.recordset[0]);
                console.log(`  ✓ Detalle ${i + 1}: ${producto.Nombre} - Cantidad: ${detalle.CantidadVenta}`);
            }

            // 3. Actualizar total de venta si es necesario
            if (data.TotalVenta === 0 || !data.TotalVenta) {
                const updateVentaRequest = new sql.Request(transaction);
                await updateVentaRequest
                    .input('total', sql.Decimal(12, 2), totalCalculado)
                    .input('idVenta', sql.Int, venta.Id_venta)
                    .query('UPDATE Venta SET TotalVenta = @total WHERE Id_venta = @idVenta');

                venta.TotalVenta = totalCalculado;
            }

            // Commit de la transacción
            await transaction.commit();
            console.log(`✅ Venta completada exitosamente. Total: ${venta.TotalVenta}`);

            return {
                ...venta,
                detalles: detallesCreados
            };

        } catch (error) {
            // Rollback en caso de error
            if (transaction._aborted === false) {
                await transaction.rollback();
            }
            console.error('❌ Error al crear venta:', error);
            throw error;
        }
    }


    /**
     * Cancelar venta
     */
     async cancelarVenta(id, motivo) {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            console.log(`⚠️  Cancelando venta ${id}. Motivo: ${motivo || 'No especificado'}`);

            await transaction.begin();

            // 1. Verificar que la venta existe
            const ventaRequest = new sql.Request(transaction);
            const ventaResult = await ventaRequest
                .input('id', sql.Int, id)
                .query('SELECT * FROM Venta WHERE Id_venta = @id');

            if (ventaResult.recordset.length === 0) {
                throw new Error(`Venta con ID ${id} no encontrada`);
            }

            const venta = ventaResult.recordset[0];

            if (venta.Estado === 'Cancelada') {
                throw new Error('La venta ya está cancelada');
            }

            // 2. Obtener detalles de la venta
            const detallesRequest = new sql.Request(transaction);
            const detallesResult = await detallesRequest
                .input('ventaId', sql.Int, id)
                .query('SELECT * FROM DetalleVenta WHERE Id_venta = @ventaId');

            // 3. Restaurar inventario solo si la venta estaba completada
            if (venta.Estado === 'Completada') {
                for (const detalle of detallesResult.recordset) {
                    const updateStockRequest = new sql.Request(transaction);
                    await updateStockRequest
                        .input('cantidad', sql.Int, detalle.CantidadVenta)
                        .input('idProducto', sql.Int, detalle.Id_producto)
                        .query(`
                            UPDATE Producto 
                            SET CantidadActual = CantidadActual + @cantidad
                            WHERE Id_Producto = @idProducto
                        `);

                    console.log(`  ✓ Restaurado stock del producto ${detalle.Id_producto}: +${detalle.CantidadVenta}`);
                }
            }

            // 4. Actualizar estado de la venta
            const cancelRequest = new sql.Request(transaction);
            const cancelResult = await cancelRequest
                .input('id', sql.Int, id)
                .query(`
                    UPDATE Venta
                    SET Estado = 'Cancelada'
                    OUTPUT INSERTED.*
                    WHERE Id_venta = @id
                `);

            await transaction.commit();
            console.log(`✅ Venta ${id} cancelada exitosamente`);

            return {
                venta: cancelResult.recordset[0],
                motivoCancelacion: motivo || 'No especificado',
                productosRestaurados: detallesResult.recordset.length,
                inventarioRestaurado: venta.Estado === 'Completada'
            };

        } catch (error) {
            if (transaction._aborted === false) {
                await transaction.rollback();
            }
            console.error('❌ Error al cancelar venta:', error);
            throw error;
        }
    }
}
module.exports = new VentaService();