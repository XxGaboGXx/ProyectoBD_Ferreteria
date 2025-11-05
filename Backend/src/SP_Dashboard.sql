-- =============================================
-- STORED PROCEDURES - MÓDULO DASHBOARD
-- Base de Datos: FerreteriaCentral
-- Fecha: 05 de noviembre de 2025
-- Total SPs: 12
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP 1: SP_ObtenerResumenDashboard
-- Descripción: Obtiene un resumen general del dashboard con múltiples secciones
-- Parámetros: Ninguno
-- Retorna: 6 resultsets (Ventas hoy, Ventas mes, Productos total, Stock bajo, Clientes, Alquileres)
-- =============================================
IF OBJECT_ID('SP_ObtenerResumenDashboard', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerResumenDashboard;
GO

CREATE PROCEDURE SP_ObtenerResumenDashboard
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Ventas de hoy
        SELECT 
            'VentasHoy' as Seccion,
            COUNT(*) as cantidad,
            ISNULL(SUM(TotalVenta), 0) as total,
            ISNULL(AVG(TotalVenta), 0) as promedio
        FROM Venta
        WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
        AND Estado = 'Completada';
        
        -- Ventas del mes
        SELECT 
            'VentasMes' as Seccion,
            COUNT(*) as cantidad,
            ISNULL(SUM(TotalVenta), 0) as total,
            ISNULL(AVG(TotalVenta), 0) as promedio
        FROM Venta
        WHERE YEAR(Fecha) = YEAR(GETDATE())
        AND MONTH(Fecha) = MONTH(GETDATE())
        AND Estado = 'Completada';
        
        -- Productos total
        SELECT 
            'ProductosTotal' as Seccion,
            COUNT(*) as total,
            ISNULL(SUM(CantidadActual), 0) as unidadesTotal,
            ISNULL(SUM(CantidadActual * PrecioVenta), 0) as valorInventario
        FROM Producto;
        
        -- Productos con stock bajo
        SELECT 
            'ProductosLowStock' as Seccion,
            COUNT(*) as cantidad
        FROM Producto
        WHERE CantidadActual <= CantidadMinima;
        
        -- Clientes total
        SELECT 
            'ClientesTotal' as Seccion,
            COUNT(*) as total,
            0 as nuevosHoy
        FROM Cliente;
        
        -- Alquileres activos
        SELECT 
            'AlquileresActivos' as Seccion,
            COUNT(*) as total,
            ISNULL(SUM(TotalAlquiler), 0) as valorTotal,
            SUM(CASE WHEN FechaFin < GETDATE() THEN 1 ELSE 0 END) as vencidos
        FROM Alquiler
        WHERE Estado = 'ACTIVO';
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 2: SP_ObtenerTopProductos
-- Descripción: Obtiene los productos más vendidos en el último mes
-- Parámetros: 
--   @Limit INT = 5 (Cantidad de productos a mostrar)
-- Retorna: Lista de productos con sus estadísticas de venta
-- =============================================
IF OBJECT_ID('SP_ObtenerTopProductos', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerTopProductos;
GO

CREATE PROCEDURE SP_ObtenerTopProductos
    @Limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT TOP (@Limit)
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
        ORDER BY unidadesVendidas DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 3: SP_ObtenerVentasRecientes
-- Descripción: Obtiene las ventas más recientes con información del cliente y colaborador
-- Parámetros: 
--   @Limit INT = 10 (Cantidad de ventas a mostrar)
-- Retorna: Lista de ventas con detalles completos
-- =============================================
IF OBJECT_ID('SP_ObtenerVentasRecientes', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerVentasRecientes;
GO

CREATE PROCEDURE SP_ObtenerVentasRecientes
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT TOP (@Limit)
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
        ORDER BY v.Fecha DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 4: SP_ObtenerVentasPorDia
-- Descripción: Obtiene estadísticas de ventas agrupadas por día (últimos N días)
-- Parámetros: 
--   @Days INT = 30 (Cantidad de días hacia atrás)
-- Retorna: Lista de fechas con estadísticas de ventas por día
-- Nota: Incluye días sin ventas con valores en cero
-- =============================================
IF OBJECT_ID('SP_ObtenerVentasPorDia', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerVentasPorDia;
GO

CREATE PROCEDURE SP_ObtenerVentasPorDia
    @Days INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH Fechas AS (
            SELECT TOP (@Days)
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
        ORDER BY f.Fecha ASC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 5: SP_ObtenerVentasPorCategoria
-- Descripción: Obtiene estadísticas de ventas agrupadas por categoría de producto
-- Parámetros: Ninguno
-- Retorna: Lista de categorías con sus estadísticas de venta (último mes)
-- =============================================
IF OBJECT_ID('SP_ObtenerVentasPorCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerVentasPorCategoria;
GO

CREATE PROCEDURE SP_ObtenerVentasPorCategoria
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
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
        ORDER BY TotalVentas DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 6: SP_ObtenerVentasPorMetodoPago
-- Descripción: Obtiene estadísticas de ventas agrupadas por método de pago
-- Parámetros: Ninguno
-- Retorna: Lista de métodos de pago con estadísticas (último mes)
-- Nota: Incluye porcentaje de uso de cada método
-- =============================================
IF OBJECT_ID('SP_ObtenerVentasPorMetodoPago', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerVentasPorMetodoPago;
GO

CREATE PROCEDURE SP_ObtenerVentasPorMetodoPago
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
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
        ORDER BY TotalVentas DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 7: SP_ObtenerTopClientes
-- Descripción: Obtiene los mejores clientes ordenados por total gastado
-- Parámetros: 
--   @Limit INT = 10 (Cantidad de clientes a mostrar)
-- Retorna: Lista de clientes con sus estadísticas de compra
-- =============================================
IF OBJECT_ID('SP_ObtenerTopClientes', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerTopClientes;
GO

CREATE PROCEDURE SP_ObtenerTopClientes
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT TOP (@Limit)
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
        ORDER BY TotalGastado DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 8: SP_ObtenerRendimientoColaboradores
-- Descripción: Obtiene el rendimiento de ventas de cada colaborador
-- Parámetros: Ninguno
-- Retorna: Lista de colaboradores con sus estadísticas de venta (último mes)
-- Nota: Incluye colaboradores sin ventas
-- =============================================
IF OBJECT_ID('SP_ObtenerRendimientoColaboradores', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerRendimientoColaboradores;
GO

CREATE PROCEDURE SP_ObtenerRendimientoColaboradores
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
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
        ORDER BY TotalVentas DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 9: SP_ObtenerAnalisisInventario
-- Descripción: Obtiene un análisis completo del inventario
-- Parámetros: Ninguno
-- Retorna: 2 resultsets (Resumen general, Análisis por categoría)
-- =============================================
IF OBJECT_ID('SP_ObtenerAnalisisInventario', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerAnalisisInventario;
GO

CREATE PROCEDURE SP_ObtenerAnalisisInventario
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Resumen general
        SELECT 
            'Resumen' as Seccion,
            COUNT(*) as TotalProductos,
            SUM(CantidadActual) as UnidadesTotales,
            SUM(CantidadActual * PrecioVenta) as ValorInventario,
            COUNT(CASE WHEN CantidadActual <= CantidadMinima THEN 1 END) as ProductosStockBajo,
            COUNT(CASE WHEN CantidadActual = 0 THEN 1 END) as ProductosAgotados,
            AVG(CantidadActual) as PromedioStock,
            MIN(CantidadActual) as StockMinimoActual,
            MAX(CantidadActual) as StockMaximoActual
        FROM Producto;
        
        -- Por categoría
        SELECT 
            'PorCategoria' as Seccion,
            c.Nombre as Categoria,
            COUNT(p.Id_Producto) as CantidadProductos,
            SUM(p.CantidadActual) as UnidadesTotales,
            SUM(p.CantidadActual * p.PrecioVenta) as ValorInventario,
            AVG(p.PrecioVenta) as PrecioPromedio
        FROM Categoria c
        LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
        GROUP BY c.Id_categoria, c.Nombre
        ORDER BY ValorInventario DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 10: SP_ObtenerMovimientosRecientes
-- Descripción: Obtiene los movimientos de inventario más recientes
-- Parámetros: 
--   @Limit INT = 20 (Cantidad de movimientos a mostrar)
-- Retorna: Lista de movimientos con detalles de producto y tipo
-- =============================================
IF OBJECT_ID('SP_ObtenerMovimientosRecientes', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerMovimientosRecientes;
GO

CREATE PROCEDURE SP_ObtenerMovimientosRecientes
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT TOP (@Limit)
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
        ORDER BY m.Fecha DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 11: SP_ObtenerResumenFinanciero
-- Descripción: Obtiene un resumen financiero completo del negocio
-- Parámetros: Ninguno
-- Retorna: 5 resultsets (Ventas hoy, semana, mes, Compras mes, Alquileres activos)
-- =============================================
IF OBJECT_ID('SP_ObtenerResumenFinanciero', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerResumenFinanciero;
GO

CREATE PROCEDURE SP_ObtenerResumenFinanciero
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Ventas hoy
        SELECT 
            'VentasHoy' as Periodo,
            ISNULL(SUM(TotalVenta), 0) as total,
            COUNT(*) as cantidad
        FROM Venta
        WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
        AND Estado = 'Completada';
        
        -- Ventas semana
        SELECT 
            'VentasSemana' as Periodo,
            ISNULL(SUM(TotalVenta), 0) as total,
            COUNT(*) as cantidad
        FROM Venta
        WHERE Fecha >= DATEADD(DAY, -7, GETDATE())
        AND Estado = 'Completada';
        
        -- Ventas mes
        SELECT 
            'VentasMes' as Periodo,
            ISNULL(SUM(TotalVenta), 0) as total,
            COUNT(*) as cantidad
        FROM Venta
        WHERE YEAR(Fecha) = YEAR(GETDATE())
        AND MONTH(Fecha) = MONTH(GETDATE())
        AND Estado = 'Completada';
        
        -- Compras mes
        SELECT 
            'ComprasMes' as Periodo,
            ISNULL(SUM(TotalCompra), 0) as total,
            COUNT(*) as cantidad
        FROM Compra
        WHERE YEAR(FechaCompra) = YEAR(GETDATE())
        AND MONTH(FechaCompra) = MONTH(GETDATE());
        
        -- Alquileres activos
        SELECT 
            'AlquileresActivos' as Periodo,
            ISNULL(SUM(TotalAlquiler), 0) as total,
            COUNT(*) as cantidad
        FROM Alquiler
        WHERE Estado = 'ACTIVO';
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 12: SP_ObtenerAlertas
-- Descripción: Obtiene todas las alertas del sistema
-- Parámetros: Ninguno
-- Retorna: 3 resultsets (Stock bajo, Alquileres vencidos, Productos sin movimiento)
-- Nota: Crucial para monitoreo proactivo del negocio
-- =============================================
IF OBJECT_ID('SP_ObtenerAlertas', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerAlertas;
GO

CREATE PROCEDURE SP_ObtenerAlertas
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Stock bajo
        SELECT 
            'StockBajo' as TipoAlerta,
            p.Id_Producto,
            p.Nombre,
            p.CantidadActual,
            p.CantidadMinima,
            (p.CantidadMinima - p.CantidadActual) as Faltante,
            c.Nombre as Categoria
        FROM Producto p
        LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
        WHERE p.CantidadActual <= p.CantidadMinima
        ORDER BY Faltante DESC;
        
        -- Alquileres vencidos
        SELECT 
            'AlquileresVencidos' as TipoAlerta,
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
        ORDER BY DiasVencidos DESC;
        
        -- Productos sin movimiento
        SELECT TOP 10
            'SinMovimiento' as TipoAlerta,
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
        ORDER BY DiasSinMovimiento DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- VERIFICACIÓN: Listar todos los SPs creados
-- =============================================
PRINT '';
PRINT '===========================================';
PRINT '✅ STORED PROCEDURES DE DASHBOARD CREADOS';
PRINT '===========================================';
PRINT '📊 Total: 12 Stored Procedures';
PRINT '';

SELECT 
    name as NombreSP, 
    create_date as FechaCreacion,
    modify_date as UltimaModificacion
FROM sys.procedures
WHERE name LIKE 'SP_%Dashboard%' 
   OR name LIKE 'SP_Obtener%Dashboard%'
   OR name IN (
       'SP_ObtenerResumenDashboard',
       'SP_ObtenerTopProductos',
       'SP_ObtenerVentasRecientes',
       'SP_ObtenerVentasPorDia',
       'SP_ObtenerVentasPorCategoria',
       'SP_ObtenerVentasPorMetodoPago',
       'SP_ObtenerTopClientes',
       'SP_ObtenerRendimientoColaboradores',
       'SP_ObtenerAnalisisInventario',
       'SP_ObtenerMovimientosRecientes',
       'SP_ObtenerResumenFinanciero',
       'SP_ObtenerAlertas'
   )
ORDER BY name;
