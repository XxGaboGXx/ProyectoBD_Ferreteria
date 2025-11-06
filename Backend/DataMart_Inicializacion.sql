-- =============================================
-- SCRIPT DE INICIALIZACIÓN RÁPIDA
-- Data Mart de Compras - Ferretería Central
-- Ejecutar después de crear el Data Mart
-- =============================================

USE [FerreteriaCentral];
GO

PRINT '================================================';
PRINT 'INICIALIZACIÓN DEL DATA MART';
PRINT '================================================';
PRINT '';

-- =============================================
-- PASO 1: VERIFICAR ESTRUCTURA
-- =============================================
PRINT 'Verificando estructura del Data Mart...';

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'DM')
BEGIN
    PRINT 'ERROR: El esquema DM no existe. Ejecute primero DataMart_Compras.sql';
    RETURN;
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Fact_Compras' AND schema_id = SCHEMA_ID('DM'))
BEGIN
    PRINT 'ERROR: Las tablas del Data Mart no existen. Ejecute primero DataMart_Compras.sql';
    RETURN;
END

PRINT '✓ Estructura verificada correctamente';
PRINT '';

-- =============================================
-- PASO 2: LIMPIAR DATOS EXISTENTES (OPCIONAL)
-- =============================================
PRINT 'Limpiando datos existentes del Data Mart...';

BEGIN TRANSACTION;

BEGIN TRY
    DELETE FROM DM.Fact_Compras;
    DELETE FROM DM.Dim_Producto;
    DELETE FROM DM.Dim_Categoria;
    DELETE FROM DM.Dim_Proveedor;
    DELETE FROM DM.Dim_Tiempo;
    
    COMMIT TRANSACTION;
    PRINT '✓ Datos anteriores eliminados';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error al limpiar datos: ' + ERROR_MESSAGE();
    RETURN;
END CATCH

PRINT '';

-- =============================================
-- PASO 3: CARGAR DIMENSIÓN TIEMPO
-- =============================================
PRINT 'Cargando Dimensión Tiempo...';
PRINT 'Esto puede tomar unos momentos...';

DECLARE @FechaMinima DATE;
DECLARE @FechaMaxima DATE;

-- Obtener rango de fechas de las compras existentes
SELECT 
    @FechaMinima = MIN(CAST(FechaCompra AS DATE)),
    @FechaMaxima = MAX(CAST(FechaCompra AS DATE))
FROM dbo.Compra;

-- Si no hay compras, usar el año actual
IF @FechaMinima IS NULL
BEGIN
    SET @FechaMinima = DATEFROMPARTS(YEAR(GETDATE()), 1, 1);
    SET @FechaMaxima = DATEFROMPARTS(YEAR(GETDATE()), 12, 31);
    PRINT 'ADVERTENCIA: No hay compras en el sistema. Se cargará solo el año actual.';
END
ELSE
BEGIN
    -- Extender el rango: desde un año antes hasta un año después
    SET @FechaMinima = DATEADD(YEAR, -1, @FechaMinima);
    SET @FechaMaxima = DATEADD(YEAR, 1, @FechaMaxima);
    
    PRINT 'Rango de fechas: ' + CAST(@FechaMinima AS VARCHAR) + ' a ' + CAST(@FechaMaxima AS VARCHAR);
END

EXEC DM.sp_Cargar_Dim_Tiempo @FechaMinima, @FechaMaxima;

PRINT '✓ Dimensión Tiempo cargada: ' + CAST((SELECT COUNT(*) FROM DM.Dim_Tiempo) AS VARCHAR) + ' días';
PRINT '';

-- =============================================
-- PASO 4: CARGAR DIMENSIONES DE NEGOCIO
-- =============================================
PRINT 'Cargando Dimensión Proveedor...';
EXEC DM.sp_Cargar_Dim_Proveedor;
PRINT '✓ Proveedores cargados: ' + CAST((SELECT COUNT(*) FROM DM.Dim_Proveedor) AS VARCHAR);
PRINT '';

PRINT 'Cargando Dimensión Categoría...';
EXEC DM.sp_Cargar_Dim_Categoria;
PRINT '✓ Categorías cargadas: ' + CAST((SELECT COUNT(*) FROM DM.Dim_Categoria) AS VARCHAR);
PRINT '';

PRINT 'Cargando Dimensión Producto...';
EXEC DM.sp_Cargar_Dim_Producto;
PRINT '✓ Productos cargados: ' + CAST((SELECT COUNT(*) FROM DM.Dim_Producto) AS VARCHAR);
PRINT '';

-- =============================================
-- PASO 5: CARGAR TABLA DE HECHOS
-- =============================================
PRINT 'Cargando Tabla de Hechos (Fact_Compras)...';
PRINT 'Este proceso puede tardar varios minutos dependiendo del volumen de datos...';

DECLARE @Inicio DATETIME = GETDATE();

BEGIN TRY
    EXEC DM.sp_Cargar_Fact_Compras @FechaMinima, @FechaMaxima;
    
    DECLARE @TotalHechos BIGINT = (SELECT COUNT(*) FROM DM.Fact_Compras);
    DECLARE @Duracion INT = DATEDIFF(SECOND, @Inicio, GETDATE());
    
    PRINT '✓ Hechos de compras cargados: ' + CAST(@TotalHechos AS VARCHAR);
    PRINT '  Tiempo de carga: ' + CAST(@Duracion AS VARCHAR) + ' segundos';
END TRY
BEGIN CATCH
    PRINT 'ERROR al cargar hechos: ' + ERROR_MESSAGE();
    RETURN;
END CATCH

PRINT '';

-- =============================================
-- PASO 6: VERIFICAR CARGA
-- =============================================
PRINT 'Verificando integridad de datos...';
PRINT '';

-- Comparar totales entre OLTP y Data Mart
DECLARE @ComprasOLTP INT;
DECLARE @ComprasDM INT;
DECLARE @MontoOLTP DECIMAL(18,2);
DECLARE @MontoDM DECIMAL(18,2);

SELECT 
    @ComprasOLTP = COUNT(DISTINCT Id_compra),
    @MontoOLTP = SUM(TotalCompra)
FROM dbo.Compra
WHERE CAST(FechaCompra AS DATE) BETWEEN @FechaMinima AND @FechaMaxima;

SELECT 
    @ComprasDM = COUNT(DISTINCT Id_compra),
    @MontoDM = SUM(TotalCompra)
FROM DM.Fact_Compras;

PRINT 'Comparación OLTP vs Data Mart:';
PRINT '  Compras OLTP: ' + CAST(ISNULL(@ComprasOLTP, 0) AS VARCHAR);
PRINT '  Compras DM:   ' + CAST(ISNULL(@ComprasDM, 0) AS VARCHAR);
PRINT '';
PRINT '  Monto OLTP: ' + FORMAT(ISNULL(@MontoOLTP, 0), 'C', 'es-CR');
PRINT '  Monto DM:   ' + FORMAT(ISNULL(@MontoDM, 0), 'C', 'es-CR');
PRINT '';

IF @ComprasOLTP = @ComprasDM
    PRINT '✓ Los datos coinciden correctamente';
ELSE
    PRINT '⚠ ADVERTENCIA: Hay diferencias en los datos. Verifique las fechas de las compras.';

PRINT '';

-- =============================================
-- PASO 7: ESTADÍSTICAS FINALES
-- =============================================
PRINT '================================================';
PRINT 'ESTADÍSTICAS DEL DATA MART';
PRINT '================================================';
PRINT '';

EXEC DM.sp_Estadisticas_DataMart;

PRINT '';

-- =============================================
-- PASO 8: ACTUALIZAR ESTADÍSTICAS DE SQL
-- =============================================
PRINT 'Actualizando estadísticas de SQL Server...';

UPDATE STATISTICS DM.Dim_Tiempo WITH FULLSCAN;
UPDATE STATISTICS DM.Dim_Proveedor WITH FULLSCAN;
UPDATE STATISTICS DM.Dim_Categoria WITH FULLSCAN;
UPDATE STATISTICS DM.Dim_Producto WITH FULLSCAN;
UPDATE STATISTICS DM.Fact_Compras WITH FULLSCAN;

PRINT '✓ Estadísticas actualizadas';
PRINT '';

-- =============================================
-- PASO 9: CONSULTAS DE PRUEBA
-- =============================================
PRINT '================================================';
PRINT 'EJECUTANDO CONSULTAS DE PRUEBA';
PRINT '================================================';
PRINT '';

-- Prueba 1: Top 5 Proveedores
PRINT 'Top 5 Proveedores por Monto:';
SELECT TOP 5
    Proveedor,
    TotalCompras,
    FORMAT(MontoTotal, 'C', 'es-CR') AS MontoTotal
FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;
PRINT '';

-- Prueba 2: Top 5 Productos
PRINT 'Top 5 Productos Más Comprados:';
SELECT TOP 5
    Producto,
    Categoria,
    TotalUnidadesCompradas,
    FORMAT(MontoTotalComprado, 'C', 'es-CR') AS MontoTotal
FROM DM.vw_Productos_Mas_Comprados
ORDER BY TotalUnidadesCompradas DESC;
PRINT '';

-- Prueba 3: Resumen por Categoría
PRINT 'Resumen por Categoría:';
SELECT 
    Categoria,
    ProductosEnCategoria,
    TotalCompras,
    FORMAT(MontoTotal, 'C', 'es-CR') AS MontoTotal
FROM DM.vw_Analisis_Por_Categoria
ORDER BY MontoTotal DESC;
PRINT '';

-- Prueba 4: Alertas de Inventario
PRINT 'Productos con Stock Crítico:';
IF EXISTS (SELECT * FROM DM.vw_Alertas_Inventario WHERE NivelAlerta LIKE 'CRÍTICO%' OR NivelAlerta LIKE 'URGENTE%')
BEGIN
    SELECT TOP 5
        Producto,
        StockActual,
        StockMinimo,
        NivelAlerta
    FROM DM.vw_Alertas_Inventario
    WHERE NivelAlerta LIKE 'CRÍTICO%' OR NivelAlerta LIKE 'URGENTE%'
    ORDER BY DeficitUnidades DESC;
END
ELSE
BEGIN
    PRINT '  ✓ No hay alertas críticas de inventario';
END
PRINT '';

-- =============================================
-- FINALIZACIÓN
-- =============================================
PRINT '================================================';
PRINT 'INICIALIZACIÓN COMPLETADA EXITOSAMENTE';
PRINT '================================================';
PRINT '';
PRINT 'El Data Mart está listo para usar.';
PRINT '';
PRINT 'PRÓXIMOS PASOS:';
PRINT '';
PRINT '1. Explorar las vistas analíticas:';
PRINT '   - DM.vw_Compras_Por_Mes';
PRINT '   - DM.vw_Top_Proveedores';
PRINT '   - DM.vw_Productos_Mas_Comprados';
PRINT '   - DM.vw_Rentabilidad_Productos';
PRINT '   - DM.vw_Alertas_Inventario';
PRINT '';
PRINT '2. Revisar consultas de ejemplo:';
PRINT '   - Abrir DataMart_Consultas_Ejemplo.sql';
PRINT '';
PRINT '3. Configurar carga incremental:';
PRINT '   - Programar SQL Server Agent Job para ejecutar:';
PRINT '     EXEC DM.sp_Cargar_Fact_Compras @FechaInicio = <hoy>, @FechaFin = <hoy>';
PRINT '';
PRINT '4. Documentación completa:';
PRINT '   - Leer DataMart_Documentacion.md';
PRINT '';
PRINT '================================================';

GO
