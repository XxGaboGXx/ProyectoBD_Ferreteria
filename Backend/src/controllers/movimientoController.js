const { getConnection, sql } = require('../config/database');

const movimientoController = {
    // Obtener todos los movimientos
    getAll: async (req, res) => {
        try {
            const pool = await getConnection();
            const { tipo, productoId, fechaInicio, fechaFin } = req.query;

            let query = `
                SELECT 
                    m.Id_movimiento,
                    m.FechaMovimiento,
                    m.TipoMovimiento,
                    m.Cantidad,
                    m.Motivo,
                    m.Id_producto,
                    p.Nombre AS NombreProducto,
                    p.CantidadActual
                FROM MovimientoInventario m
                INNER JOIN Producto p ON m.Id_producto = p.Id_Producto
                WHERE 1=1
            `;

            const params = [];

            if (tipo) {
                query += ` AND m.TipoMovimiento = @tipo`;
                params.push({ name: 'tipo', type: sql.VarChar(50), value: tipo });
            }

            if (productoId) {
                query += ` AND m.Id_producto = @productoId`;
                params.push({ name: 'productoId', type: sql.Int, value: parseInt(productoId) });
            }

            if (fechaInicio) {
                query += ` AND m.FechaMovimiento >= @fechaInicio`;
                params.push({ name: 'fechaInicio', type: sql.DateTime, value: new Date(fechaInicio) });
            }

            if (fechaFin) {
                query += ` AND m.FechaMovimiento <= @fechaFin`;
                params.push({ name: 'fechaFin', type: sql.DateTime, value: new Date(fechaFin) });
            }

            query += ` ORDER BY m.FechaMovimiento DESC`;

            let request = pool.request();
            params.forEach(param => {
                request.input(param.name, param.type, param.value);
            });

            const result = await request.query(query);

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener movimientos',
                details: error.message
            });
        }
    },

    // Obtener movimiento por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await getConnection();

            const result = await pool.request()
                .input('id', sql.Int, parseInt(id))
                .query(`
                    SELECT 
                        m.Id_movimiento,
                        m.FechaMovimiento,
                        m.TipoMovimiento,
                        m.Cantidad,
                        m.Motivo,
                        m.Id_producto,
                        p.Nombre AS NombreProducto,
                        p.CantidadActual
                    FROM MovimientoInventario m
                    INNER JOIN Producto p ON m.Id_producto = p.Id_Producto
                    WHERE m.Id_movimiento = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Movimiento no encontrado'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('Error al obtener movimiento:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener movimiento',
                details: error.message
            });
        }
    },

    // Crear nuevo movimiento
    create: async (req, res) => {
        try {
            const { Id_producto, TipoMovimiento, Cantidad, Motivo } = req.body;

            // Validaciones
            if (!Id_producto || !TipoMovimiento || !Cantidad) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos'
                });
            }

            if (!['Entrada', 'Salida', 'Ajuste'].includes(TipoMovimiento)) {
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de movimiento inválido'
                });
            }

            const pool = await getConnection();

            const result = await pool.request()
                .input('Id_producto', sql.Int, Id_producto)
                .input('TipoMovimiento', sql.VarChar(50), TipoMovimiento)
                .input('Cantidad', sql.Int, Cantidad)
                .input('Motivo', sql.VarChar(255), Motivo || null)
                .query(`
                    INSERT INTO MovimientoInventario (FechaMovimiento, TipoMovimiento, Cantidad, Motivo, Id_producto)
                    VALUES (GETDATE(), @TipoMovimiento, @Cantidad, @Motivo, @Id_producto);
                    SELECT SCOPE_IDENTITY() AS Id;
                `);

            res.status(201).json({
                success: true,
                message: 'Movimiento creado exitosamente',
                data: { id: result.recordset[0].Id }
            });
        } catch (error) {
            console.error('Error al crear movimiento:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear movimiento',
                details: error.message
            });
        }
    },

    // Obtener movimientos por producto
    getByProducto: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await getConnection();

            const result = await pool.request()
                .input('productoId', sql.Int, parseInt(id))
                .query(`
                    SELECT 
                        m.Id_movimiento,
                        m.FechaMovimiento,
                        m.TipoMovimiento,
                        m.Cantidad,
                        m.Motivo
                    FROM MovimientoInventario m
                    WHERE m.Id_producto = @productoId
                    ORDER BY m.FechaMovimiento DESC
                `);

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('Error al obtener movimientos del producto:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener movimientos del producto',
                details: error.message
            });
        }
    },

    // Obtener movimientos por tipo
    getByTipo: async (req, res) => {
        try {
            const { tipo } = req.params;
            const pool = await getConnection();

            const result = await pool.request()
                .input('tipo', sql.VarChar(50), tipo)
                .query(`
                    SELECT 
                        m.Id_movimiento,
                        m.FechaMovimiento,
                        m.TipoMovimiento,
                        m.Cantidad,
                        m.Motivo,
                        m.Id_producto,
                        p.Nombre AS NombreProducto
                    FROM MovimientoInventario m
                    INNER JOIN Producto p ON m.Id_producto = p.Id_Producto
                    WHERE m.TipoMovimiento = @tipo
                    ORDER BY m.FechaMovimiento DESC
                `);

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('Error al obtener movimientos por tipo:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener movimientos por tipo',
                details: error.message
            });
        }
    }
};

module.exports = movimientoController;