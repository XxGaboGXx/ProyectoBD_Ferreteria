const { getConnection, sql } = require('../config/database');

class ReporteService {
    /**
     * Reporte de ventas por período
     */
    async reporteVentas(fechaInicio, fechaFin) {
        const pool = await getConnection();
        
        const ventas = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    v.Id_venta,
                    v.Fecha,
                    v.TotalVenta,
                    v.MetodoPago,
                    v.Estado,
                    c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') as Cliente,
                    col.Nombre + ' ' + col.Apellido1 as Colaborador,
                    COUNT(dv.Id_detalleVenta) as CantidadItems,
                    SUM(dv.CantidadVenta) as TotalUnidades
                FROM Venta v
                INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
                INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
                LEFT JOIN DetalleVenta dv ON v.Id_venta = dv.Id_venta
                WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin
                GROUP BY v.Id_venta, v.Fecha, v.TotalVenta, v.MetodoPago, v.Estado,
                         c.Nombre, c.Apellido1, c.Apellido2, col.Nombre, col.Apellido1
                ORDER BY v.Fecha DESC
            `);

        const resumen = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    COUNT(*) as TotalVentas,
                    SUM(TotalVenta) as TotalIngresos,
                    AVG(TotalVenta) as PromedioVenta,
                    MAX(TotalVenta) as VentaMaxima,
                    MIN(TotalVenta) as VentaMinima
                FROM Venta
                WHERE Fecha BETWEEN @fechaInicio AND @fechaFin
                AND Estado = 'Completada'
            `);

        return {
            periodo: {
                inicio: fechaInicio,
                fin: fechaFin
            },
            resumen: resumen.recordset[0],
            ventas: ventas.recordset
        };
    }

    /**
     * Reporte de inventario
     */
    async reporteInventario() {
        const pool = await getConnection();
        
        const productos = await pool.request().query(`
            SELECT 
                p.Id_Producto,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.CantidadActual,
                p.CantidadMinima,
                c.Nombre as Categoria,
                (p.CantidadActual * p.PrecioVenta) as ValorStock,
                CASE 
                    WHEN p.CantidadActual = 0 THEN 'AGOTADO'
                    WHEN p.CantidadActual <= p.CantidadMinima THEN 'STOCK BAJO'
                    ELSE 'NORMAL'
                END as Estado
            FROM Producto p
            LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
            ORDER BY c.Nombre, p.Nombre
        `);

        const resumen = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalProductos,
                SUM(CantidadActual) as UnidadesTotales,
                SUM(CantidadActual * PrecioVenta) as ValorTotalInventario,
                COUNT(CASE WHEN CantidadActual = 0 THEN 1 END) as ProductosAgotados,
                COUNT(CASE WHEN CantidadActual <= CantidadMinima THEN 1 END) as ProductosStockBajo
            FROM Producto
        `);

        return {
            resumen: resumen.recordset[0],
            productos: productos.recordset
        };
    }

    /**
     * Reporte de clientes
     */
    async reporteClientes() {
        const pool = await getConnection();
        
        const clientes = await pool.request().query(`
            SELECT 
                c.Id_cliente,
                c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') as NombreCompleto,
                c.Telefono,
                c.Correo,
                c.Direccion,
                COUNT(v.Id_venta) as TotalCompras,
                ISNULL(SUM(v.TotalVenta), 0) as TotalGastado,
                ISNULL(AVG(v.TotalVenta), 0) as PromedioCompra,
                MAX(v.Fecha) as UltimaCompra,
                DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) as DiasUltimaCompra
            FROM Cliente c
            LEFT JOIN Venta v ON c.Id_cliente = v.Id_cliente AND v.Estado = 'Completada'
            GROUP BY c.Id_cliente, c.Nombre, c.Apellido1, c.Apellido2, 
                     c.Telefono, c.Correo, c.Direccion
            ORDER BY TotalGastado DESC
        `);

        return {
            totalClientes: clientes.recordset.length,
            clientes: clientes.recordset
        };
    }

    /**
     * Reporte de productos más vendidos
     */
    async reporteProductosMasVendidos(fechaInicio, fechaFin, limit = 20) {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    p.Id_Producto,
                    p.Nombre,
                    p.PrecioVenta,
                    c.Nombre as Categoria,
                    COUNT(DISTINCT dv.Id_venta) as CantidadVentas,
                    SUM(dv.CantidadVenta) as UnidadesVendidas,
                    SUM(dv.Subtotal) as TotalVentas,
                    AVG(dv.PrecioUnitario) as PrecioPromedio
                FROM DetalleVenta dv
                INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
                LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
                INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
                WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin
                AND v.Estado = 'Completada'
                GROUP BY p.Id_Producto, p.Nombre, p.PrecioVenta, c.Nombre
                ORDER BY UnidadesVendidas DESC
            `);

        return result.recordset;
    }

    /**
     * Reporte de compras a proveedores
     */
    async reporteCompras(fechaInicio, fechaFin) {
        const pool = await getConnection();
        
        const compras = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    c.Id_compra,
                    c.FechaCompra as Fecha,
                    c.TotalCompra as Total,
                    dc.Cantidad,
                    dc.PrecioUnitario,
                    p.Nombre as Producto,
                    prov.Nombre as Proveedor,
                    col.Nombre + ' ' + col.Apellido1 as Colaborador
                FROM Compra c
                INNER JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
                INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
                INNER JOIN Proveedor prov ON c.Id_proveedor = prov.Id_proveedor
                INNER JOIN Colaborador col ON c.Id_colaborador = col.Id_colaborador
                WHERE c.FechaCompra BETWEEN @fechaInicio AND @fechaFin
                ORDER BY c.FechaCompra DESC
            `);

        const resumen = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    COUNT(DISTINCT c.Id_compra) as TotalCompras,
                    SUM(c.TotalCompra) as TotalGastado,
                    SUM(dc.Cantidad) as UnidadesCompradas,
                    AVG(c.TotalCompra) as PromedioCompra
                FROM Compra c
                INNER JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
                WHERE c.FechaCompra BETWEEN @fechaInicio AND @fechaFin
            `);

        return {
            periodo: {
                inicio: fechaInicio,
                fin: fechaFin
            },
            resumen: resumen.recordset[0],
            compras: compras.recordset
        };
    }

    /**
     * Reporte de alquileres
     */
    async reporteAlquileres(fechaInicio, fechaFin) {
        const pool = await getConnection();
        
        const alquileres = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    a.Id_alquiler,
                    a.FechaInicio,
                    a.FechaFin,
                    a.FechaDevolucion,
                    a.TotalAlquiler,
                    a.Estado,
                    p.Nombre as Producto,
                    da.Cantidad,
                    c.Nombre + ' ' + c.Apellido1 as Cliente,
                    col.Nombre + ' ' + col.Apellido1 as Colaborador,
                    CASE 
                        WHEN a.Estado = 'Activo' AND a.FechaFin < GETDATE() THEN 'VENCIDO'
                        ELSE a.Estado
                    END as EstadoActual
                FROM Alquiler a
                INNER JOIN DetalleAlquiler da ON a.Id_alquiler = da.Id_alquiler
                INNER JOIN Producto p ON da.Id_producto = p.Id_Producto
                INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
                INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
                WHERE a.FechaInicio BETWEEN @fechaInicio AND @fechaFin
                ORDER BY a.FechaInicio DESC
            `);

        const resumen = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    COUNT(*) as TotalAlquileres,
                    SUM(TotalAlquiler) as TotalIngresos,
                    AVG(TotalAlquiler) as PromedioAlquiler,
                    SUM(CASE WHEN Estado = 'Activo' THEN 1 ELSE 0 END) as Activos,
                    SUM(CASE WHEN Estado = 'Finalizado' THEN 1 ELSE 0 END) as Finalizados
                FROM Alquiler
                WHERE FechaInicio BETWEEN @fechaInicio AND @fechaFin
            `);

        return {
            periodo: {
                inicio: fechaInicio,
                fin: fechaFin
            },
            resumen: resumen.recordset[0],
            alquileres: alquileres.recordset
        };
    }
}

module.exports = new ReporteService();