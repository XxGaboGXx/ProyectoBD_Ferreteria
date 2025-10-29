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

    /**
     * Crear nueva venta
     */
    async create(data) {
        const pool = await getConnection();
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // Calcular total
            let totalVenta = 0;
            data.detalles.forEach(detalle => {
                totalVenta += detalle.cantidad * detalle.precioUnitario;
            });

            // Insertar venta
            const ventaResult = await transaction.request()
                .input('fecha', sql.DateTime, data.fecha || new Date())
                .input('total', sql.Decimal(12, 2), totalVenta)
                .input('metodoPago', sql.VarChar, data.metodoPago)
                .input('estado', sql.VarChar, 'Completada')
                .input('clienteId', sql.Int, data.clienteId)
                .input('colaboradorId', sql.Int, data.colaboradorId)
                .query(`
                    INSERT INTO Venta (Fecha, TotalVenta, MetodoPago, Estado, Id_cliente, Id_colaborador)
                    OUTPUT INSERTED.Id_venta
                    VALUES (@fecha, @total, @metodoPago, @estado, @clienteId, @colaboradorId)
                `);

            const ventaId = ventaResult.recordset[0].Id_venta;

            // Insertar detalles y actualizar stock
            for (let i = 0; i < data.detalles.length; i++) {
                const detalle = data.detalles[i];
                const subtotal = detalle.cantidad * detalle.precioUnitario;

                // Verificar stock disponible
                const stockCheck = await transaction.request()
                    .input('productoId', sql.Int, detalle.productoId)
                    .query('SELECT CantidadActual, Nombre FROM Producto WHERE Id_Producto = @productoId');

                if (stockCheck.recordset.length === 0) {
                    throw new Error(`Producto ${detalle.productoId} no encontrado`);
                }

                const stockActual = stockCheck.recordset[0].CantidadActual;
                const nombreProducto = stockCheck.recordset[0].Nombre;

                if (stockActual < detalle.cantidad) {
                    throw new Error(`Stock insuficiente para ${nombreProducto}. Disponible: ${stockActual}, Solicitado: ${detalle.cantidad}`);
                }

                // Insertar detalle
                await transaction.request()
                    .input('cantidad', sql.Int, detalle.cantidad)
                    .input('linea', sql.Int, i + 1)
                    .input('precio', sql.Decimal(12, 2), detalle.precioUnitario)
                    .input('subtotal', sql.Decimal(12, 2), subtotal)
                    .input('ventaId', sql.Int, ventaId)
                    .input('productoId', sql.Int, detalle.productoId)
                    .query(`
                        INSERT INTO DetalleVenta (CantidadVenta, NumeroLinea, PrecioUnitario, Subtotal, Id_venta, Id_producto)
                        VALUES (@cantidad, @linea, @precio, @subtotal, @ventaId, @productoId)
                    `);

                // Actualizar stock
                await transaction.request()
                    .input('cantidad', sql.Int, detalle.cantidad)
                    .input('productoId', sql.Int, detalle.productoId)
                    .query(`
                        UPDATE Producto 
                        SET CantidadActual = CantidadActual - @cantidad 
                        WHERE Id_Producto = @productoId
                    `);
            }

            await transaction.commit();

            return await this.getById(ventaId);

        } catch (error) {
            await transaction.rollback();
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
            await transaction.begin();

            // Obtener venta
            const venta = await this.getById(id);
            
            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            if (venta.Estado === 'Cancelada') {
                throw new Error('La venta ya está cancelada');
            }

            // Actualizar estado
            await transaction.request()
                .input('id', sql.Int, id)
                .query(`UPDATE Venta SET Estado = 'Cancelada' WHERE Id_venta = @id`);

            // Devolver stock
            for (const detalle of venta.detalles) {
                await transaction.request()
                    .input('cantidad', sql.Int, detalle.CantidadVenta)
                    .input('productoId', sql.Int, detalle.Id_Producto)
                    .query(`
                        UPDATE Producto 
                        SET CantidadActual = CantidadActual + @cantidad 
                        WHERE Id_Producto = @productoId
                    `);
            }

            await transaction.commit();

            return { 
                id, 
                estado: 'Cancelada', 
                motivo,
                message: 'Venta cancelada y stock devuelto exitosamente'
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new VentaService();