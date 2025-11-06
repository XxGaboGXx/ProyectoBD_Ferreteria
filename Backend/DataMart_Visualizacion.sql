-- =============================================
-- VISUALIZACIÓN Y DOCUMENTACIÓN DEL MODELO
-- Data Mart de Compras - Ferretería Central
-- =============================================

USE [FerreteriaCentral];
GO

-- =============================================
-- SCRIPT 1: INFORMACIÓN DEL MODELO
-- =============================================

PRINT '================================================';
PRINT 'MODELO DIMENSIONAL - DATA MART DE COMPRAS';
PRINT '================================================';
PRINT '';

-- Listar todas las tablas del Data Mart
PRINT '=== TABLAS DEL DATA MART ===';
PRINT '';

SELECT 
    t.name AS Tabla,
    CASE 
        WHEN t.name LIKE 'Fact_%' THEN 'Hechos'
        WHEN t.name LIKE 'Dim_%' THEN 'Dimensión'
        ELSE 'Auxiliar'
    END AS Tipo,
    p.rows AS Filas,
    CAST(ROUND((SUM(a.total_pages) * 8) / 1024.0, 2) AS DECIMAL(10,2)) AS TamañoMB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.schema_id = SCHEMA_ID('DM')
    AND i.index_id <= 1
GROUP BY t.name, p.rows
ORDER BY 
    CASE 
        WHEN t.name LIKE 'Fact_%' THEN 1
        WHEN t.name LIKE 'Dim_%' THEN 2
        ELSE 3
    END,
    t.name;

PRINT '';
PRINT '=== VISTAS ANALÍTICAS ===';
PRINT '';

SELECT 
    v.name AS Vista,
    m.definition AS Definicion_Resumida
FROM sys.views v
LEFT JOIN sys.sql_modules m ON v.object_id = m.object_id
WHERE v.schema_id = SCHEMA_ID('DM')
ORDER BY v.name;

PRINT '';
PRINT '=== PROCEDIMIENTOS ALMACENADOS ===';
PRINT '';

SELECT 
    p.name AS Procedimiento,
    CASE 
        WHEN p.name LIKE '%Cargar%' THEN 'ETL - Carga'
        WHEN p.name LIKE '%ETL%' THEN 'ETL - Maestro'
        WHEN p.name LIKE '%Estadistica%' THEN 'Monitoreo'
        WHEN p.name LIKE '%Limpiar%' THEN 'Mantenimiento'
        ELSE 'Utilidad'
    END AS Categoria,
    p.create_date AS FechaCreacion,
    p.modify_date AS UltimaModificacion
FROM sys.procedures p
WHERE p.schema_id = SCHEMA_ID('DM')
ORDER BY Categoria, p.name;

GO

-- =============================================
-- SCRIPT 2: RELACIONES DEL MODELO
-- =============================================

PRINT '';
PRINT '=== RELACIONES (CLAVES FORÁNEAS) ===';
PRINT '';

SELECT 
    fk.name AS NombreFK,
    OBJECT_NAME(fk.parent_object_id) AS TablaOrigen,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnaOrigen,
    OBJECT_NAME(fk.referenced_object_id) AS TablaDestino,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ColumnaDestino
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.schema_id = SCHEMA_ID('DM')
ORDER BY TablaOrigen, TablaDestino;

GO

-- =============================================
-- SCRIPT 3: ÍNDICES DEL MODELO
-- =============================================

PRINT '';
PRINT '=== ÍNDICES PARA OPTIMIZACIÓN ===';
PRINT '';

SELECT 
    OBJECT_NAME(i.object_id) AS Tabla,
    i.name AS Indice,
    i.type_desc AS TipoIndice,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columnas,
    CASE 
        WHEN i.is_unique = 1 THEN 'Sí'
        ELSE 'No'
    END AS EsUnico,
    CASE 
        WHEN i.is_primary_key = 1 THEN 'PK'
        WHEN i.is_unique_constraint = 1 THEN 'UK'
        ELSE 'IX'
    END AS TipoConstraint
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE OBJECT_SCHEMA_NAME(i.object_id) = 'DM'
    AND i.type > 0
GROUP BY 
    OBJECT_NAME(i.object_id),
    i.name,
    i.type_desc,
    i.is_unique,
    i.is_primary_key,
    i.is_unique_constraint
ORDER BY Tabla, TipoConstraint DESC, Indice;

GO

-- =============================================
-- SCRIPT 4: ESTRUCTURA DETALLADA DE CADA TABLA
-- =============================================

PRINT '';
PRINT '=== ESTRUCTURA DETALLADA DE TABLAS ===';
PRINT '';

-- Función para generar diccionario de datos
DECLARE @Tabla NVARCHAR(128);
DECLARE @Esquema NVARCHAR(128) = 'DM';

DECLARE tabla_cursor CURSOR FOR
SELECT name 
FROM sys.tables 
WHERE schema_id = SCHEMA_ID('DM')
ORDER BY name;

OPEN tabla_cursor;
FETCH NEXT FROM tabla_cursor INTO @Tabla;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT '';
    PRINT '--- TABLA: ' + @Esquema + '.' + @Tabla + ' ---';
    
    SELECT 
        c.column_id AS Orden,
        c.name AS Columna,
        TYPE_NAME(c.user_type_id) AS TipoDato,
        CASE 
            WHEN TYPE_NAME(c.user_type_id) IN ('varchar', 'nvarchar', 'char', 'nchar') 
            THEN CAST(c.max_length AS VARCHAR) 
            WHEN TYPE_NAME(c.user_type_id) IN ('decimal', 'numeric') 
            THEN CAST(c.precision AS VARCHAR) + ',' + CAST(c.scale AS VARCHAR)
            ELSE ''
        END AS Longitud,
        CASE 
            WHEN c.is_nullable = 1 THEN 'Sí'
            ELSE 'No'
        END AS Nullable,
        CASE 
            WHEN pk.column_id IS NOT NULL THEN 'PK'
            WHEN fk.parent_column_id IS NOT NULL THEN 'FK'
            WHEN c.is_identity = 1 THEN 'ID'
            ELSE ''
        END AS Restriccion,
        ISNULL(dc.definition, '') AS ValorPorDefecto
    FROM sys.columns c
    LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
    ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
    LEFT JOIN sys.foreign_key_columns fk ON c.object_id = fk.parent_object_id AND c.column_id = fk.parent_column_id
    LEFT JOIN sys.default_constraints dc ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE c.object_id = OBJECT_ID(@Esquema + '.' + @Tabla)
    ORDER BY c.column_id;
    
    FETCH NEXT FROM tabla_cursor INTO @Tabla;
END

CLOSE tabla_cursor;
DEALLOCATE tabla_cursor;

GO

-- =============================================
-- SCRIPT 5: ESTADÍSTICAS DE USO
-- =============================================

PRINT '';
PRINT '=== ESTADÍSTICAS DE USO DE ÍNDICES ===';
PRINT '';

SELECT 
    OBJECT_NAME(s.object_id) AS Tabla,
    i.name AS Indice,
    s.user_seeks AS Busquedas,
    s.user_scans AS Escaneos,
    s.user_lookups AS Busquedas_Clave,
    s.user_updates AS Actualizaciones,
    s.last_user_seek AS UltimaBusqueda,
    s.last_user_scan AS UltimoEscaneo
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_SCHEMA_NAME(s.object_id) = 'DM'
    AND s.database_id = DB_ID()
ORDER BY 
    s.user_seeks + s.user_scans + s.user_lookups DESC;

GO

-- =============================================
-- SCRIPT 6: GENERAR DOCUMENTACIÓN EN FORMATO MARKDOWN
-- =============================================

PRINT '';
PRINT '=== GENERANDO DOCUMENTACIÓN MARKDOWN ===';
PRINT '';
PRINT '## Estructura del Data Mart';
PRINT '';
PRINT '### Dimensiones';
PRINT '';

-- Dimensiones
SELECT 
    '#### ' + t.name AS Documentacion
FROM sys.tables t
WHERE t.schema_id = SCHEMA_ID('DM')
    AND t.name LIKE 'Dim_%'
ORDER BY t.name;

PRINT '';
PRINT '### Tabla de Hechos';
PRINT '';

-- Hechos
SELECT 
    '#### ' + t.name AS Documentacion
FROM sys.tables t
WHERE t.schema_id = SCHEMA_ID('DM')
    AND t.name LIKE 'Fact_%'
ORDER BY t.name;

GO

-- =============================================
-- SCRIPT 7: DIAGRAMA ASCII DEL MODELO
-- =============================================

PRINT '';
PRINT '=== DIAGRAMA DEL MODELO ESTRELLA ===';
PRINT '';
PRINT '                    ┌──────────────────┐';
PRINT '                    │   Dim_Tiempo     │';
PRINT '                    │                  │';
PRINT '                    │ - Id_tiempo (PK) │';
PRINT '                    │ - Fecha          │';
PRINT '                    │ - Anio           │';
PRINT '                    │ - Mes            │';
PRINT '                    │ - Trimestre      │';
PRINT '                    └─────────┬────────┘';
PRINT '                              │';
PRINT '                              │ 1:N';
PRINT '                              │';
PRINT '┌──────────────────┐          │          ┌──────────────────┐';
PRINT '│  Dim_Proveedor   │          │          │   Dim_Producto   │';
PRINT '│                  │          │          │                  │';
PRINT '│ - Id_dim (PK)    │          │          │ - Id_dim (PK)    │';
PRINT '│ - Id_proveedor   │          │          │ - Id_producto    │';
PRINT '│ - Nombre         │          │          │ - Nombre         │';
PRINT '│ - Telefono       │          │          │ - PrecioCompra   │';
PRINT '│ - EsActual       │          │          │ - PrecioVenta    │';
PRINT '└─────────┬────────┘          │          └─────────┬────────┘';
PRINT '          │                   │                    │';
PRINT '          │ 1:N               │                 1:N│';
PRINT '          │                   │                    │';
PRINT '          │        ┌──────────┴────────┐           │';
PRINT '          └────────┤   Fact_Compras    ├───────────┘';
PRINT '                   │                   │';
PRINT '                   │ - Id_fact (PK)    │';
PRINT '                   │ - Id_dim_tiempo   │─────┐';
PRINT '                   │ - Id_dim_proveedor│     │';
PRINT '                   │ - Id_dim_producto │     │';
PRINT '                   │ - Id_dim_categoria│     │';
PRINT '          ┌────────│ - CantidadComprada│     │';
PRINT '          │        │ - PrecioUnitario  │     │';
PRINT '          │        │ - Subtotal        │     │';
PRINT '          │        │ - TotalCompra     │     │';
PRINT '          │        └───────────────────┘     │';
PRINT '          │ 1:N                              │ N:1';
PRINT '          │                                  │';
PRINT '┌─────────┴────────┐                         │';
PRINT '│  Dim_Categoria   │                         │';
PRINT '│                  │─────────────────────────┘';
PRINT '│ - Id_dim (PK)    │';
PRINT '│ - Id_categoria   │';
PRINT '│ - Nombre         │';
PRINT '│ - Descripcion    │';
PRINT '│ - EsActual       │';
PRINT '└──────────────────┘';
PRINT '';

PRINT '';
PRINT '=== LEYENDA ===';
PRINT 'PK = Primary Key (Clave Primaria)';
PRINT 'FK = Foreign Key (Clave Foránea)';
PRINT '1:N = Relación Uno a Muchos';
PRINT 'N:1 = Relación Muchos a Uno';
PRINT '';

PRINT '================================================';
PRINT 'DOCUMENTACIÓN GENERADA EXITOSAMENTE';
PRINT '================================================';

GO
