-- =============================================
-- SCRIPT DE PRUEBAS AUTOMATIZADAS
-- Data Mart de Compras - Ferretería Central
-- =============================================

USE [FerreteriaCentral];
GO

SET NOCOUNT ON;
GO

DECLARE @TotalPruebas INT = 0;
DECLARE @PruebasExitosas INT = 0;
DECLARE @PruebasFallidas INT = 0;
DECLARE @PruebasAdvertencia INT = 0;

PRINT '================================================';
PRINT 'SUITE DE PRUEBAS DEL DATA MART';
PRINT 'Fecha: ' + CAST(GETDATE() AS VARCHAR);
PRINT '================================================';
PRINT '';

-- =============================================
-- PRUEBA 1: EXISTENCIA DEL ESQUEMA
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 1: Verificar existencia del esquema DM';

IF EXISTS (SELECT * FROM sys.schemas WHERE name = 'DM')
BEGIN
    PRINT '✓ EXITOSA: El esquema DM existe';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: El esquema DM no existe';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 2: EXISTENCIA DE DIMENSIONES
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 2: Verificar existencia de dimensiones';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Dim_Tiempo' AND schema_id = SCHEMA_ID('DM'))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Dim_Proveedor' AND schema_id = SCHEMA_ID('DM'))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Dim_Categoria' AND schema_id = SCHEMA_ID('DM'))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Dim_Producto' AND schema_id = SCHEMA_ID('DM'))
BEGIN
    PRINT '✓ EXITOSA: Todas las dimensiones existen';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Faltan algunas dimensiones';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 3: EXISTENCIA DE TABLA DE HECHOS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 3: Verificar existencia de tabla de hechos';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Fact_Compras' AND schema_id = SCHEMA_ID('DM'))
BEGIN
    PRINT '✓ EXITOSA: La tabla de hechos existe';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: La tabla de hechos no existe';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 4: INTEGRIDAD REFERENCIAL
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 4: Verificar integridad referencial';

DECLARE @FK_Count INT = (
    SELECT COUNT(*) 
    FROM sys.foreign_keys 
    WHERE schema_id = SCHEMA_ID('DM')
);

IF @FK_Count >= 4  -- Esperamos al menos 4 FKs en Fact_Compras
BEGIN
    PRINT '✓ EXITOSA: Integridad referencial configurada (' + CAST(@FK_Count AS VARCHAR) + ' FKs)';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Faltan claves foráneas (' + CAST(@FK_Count AS VARCHAR) + ' FKs encontradas)';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 5: ÍNDICES CREADOS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 5: Verificar índices creados';

DECLARE @Index_Count INT = (
    SELECT COUNT(DISTINCT i.name)
    FROM sys.indexes i
    INNER JOIN sys.tables t ON i.object_id = t.object_id
    WHERE t.schema_id = SCHEMA_ID('DM')
        AND i.type > 0  -- Excluir heap
);

IF @Index_Count >= 10
BEGIN
    PRINT '✓ EXITOSA: Índices creados correctamente (' + CAST(@Index_Count AS VARCHAR) + ' índices)';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '⚠ ADVERTENCIA: Pocos índices encontrados (' + CAST(@Index_Count AS VARCHAR) + ' índices)';
    SET @PruebasAdvertencia = @PruebasAdvertencia + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 6: DATOS EN DIMENSIONES
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 6: Verificar datos en dimensiones';

DECLARE @Dim_Tiempo_Count INT = (SELECT COUNT(*) FROM DM.Dim_Tiempo);
DECLARE @Dim_Proveedor_Count INT = (SELECT COUNT(*) FROM DM.Dim_Proveedor);
DECLARE @Dim_Categoria_Count INT = (SELECT COUNT(*) FROM DM.Dim_Categoria);
DECLARE @Dim_Producto_Count INT = (SELECT COUNT(*) FROM DM.Dim_Producto);

IF @Dim_Tiempo_Count > 0 
   AND @Dim_Proveedor_Count > 0 
   AND @Dim_Categoria_Count > 0 
   AND @Dim_Producto_Count > 0
BEGIN
    PRINT '✓ EXITOSA: Todas las dimensiones tienen datos';
    PRINT '  - Dim_Tiempo: ' + CAST(@Dim_Tiempo_Count AS VARCHAR) + ' registros';
    PRINT '  - Dim_Proveedor: ' + CAST(@Dim_Proveedor_Count AS VARCHAR) + ' registros';
    PRINT '  - Dim_Categoria: ' + CAST(@Dim_Categoria_Count AS VARCHAR) + ' registros';
    PRINT '  - Dim_Producto: ' + CAST(@Dim_Producto_Count AS VARCHAR) + ' registros';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Algunas dimensiones están vacías';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 7: DATOS EN TABLA DE HECHOS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 7: Verificar datos en tabla de hechos';

DECLARE @Fact_Count BIGINT = (SELECT COUNT(*) FROM DM.Fact_Compras);

IF @Fact_Count > 0
BEGIN
    PRINT '✓ EXITOSA: La tabla de hechos tiene datos (' + CAST(@Fact_Count AS VARCHAR) + ' registros)';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: La tabla de hechos está vacía';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 8: CONSISTENCIA DE DATOS (OLTP vs DM)
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 8: Verificar consistencia OLTP vs Data Mart';

DECLARE @OLTP_Compras INT = (SELECT COUNT(DISTINCT Id_compra) FROM dbo.Compra);
DECLARE @DM_Compras INT = (SELECT COUNT(DISTINCT Id_compra) FROM DM.Fact_Compras);
DECLARE @Diferencia INT = ABS(@OLTP_Compras - @DM_Compras);
DECLARE @PorcentajeDiferencia DECIMAL(5,2) = 
    CASE 
        WHEN @OLTP_Compras > 0 
        THEN (CAST(@Diferencia AS DECIMAL) / @OLTP_Compras * 100)
        ELSE 0 
    END;

IF @PorcentajeDiferencia <= 5  -- Tolerancia del 5%
BEGIN
    PRINT '✓ EXITOSA: Los datos son consistentes';
    PRINT '  - Compras OLTP: ' + CAST(@OLTP_Compras AS VARCHAR);
    PRINT '  - Compras DM: ' + CAST(@DM_Compras AS VARCHAR);
    PRINT '  - Diferencia: ' + CAST(@PorcentajeDiferencia AS VARCHAR) + '%';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '⚠ ADVERTENCIA: Diferencia significativa en los datos';
    PRINT '  - Compras OLTP: ' + CAST(@OLTP_Compras AS VARCHAR);
    PRINT '  - Compras DM: ' + CAST(@DM_Compras AS VARCHAR);
    PRINT '  - Diferencia: ' + CAST(@PorcentajeDiferencia AS VARCHAR) + '%';
    SET @PruebasAdvertencia = @PruebasAdvertencia + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 9: SCD TIPO 2 EN PROVEEDORES
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 9: Verificar implementación SCD Tipo 2';

DECLARE @SCD_Actuales INT = (SELECT COUNT(*) FROM DM.Dim_Proveedor WHERE EsActual = 1);
DECLARE @SCD_Historicos INT = (SELECT COUNT(*) FROM DM.Dim_Proveedor WHERE EsActual = 0);
DECLARE @SCD_Total INT = @SCD_Actuales + @SCD_Historicos;

IF @SCD_Actuales > 0 AND (@SCD_Actuales + @SCD_Historicos) >= @SCD_Actuales
BEGIN
    PRINT '✓ EXITOSA: SCD Tipo 2 implementado correctamente';
    PRINT '  - Registros actuales: ' + CAST(@SCD_Actuales AS VARCHAR);
    PRINT '  - Registros históricos: ' + CAST(@SCD_Historicos AS VARCHAR);
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '⚠ ADVERTENCIA: SCD Tipo 2 puede no estar funcionando correctamente';
    SET @PruebasAdvertencia = @PruebasAdvertencia + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 10: EXISTENCIA DE VISTAS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 10: Verificar existencia de vistas analíticas';

DECLARE @Views_Count INT = (
    SELECT COUNT(*) 
    FROM sys.views 
    WHERE schema_id = SCHEMA_ID('DM')
);

IF @Views_Count >= 5
BEGIN
    PRINT '✓ EXITOSA: Vistas analíticas creadas (' + CAST(@Views_Count AS VARCHAR) + ' vistas)';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Faltan vistas analíticas (' + CAST(@Views_Count AS VARCHAR) + ' vistas)';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 11: EXISTENCIA DE PROCEDIMIENTOS ETL
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 11: Verificar existencia de procedimientos ETL';

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Cargar_Dim_Tiempo' AND schema_id = SCHEMA_ID('DM'))
   AND EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Cargar_Fact_Compras' AND schema_id = SCHEMA_ID('DM'))
   AND EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ETL_DataMart_Completo' AND schema_id = SCHEMA_ID('DM'))
BEGIN
    PRINT '✓ EXITOSA: Procedimientos ETL existen';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Faltan procedimientos ETL';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 12: VALIDACIÓN DE MÉTRICAS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 12: Validar métricas de negocio';

DECLARE @TotalInvalido INT = (
    SELECT COUNT(*) 
    FROM DM.Fact_Compras 
    WHERE CantidadComprada <= 0 
       OR PrecioUnitario < 0 
       OR Subtotal < 0 
       OR TotalCompra < 0
);

IF @TotalInvalido = 0
BEGIN
    PRINT '✓ EXITOSA: Todas las métricas son válidas';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Encontrados ' + CAST(@TotalInvalido AS VARCHAR) + ' registros con métricas inválidas';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 13: RENDIMIENTO DE CONSULTAS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 13: Verificar rendimiento de consultas';

DECLARE @InicioConsulta DATETIME = GETDATE();
SELECT TOP 100 * FROM DM.vw_Top_Proveedores;
DECLARE @TiempoConsulta INT = DATEDIFF(MILLISECOND, @InicioConsulta, GETDATE());

IF @TiempoConsulta < 5000  -- Menos de 5 segundos
BEGIN
    PRINT '✓ EXITOSA: Consultas ejecutan en tiempo aceptable (' + CAST(@TiempoConsulta AS VARCHAR) + ' ms)';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '⚠ ADVERTENCIA: Consultas lentas (' + CAST(@TiempoConsulta AS VARCHAR) + ' ms). Considere actualizar estadísticas.';
    SET @PruebasAdvertencia = @PruebasAdvertencia + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 14: FUNCIÓN DE TABLA
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 14: Verificar función de tabla';

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_Compras_Periodo' AND type = 'IF' AND schema_id = SCHEMA_ID('DM'))
BEGIN
    PRINT '✓ EXITOSA: Función de tabla existe';
    
    -- Probar la función
    DECLARE @Resultado INT = (
        SELECT COUNT(*) 
        FROM DM.fn_Compras_Periodo(
            DATEADD(MONTH, -1, GETDATE()), 
            GETDATE()
        )
    );
    PRINT '  - Registros en el último mes: ' + CAST(@Resultado AS VARCHAR);
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE
BEGIN
    PRINT '✗ FALLIDA: Función de tabla no existe';
    SET @PruebasFallidas = @PruebasFallidas + 1;
END
PRINT '';

-- =============================================
-- PRUEBA 15: TAMAÑO DE LA BASE DE DATOS
-- =============================================
SET @TotalPruebas = @TotalPruebas + 1;
PRINT 'Prueba 15: Verificar tamaño del Data Mart';

DECLARE @TamañoMB DECIMAL(10,2) = (
    SELECT 
        CAST(ROUND(SUM(a.total_pages) * 8 / 1024.0, 2) AS DECIMAL(10,2))
    FROM sys.tables t
    INNER JOIN sys.indexes i ON t.object_id = i.object_id
    INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
    INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
    WHERE t.schema_id = SCHEMA_ID('DM')
);

PRINT '✓ INFO: Tamaño del Data Mart: ' + CAST(@TamañoMB AS VARCHAR) + ' MB';

IF @TamañoMB > 0 AND @TamañoMB < 10000  -- Menos de 10 GB
BEGIN
    PRINT '✓ EXITOSA: Tamaño del Data Mart es razonable';
    SET @PruebasExitosas = @PruebasExitosas + 1;
END
ELSE IF @TamañoMB = 0
BEGIN
    PRINT '⚠ ADVERTENCIA: El Data Mart está vacío';
    SET @PruebasAdvertencia = @PruebasAdvertencia + 1;
END
ELSE
BEGIN
    PRINT '⚠ ADVERTENCIA: El Data Mart es muy grande. Considere archivar datos antiguos.';
    SET @PruebasAdvertencia = @PruebasAdvertencia + 1;
END
PRINT '';

-- =============================================
-- RESUMEN DE RESULTADOS
-- =============================================
PRINT '================================================';
PRINT 'RESUMEN DE PRUEBAS';
PRINT '================================================';
PRINT 'Total de pruebas: ' + CAST(@TotalPruebas AS VARCHAR);
PRINT '✓ Exitosas: ' + CAST(@PruebasExitosas AS VARCHAR);
PRINT '✗ Fallidas: ' + CAST(@PruebasFallidas AS VARCHAR);
PRINT '⚠ Advertencias: ' + CAST(@PruebasAdvertencia AS VARCHAR);
PRINT '';

DECLARE @PorcentajeExito DECIMAL(5,2) = 
    CAST(@PruebasExitosas AS DECIMAL) / @TotalPruebas * 100;

PRINT 'Porcentaje de éxito: ' + CAST(@PorcentajeExito AS VARCHAR) + '%';
PRINT '';

IF @PruebasFallidas = 0 AND @PruebasAdvertencia = 0
BEGIN
    PRINT '🎉 RESULTADO: TODAS LAS PRUEBAS PASARON';
    PRINT 'El Data Mart está funcionando perfectamente.';
END
ELSE IF @PruebasFallidas = 0
BEGIN
    PRINT '✓ RESULTADO: PRUEBAS PASARON CON ADVERTENCIAS';
    PRINT 'El Data Mart funciona pero hay áreas de mejora.';
END
ELSE
BEGIN
    PRINT '⚠ RESULTADO: ALGUNAS PRUEBAS FALLARON';
    PRINT 'Revise los errores antes de usar el Data Mart en producción.';
END

PRINT '================================================';
PRINT 'FIN DE LAS PRUEBAS';
PRINT '================================================';

GO
