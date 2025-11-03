const { getConnection, sql } = require('../config/database');

class DashboardService {
    /**
     * Obtener resumen general del dashboard
     */
    async getDashboardSummary() {
        const pool = await getConnection();

        try {
            const [
                ventasHoy,
                ventasMes,
                productosTotal,
                productosLowStock,
                clientesTotal,
                alquileresActivos,
                topProductos,
                ventasRecientes
            ] = await Promise.all([
                this.getVentasHoy(pool),
                this.getVentasMes(pool),
                this.getProductosTotal(pool),
                this.getProductosLowStock(pool),
                this.getClientesTotal(pool),
                this.getAlquileresActivos(pool),
                this.getTopProductos(pool),
                this.getVentasRecientes(pool)
            ]);

            return {
                ventas: {
                    hoy: ventasHoy,
                    mes: ventasMes
                },
                inventario: {
                    totalProductos: productosTotal.total,
                    unidadesTotal: productosTotal.unidadesTotal,
                    valorInventario: productosTotal.valorInventario,
                    lowStock: productosLowStock
                },
                clientes: {
                    total: clientesTotal.total,
                    nuevosHoy: clientesTotal.nuevosHoy
                },
                alquileres: {
                    activos: alquileresActivos.total,
                    valorTotal: alquileresActivos.valorTotal,
                    vencidos: alquileresActivos.vencidos
                },
                topProductos,
                ventasRecientes
            };
        } catch (error) {
            console.error('❌ Error en getDashboardSummary:', error);
            throw error;
        }
    }

    async getVentasHoy(pool) {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as cantidad,
                ISNULL(SUM(TotalVenta), 0) as total,
                ISNULL(AVG(TotalVenta), 0) as promedio
            FROM Venta
            WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
            AND Estado = 'Completada'
        `);
        return result.recordset[0];
    }

    async getVentasMes(pool) {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as cantidad,
                ISNULL(SUM(TotalVenta), 0) as total,
                ISNULL(AVG(TotalVenta), 0) as promedio
            FROM Venta
            WHERE YEAR(Fecha) = YEAR(GETDATE())
            AND MONTH(Fecha) = MONTH(GETDATE())
            AND Estado = 'Completada'
        `);
        return result.recordset[0];
    }

    async getProductosTotal(pool) {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                ISNULL(SUM(CantidadActual), 0) as unidadesTotal,
                ISNULL(SUM(CantidadActual * PrecioVenta), 0) as valorInventario
            FROM Producto
        `);
        return result.recordset[0];
    }

    async getProductosLowStock(pool) {
        const result = await pool.request().query(`
            SELECT COUNT(*) as cantidad
            FROM Producto
            WHERE CantidadActual <= CantidadMinima
        `);
        return result.recordset[0].cantidad;
    }

    async getClientesTotal(pool) {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                0 as nuevosHoy
            FROM Cliente
        `);
        return result.recordset[0];
    }

    async getAlquileresActivos(pool) {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                ISNULL(SUM(TotalAlquiler), 0) as valorTotal,
                SUM(CASE WHEN FechaFin < GETDATE() THEN 1 ELSE 0 END) as vencidos
            FROM Alquiler
            WHERE Estado = 'ACTIVO'
        `);
        return result.recordset[0];
    }

    async getTopProductos(pool, limit = 5) {
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    p.Id_Producto,
                    p.Nombre,
                    p.PrecioVenta,
                    COUNT(dv.Id_detalleVenta) as cantidadVentas,
                    SUM(dv.CantidadVenta) as unidadesVendidas,
                    SUM(dv.Subtotal) as totalVentas
                FROM DetalleVenta dv
                INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
                INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
                WHERE v.Estado = 'Completada'
                AND v.Fecha >= DATEADD(MONTH, -1, GETDATE())
                GROUP BY p.Id_Producto, p.Nombre, p.PrecioVenta
                ORDER BY unidadesVendidas DESC
            `);
        return result.recordset;
    }

    async getVentasRecientes(pool, limit = 10) {
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    v.Id_venta,
                    v.TotalVenta,
                    v.Fecha,
                    v.Estado,
                    v.MetodoPago,
                    c.Nombre + ' ' + c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteNombre,
                    col.Nombre + ' ' + col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorNombre,
                    COUNT(dv.Id_detalleVenta) as CantidadItems
                FROM Venta v
                INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
                INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
                LEFT JOIN DetalleVenta dv ON v.Id_venta = dv.Id_venta
                GROUP BY v.Id_venta, v.TotalVenta, v.Fecha, v.Estado, v.MetodoPago,
                         c.Nombre, c.Apellido1, c.Apellido2, col.Nombre, col.Apellido1, col.Apellido2
                ORDER BY v.Fecha DESC
            `);
        return result.recordset;
    }

    async getVentasPorDia(days = 30) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('days', sql.Int, days)
                .query(`
                    WITH Fechas AS (
                        SELECT TOP (@days)
                            CAST(DATEADD(DAY, -ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 1, GETDATE()) AS DATE) as Fecha
                        FROM sys.all_objects
                    )
                    SELECT 
                        f.Fecha,
                        DATENAME(WEEKDAY, f.Fecha) as DiaSemana,
                        ISNULL(COUNT(v.Id_venta), 0) as CantidadVentas,
                        ISNULL(SUM(v.TotalVenta), 0) as TotalVentas,
                        ISNULL(AVG(v.TotalVenta), 0) as PromedioVenta
                    FROM Fechas f
                    LEFT JOIN Venta v ON CAST(v.Fecha AS DATE) = f.Fecha AND v.Estado = 'Completada'
                    GROUP BY f.Fecha
                    ORDER BY f.Fecha ASC
                `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorDia:', error);
            throw error;
        }
    }

    async getVentasPorCategoria() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request().query(`
                SELECT 
                    c.Nombre as Categoria,
                    COUNT(DISTINCT dv.Id_venta) as CantidadVentas,
                    SUM(dv.CantidadVenta) as UnidadesVendidas,
                    SUM(dv.Subtotal) as TotalVentas,
                    AVG(dv.Subtotal) as PromedioVenta
                FROM DetalleVenta dv
                INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
                INNER JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
                WHERE v.Estado = 'Completada'
                AND v.Fecha >= DATEADD(MONTH, -1, GETDATE())
                GROUP BY c.Id_categoria, c.Nombre
                ORDER BY TotalVentas DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorCategoria:', error);
            throw error;
        }
    }

    async getVentasPorMetodoPago() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request().query(`
                SELECT 
                    MetodoPago,
                    COUNT(*) as CantidadVentas,
                    SUM(TotalVenta) as TotalVentas,
                    AVG(TotalVenta) as PromedioVenta,
                    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2)) as Porcentaje
                FROM Venta
                WHERE Estado = 'Completada'
                AND Fecha >= DATEADD(MONTH, -1, GETDATE())
                GROUP BY MetodoPago
                ORDER BY TotalVentas DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getVentasPorMetodoPago:', error);
            throw error;
        }
    }

    async getTopClientes(limit = 10) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit)
                        c.Id_cliente,
                        c.Nombre,
                        c.Apellido1,
                        c.Apellido2,
                        c.Telefono,
                        c.Correo,
                        COUNT(v.Id_venta) as CantidadCompras,
                        SUM(v.TotalVenta) as TotalGastado,
                        AVG(v.TotalVenta) as PromedioCompra,
                        MAX(v.Fecha) as UltimaCompra
                    FROM Cliente c
                    INNER JOIN Venta v ON c.Id_cliente = v.Id_cliente
                    WHERE v.Estado = 'Completada'
                    GROUP BY c.Id_cliente, c.Nombre, c.Apellido1, c.Apellido2, c.Telefono, c.Correo
                    ORDER BY TotalGastado DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getTopClientes:', error);
            throw error;
        }
    }

    async getRendimientoColaboradores() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request().query(`
                SELECT 
                    col.Id_colaborador,
                    col.Nombre,
                    col.Apellido1,
                    col.Apellido2,
                    COUNT(v.Id_venta) as CantidadVentas,
                    ISNULL(SUM(v.TotalVenta), 0) as TotalVentas,
                    ISNULL(AVG(v.TotalVenta), 0) as PromedioVenta,
                    MAX(v.Fecha) as UltimaVenta
                FROM Colaborador col
                LEFT JOIN Venta v ON col.Id_colaborador = v.Id_colaborador 
                    AND v.Estado = 'Completada'
                    AND v.Fecha >= DATEADD(MONTH, -1, GETDATE())
                GROUP BY col.Id_colaborador, col.Nombre, col.Apellido1, col.Apellido2
                ORDER BY TotalVentas DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getRendimientoColaboradores:', error);
            throw error;
        }
    }

    async getAnalisisInventario() {
        const pool = await getConnection();
        
        try {
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as TotalProductos,
                    SUM(CantidadActual) as UnidadesTotales,
                    SUM(CantidadActual * PrecioVenta) as ValorInventario,
                    COUNT(CASE WHEN CantidadActual <= CantidadMinima THEN 1 END) as ProductosStockBajo,
                    COUNT(CASE WHEN CantidadActual = 0 THEN 1 END) as ProductosAgotados,
                    AVG(CantidadActual) as PromedioStock,
                    MIN(CantidadActual) as StockMinimoActual,
                    MAX(CantidadActual) as StockMaximoActual
                FROM Producto
            `);

            const categorias = await pool.request().query(`
                SELECT 
                    c.Nombre as Categoria,
                    COUNT(p.Id_Producto) as CantidadProductos,
                    SUM(p.CantidadActual) as UnidadesTotales,
                    SUM(p.CantidadActual * p.PrecioVenta) as ValorInventario,
                    AVG(p.PrecioVenta) as PrecioPromedio
                FROM Categoria c
                LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
                GROUP BY c.Id_categoria, c.Nombre
                ORDER BY ValorInventario DESC
            `);

            return {
                resumen: result.recordset[0],
                porCategoria: categorias.recordset
            };
        } catch (error) {
            console.error('❌ Error en getAnalisisInventario:', error);
            throw error;
        }
    }

    async getMovimientosRecientes(limit = 20) {
        const pool = await getConnection();
        
        try {
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit)
                        dm.Id_detalleMovimiento,
                        dm.Cantidad,
                        dm.Descripcion,
                        m.Fecha,
                        p.Nombre as ProductoNombre,
                        p.CantidadActual as StockActual,
                        c.Nombre as CategoriaNombre,
                        tdm.Nombre as TipoMovimiento
                    FROM DetalleMovimiento dm
                    INNER JOIN Movimiento m ON dm.Id_movimiento = m.Id_movimiento
                    INNER JOIN Producto p ON dm.Id_producto = p.Id_Producto
                    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                    INNER JOIN TipoDetalleMovimiento tdm ON dm.Id_tipoDetalleMovimiento = tdm.Id_tipoDetalleMovimiento
                    ORDER BY m.Fecha DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getMovimientosRecientes:', error);
            throw error;
        }
    }

    async getResumenFinanciero() {
        const pool = await getConnection();

        try {
            const ventasHoy = await pool.request().query(`
                SELECT 
                    ISNULL(SUM(TotalVenta), 0) as total,
                    COUNT(*) as cantidad
                FROM Venta
                WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
                AND Estado = 'Completada'
            `);

            const ventasSemana = await pool.request().query(`
                SELECT 
                    ISNULL(SUM(TotalVenta), 0) as total,
                    COUNT(*) as cantidad
                FROM Venta
                WHERE Fecha >= DATEADD(DAY, -7, GETDATE())
                AND Estado = 'Completada'
            `);

            const ventasMes = await pool.request().query(`
                SELECT 
                    ISNULL(SUM(TotalVenta), 0) as total,
                    COUNT(*) as cantidad
                FROM Venta
                WHERE YEAR(Fecha) = YEAR(GETDATE())
                AND MONTH(Fecha) = MONTH(GETDATE())
                AND Estado = 'Completada'
            `);

            const comprasMes = await pool.request().query(`
                SELECT 
                    ISNULL(SUM(TotalCompra), 0) as total,
                    COUNT(*) as cantidad
                FROM Compra
                WHERE YEAR(FechaCompra) = YEAR(GETDATE())
                AND MONTH(FechaCompra) = MONTH(GETDATE())
            `);

            const alquileresActivos = await pool.request().query(`
                SELECT 
                    ISNULL(SUM(TotalAlquiler), 0) as total,
                    COUNT(*) as cantidad
                FROM Alquiler
                WHERE Estado = 'ACTIVO'
            `);

            return {
                hoy: ventasHoy.recordset[0],
                semana: ventasSemana.recordset[0],
                mes: {
                    ventas: ventasMes.recordset[0],
                    compras: comprasMes.recordset[0],
                    utilidadBruta: ventasMes.recordset[0].total - comprasMes.recordset[0].total
                },
                alquileres: alquileresActivos.recordset[0]
            };
        } catch (error) {
            console.error('❌ Error en getResumenFinanciero:', error);
            throw error;
        }
    }

    async getAlertas() {
        const pool = await getConnection();

        try {
            const stockBajo = await pool.request().query(`
                SELECT 
                    p.Id_Producto,
                    p.Nombre,
                    p.CantidadActual,
                    p.CantidadMinima,
                    (p.CantidadMinima - p.CantidadActual) as Faltante,
                    c.Nombre as Categoria
                FROM Producto p
                LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                WHERE p.CantidadActual <= p.CantidadMinima
                ORDER BY Faltante DESC
            `);

            const alquileresVencidos = await pool.request().query(`
                SELECT 
                    a.Id_alquiler,
                    a.FechaFin,
                    DATEDIFF(DAY, a.FechaFin, GETDATE()) as DiasVencidos,
                    c.Nombre + ' ' + c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteNombre,
                    c.Telefono as ClienteTelefono,
                    a.TotalAlquiler
                FROM Alquiler a
                INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
                WHERE a.Estado = 'ACTIVO'
                AND a.FechaFin < GETDATE()
                ORDER BY DiasVencidos DESC
            `);

            const sinMovimiento = await pool.request().query(`
                SELECT TOP 10
                    p.Id_Producto,
                    p.Nombre,
                    p.CantidadActual,
                    p.PrecioVenta,
                    c.Nombre as Categoria,
                    DATEDIFF(DAY, p.FechaEntrada, GETDATE()) as DiasSinMovimiento
                FROM Producto p
                LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                WHERE NOT EXISTS (
                    SELECT 1 FROM DetalleMovimiento dm
                    INNER JOIN Movimiento m ON dm.Id_movimiento = m.Id_movimiento
                    WHERE dm.Id_producto = p.Id_Producto
                    AND m.Fecha >= DATEADD(DAY, -30, GETDATE())
                )
                AND p.CantidadActual > 0
                ORDER BY DiasSinMovimiento DESC
            `);

            return {
                stockBajo: {
                    cantidad: stockBajo.recordset.length,
                    productos: stockBajo.recordset
                },
                alquileresVencidos: {
                    cantidad: alquileresVencidos.recordset.length,
                    alquileres: alquileresVencidos.recordset
                },
                sinMovimiento: {
                    cantidad: sinMovimiento.recordset.length,
                    productos: sinMovimiento.recordset
                }
            };
        } catch (error) {
            console.error('❌ Error en getAlertas:', error);
            throw error;
        }
    }
}

module.exports = new DashboardService();