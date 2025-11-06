-- =============================================
-- CONSULTAS DE EJEMPLO PARA EL DATA MART
-- Data Mart de Compras - Ferretería Central
-- =============================================

USE [FerreteriaCentral];
GO

-- =============================================
-- CONSULTAS BÁSICAS
-- =============================================

-- 1. Ver todas las compras del último mes
SELECT * 
FROM DM.fn_Compras_Periodo(
    DATEADD(MONTH, -1, GETDATE()), 
    GETDATE()
);
GO

-- 2. Resumen mensual de compras
SELECT 
    PeriodoDesc = NombreMes + ' ' + CAST(Anio AS VARCHAR),
    TotalCompras,
    TotalUnidades,
    FORMAT(MontoTotal, 'C', 'es-CR') AS MontoTotal,
    FORMAT(PromedioCompra, 'C', 'es-CR') AS PromedioCompra,
    ProveedoresActivos,
    ProductosComprados
FROM DM.vw_Compras_Por_Mes
ORDER BY Anio DESC, Mes DESC;
GO

-- 3. Top 10 Proveedores por Monto
SELECT TOP 10
    Proveedor,
    Telefono,
    TotalCompras,
    TotalUnidadesCompradas,
    FORMAT(MontoTotal, 'C', 'es-CR') AS MontoTotal,
    FORMAT(PromedioCompra, 'C', 'es-CR') AS PromedioCompra,
    UltimaCompra,
    ProductosDiferentes
FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;
GO

-- 4. Top 20 Productos más comprados
SELECT TOP 20
    Producto,
    Categoria,
    CodigoBarra,
    TotalUnidadesCompradas,
    NumeroCompras,
    FORMAT(MontoTotalComprado, 'C', 'es-CR') AS MontoTotalComprado,
    FORMAT(PrecioPromedioCompra, 'C', 'es-CR') AS PrecioPromedioCompra,
    FORMAT(PrecioVentaActual, 'C', 'es-CR') AS PrecioVentaActual,
    FORMAT(MargenPromedio, 'C', 'es-CR') AS MargenPromedio,
    UltimaCompra,
    StockActual
FROM DM.vw_Productos_Mas_Comprados
ORDER BY TotalUnidadesCompradas DESC;
GO

-- 5. Análisis por categoría
SELECT 
    Categoria,
    Descripcion,
    ProductosEnCategoria,
    TotalCompras,
    TotalUnidadesCompradas,
    FORMAT(MontoTotal, 'C', 'es-CR') AS MontoTotal,
    FORMAT(PrecioPromedioCompra, 'C', 'es-CR') AS PrecioPromedioCompra,
    ProveedoresDiferentes
FROM DM.vw_Analisis_Por_Categoria
ORDER BY MontoTotal DESC;
GO

-- =============================================
-- CONSULTAS DE TENDENCIAS
-- =============================================

-- 6. Tendencias trimestrales
SELECT 
    PeriodoDesc,
    TotalCompras,
    TotalUnidades,
    FORMAT(MontoTotal, 'C', 'es-CR') AS MontoTotal,
    FORMAT(PromedioCompra, 'C', 'es-CR') AS PromedioCompra,
    ProveedoresActivos,
    ProductosComprados
FROM DM.vw_Tendencias_Trimestrales
ORDER BY Anio DESC, Trimestre DESC;
GO

-- 7. Comparativa año contra año
SELECT 
    cm1.NombreMes AS Mes,
    cm1.Anio AS Año1,
    cm1.MontoTotal AS MontoAño1,
    cm2.Anio AS Año2,
    cm2.MontoTotal AS MontoAño2,
    (cm2.MontoTotal - cm1.MontoTotal) AS Diferencia,
    CASE 
        WHEN cm1.MontoTotal > 0 
        THEN CAST(((cm2.MontoTotal - cm1.MontoTotal) / cm1.MontoTotal * 100) AS DECIMAL(10,2))
        ELSE 0 
    END AS PorcentajeCambio
FROM DM.vw_Compras_Por_Mes cm1
INNER JOIN DM.vw_Compras_Por_Mes cm2 
    ON cm1.Mes = cm2.Mes 
    AND cm1.Anio = cm2.Anio - 1
ORDER BY cm2.Anio DESC, cm1.Mes;
GO

-- =============================================
-- CONSULTAS DE RENTABILIDAD
-- =============================================

-- 8. Análisis de rentabilidad de productos
SELECT 
    Producto,
    Categoria,
    FORMAT(PrecioCompraActual, 'C', 'es-CR') AS PrecioCompra,
    FORMAT(PrecioVentaActual, 'C', 'es-CR') AS PrecioVenta,
    FORMAT(MargenUnitario, 'C', 'es-CR') AS MargenUnitario,
    CAST(PorcentajeMargen AS DECIMAL(10,2)) AS MargenPorcentaje,
    TotalUnidadesCompradas,
    FORMAT(InversionTotal, 'C', 'es-CR') AS InversionTotal,
    InventarioActual,
    FORMAT(ValorInventario, 'C', 'es-CR') AS ValorInventario,
    FORMAT(ValorPotencialVenta, 'C', 'es-CR') AS ValorPotencialVenta,
    FORMAT(ValorPotencialVenta - ValorInventario, 'C', 'es-CR') AS UtilidadPotencial
FROM DM.vw_Rentabilidad_Productos
ORDER BY PorcentajeMargen DESC;
GO

-- 9. Productos con mejor margen de ganancia
SELECT TOP 10
    Producto,
    Categoria,
    FORMAT(MargenUnitario, 'C', 'es-CR') AS MargenPorUnidad,
    CAST(PorcentajeMargen AS DECIMAL(10,2)) AS PorcentajeMargen,
    TotalUnidadesCompradas,
    FORMAT((MargenUnitario * TotalUnidadesCompradas), 'C', 'es-CR') AS GananciaTotal
FROM DM.vw_Rentabilidad_Productos
WHERE PorcentajeMargen > 0
ORDER BY PorcentajeMargen DESC;
GO

-- =============================================
-- CONSULTAS DE INVENTARIO Y ALERTAS
-- =============================================

-- 10. Alertas de inventario crítico
SELECT 
    Producto,
    Categoria,
    StockActual,
    StockMinimo,
    DeficitUnidades,
    NivelAlerta,
    CAST(PromedioCompra AS INT) AS PromedioCompra,
    UltimaCompra,
    DiasDesdeUltimaCompra,
    ProveedoresDisponibles
FROM DM.vw_Alertas_Inventario
ORDER BY 
    CASE NivelAlerta
        WHEN 'CRÍTICO - Sin Stock' THEN 1
        WHEN 'URGENTE - Por debajo del mínimo' THEN 2
        WHEN 'ADVERTENCIA - Cerca del mínimo' THEN 3
        ELSE 4
    END,
    DiasDesdeUltimaCompra DESC;
GO

-- 11. Productos sin movimiento reciente (más de 90 días)
SELECT 
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.CantidadActual AS StockActual,
    MAX(t.Fecha) AS UltimaCompra,
    DATEDIFF(DAY, MAX(t.Fecha), GETDATE()) AS DiasInactivo,
    COUNT(*) AS NumeroCompras,
    FORMAT(SUM(fc.TotalCompra), 'C', 'es-CR') AS InversionTotal
FROM DM.Dim_Producto p
INNER JOIN DM.Dim_Categoria c ON p.Id_dim_categoria = c.Id_dim_categoria
LEFT JOIN DM.Fact_Compras fc ON p.Id_dim_producto = fc.Id_dim_producto
LEFT JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
WHERE p.EsActual = 1
GROUP BY p.Nombre, c.Nombre, p.CantidadActual
HAVING DATEDIFF(DAY, MAX(t.Fecha), GETDATE()) > 90
ORDER BY DiasInactivo DESC;
GO

-- =============================================
-- CONSULTAS AVANZADAS DE ANÁLISIS
-- =============================================

-- 12. Análisis ABC de productos (Pareto)
WITH ProductosRankeados AS (
    SELECT 
        Producto,
        Categoria,
        MontoTotalComprado,
        SUM(MontoTotalComprado) OVER() AS TotalGeneral,
        SUM(MontoTotalComprado) OVER(ORDER BY MontoTotalComprado DESC) AS Acumulado
    FROM DM.vw_Productos_Mas_Comprados
)
SELECT 
    Producto,
    Categoria,
    FORMAT(MontoTotalComprado, 'C', 'es-CR') AS MontoComprado,
    CAST((MontoTotalComprado / TotalGeneral * 100) AS DECIMAL(10,2)) AS PorcentajeDelTotal,
    CAST((Acumulado / TotalGeneral * 100) AS DECIMAL(10,2)) AS PorcentajeAcumulado,
    CASE 
        WHEN (Acumulado / TotalGeneral * 100) <= 80 THEN 'A - Alta Rotación'
        WHEN (Acumulado / TotalGeneral * 100) <= 95 THEN 'B - Rotación Media'
        ELSE 'C - Baja Rotación'
    END AS Clasificacion
FROM ProductosRankeados
ORDER BY MontoTotalComprado DESC;
GO

-- 13. Estacionalidad de compras por día de la semana
SELECT 
    t.NombreDia,
    t.DiaSemana,
    COUNT(DISTINCT fc.Id_compra) AS TotalCompras,
    SUM(fc.TotalCompra) AS MontoTotal,
    AVG(fc.TotalCompra) AS PromedioCompra,
    SUM(fc.CantidadComprada) AS TotalUnidades
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
GROUP BY t.NombreDia, t.DiaSemana
ORDER BY t.DiaSemana;
GO

-- 14. Proveedores con mejor relación precio-calidad
SELECT 
    prov.Nombre AS Proveedor,
    COUNT(DISTINCT prod.Id_dim_producto) AS ProductosProveidos,
    AVG(fc.PrecioUnitario) AS PrecioPromedioCompra,
    AVG(prod.PrecioVenta - fc.PrecioUnitario) AS MargenPromedioGenerado,
    COUNT(DISTINCT fc.Id_compra) AS NumeroCompras,
    SUM(fc.CantidadComprada) AS TotalUnidadesCompradas,
    FORMAT(SUM(fc.TotalCompra), 'C', 'es-CR') AS InversionTotal,
    MAX(t.Fecha) AS UltimaCompra
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Proveedor prov ON fc.Id_dim_proveedor = prov.Id_dim_proveedor
INNER JOIN DM.Dim_Producto prod ON fc.Id_dim_producto = prod.Id_dim_producto
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
WHERE prov.EsActual = 1 AND prod.EsActual = 1
GROUP BY prov.Nombre
HAVING COUNT(DISTINCT fc.Id_compra) >= 5
ORDER BY MargenPromedioGenerado DESC;
GO

-- 15. Análisis de concentración de compras
SELECT 
    'Concentración de Proveedores' AS Metrica,
    COUNT(DISTINCT Id_dim_proveedor) AS TotalProveedores,
    COUNT(DISTINCT CASE 
        WHEN Ranking <= 5 THEN Id_dim_proveedor 
    END) AS Top5Proveedores,
    FORMAT(SUM(CASE 
        WHEN Ranking <= 5 THEN MontoTotal 
        ELSE 0 
    END), 'C', 'es-CR') AS MontoTop5,
    FORMAT(SUM(MontoTotal), 'C', 'es-CR') AS MontoTotal,
    CAST((SUM(CASE 
        WHEN Ranking <= 5 THEN MontoTotal 
        ELSE 0 
    END) / SUM(MontoTotal) * 100) AS DECIMAL(10,2)) AS PorcentajeConcentracion
FROM (
    SELECT 
        Id_dim_proveedor,
        MontoTotal,
        ROW_NUMBER() OVER(ORDER BY MontoTotal DESC) AS Ranking
    FROM DM.vw_Top_Proveedores
) AS Ranked;
GO

-- 16. Productos con variación de precio significativa
SELECT 
    prod.Nombre AS Producto,
    cat.Nombre AS Categoria,
    FORMAT(MIN(fc.PrecioUnitario), 'C', 'es-CR') AS PrecioMinimo,
    FORMAT(MAX(fc.PrecioUnitario), 'C', 'es-CR') AS PrecioMaximo,
    FORMAT(AVG(fc.PrecioUnitario), 'C', 'es-CR') AS PrecioPromedio,
    FORMAT(STDEV(fc.PrecioUnitario), 'C', 'es-CR') AS DesviacionEstandar,
    CAST(((MAX(fc.PrecioUnitario) - MIN(fc.PrecioUnitario)) / 
        NULLIF(MIN(fc.PrecioUnitario), 0) * 100) AS DECIMAL(10,2)) AS VariacionPorcentaje,
    COUNT(DISTINCT fc.Id_compra) AS NumeroCompras
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Producto prod ON fc.Id_dim_producto = prod.Id_dim_producto
INNER JOIN DM.Dim_Categoria cat ON fc.Id_dim_categoria = cat.Id_dim_categoria
WHERE prod.EsActual = 1
GROUP BY prod.Nombre, cat.Nombre
HAVING COUNT(DISTINCT fc.Id_compra) >= 3 
    AND ((MAX(fc.PrecioUnitario) - MIN(fc.PrecioUnitario)) / 
        NULLIF(MIN(fc.PrecioUnitario), 0) * 100) > 10
ORDER BY VariacionPorcentaje DESC;
GO

-- =============================================
-- CONSULTAS PARA DASHBOARD EJECUTIVO
-- =============================================

-- 17. KPIs principales
SELECT 
    'Total Compras' AS Indicador,
    CAST(COUNT(DISTINCT Id_compra) AS VARCHAR) AS Valor
FROM DM.Fact_Compras

UNION ALL

SELECT 
    'Inversión Total',
    FORMAT(SUM(TotalCompra), 'C', 'es-CR')
FROM DM.Fact_Compras

UNION ALL

SELECT 
    'Proveedores Activos',
    CAST(COUNT(DISTINCT Id_proveedor) AS VARCHAR)
FROM DM.Dim_Proveedor
WHERE EsActual = 1

UNION ALL

SELECT 
    'Productos en Catálogo',
    CAST(COUNT(DISTINCT Id_producto) AS VARCHAR)
FROM DM.Dim_Producto
WHERE EsActual = 1

UNION ALL

SELECT 
    'Categorías Activas',
    CAST(COUNT(DISTINCT Id_categoria) AS VARCHAR)
FROM DM.Dim_Categoria
WHERE EsActual = 1

UNION ALL

SELECT 
    'Compra Promedio',
    FORMAT(AVG(TotalCompra), 'C', 'es-CR')
FROM DM.Fact_Compras

UNION ALL

SELECT 
    'Productos con Stock Crítico',
    CAST(COUNT(*) AS VARCHAR)
FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta LIKE 'CRÍTICO%' OR NivelAlerta LIKE 'URGENTE%';
GO

-- 18. Resumen ejecutivo del último trimestre
DECLARE @InicioTrimestre DATE = DATEADD(QUARTER, DATEDIFF(QUARTER, 0, GETDATE()), 0);
DECLARE @FinTrimestre DATE = DATEADD(DAY, -1, DATEADD(QUARTER, 1, @InicioTrimestre));

SELECT 
    'Resumen Trimestre Actual' AS Periodo,
    COUNT(DISTINCT fc.Id_compra) AS TotalCompras,
    COUNT(DISTINCT fc.Id_dim_proveedor) AS ProveedoresActivos,
    COUNT(DISTINCT fc.Id_dim_producto) AS ProductosComprados,
    SUM(fc.CantidadComprada) AS TotalUnidades,
    FORMAT(SUM(fc.TotalCompra), 'C', 'es-CR') AS MontoTotal,
    FORMAT(AVG(fc.TotalCompra), 'C', 'es-CR') AS PromedioCompra,
    FORMAT(MIN(fc.TotalCompra), 'C', 'es-CR') AS CompraMinima,
    FORMAT(MAX(fc.TotalCompra), 'C', 'es-CR') AS CompraMaxima
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
WHERE t.Fecha BETWEEN @InicioTrimestre AND @FinTrimestre;
GO

-- =============================================
-- CONSULTAS DE VALIDACIÓN
-- =============================================

-- 19. Verificar integridad de datos entre OLTP y Data Mart
SELECT 
    'OLTP' AS Origen,
    COUNT(DISTINCT c.Id_compra) AS TotalCompras,
    FORMAT(SUM(c.TotalCompra), 'C', 'es-CR') AS MontoTotal,
    MIN(c.FechaCompra) AS FechaMinima,
    MAX(c.FechaCompra) AS FechaMaxima
FROM dbo.Compra c

UNION ALL

SELECT 
    'Data Mart',
    COUNT(DISTINCT fc.Id_compra),
    FORMAT(SUM(fc.TotalCompra), 'C', 'es-CR'),
    MIN(t.Fecha),
    MAX(t.Fecha)
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo;
GO

-- 20. Verificar dimensiones SCD (cambios históricos)
SELECT 
    'Proveedor' AS Dimension,
    COUNT(*) AS TotalRegistros,
    COUNT(DISTINCT Id_proveedor) AS RegistrosUnicos,
    SUM(CASE WHEN EsActual = 1 THEN 1 ELSE 0 END) AS RegistrosActuales,
    SUM(CASE WHEN FechaFin IS NOT NULL THEN 1 ELSE 0 END) AS RegistrosHistoricos
FROM DM.Dim_Proveedor

UNION ALL

SELECT 
    'Categoria',
    COUNT(*),
    COUNT(DISTINCT Id_categoria),
    SUM(CASE WHEN EsActual = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN FechaFin IS NOT NULL THEN 1 ELSE 0 END)
FROM DM.Dim_Categoria

UNION ALL

SELECT 
    'Producto',
    COUNT(*),
    COUNT(DISTINCT Id_producto),
    SUM(CASE WHEN EsActual = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN FechaFin IS NOT NULL THEN 1 ELSE 0 END)
FROM DM.Dim_Producto;
GO

PRINT '================================================';
PRINT 'CONSULTAS DE EJEMPLO CARGADAS';
PRINT 'Ejecute las consultas numeradas según necesite';
PRINT '================================================';
