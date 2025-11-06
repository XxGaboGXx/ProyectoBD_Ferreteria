-- =============================================
-- DATA MART DE COMPRAS - FERRETERÍA CENTRAL
-- Implementación completa de Data Mart Dimensional
-- Fecha: 2025-11-05
-- =============================================

USE [FerreteriaCentral];
GO

-- =============================================
-- PASO 1: CREAR ESQUEMA DEL DATA MART
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'DM')
BEGIN
    EXEC('CREATE SCHEMA DM');
    PRINT 'Esquema DM creado exitosamente';
END
GO

-- =============================================
-- PASO 2: TABLAS DE DIMENSIONES
-- =============================================

-- DIMENSIÓN TIEMPO
-- Tabla que almacena todas las dimensiones temporales
IF OBJECT_ID('DM.Dim_Tiempo', 'U') IS NOT NULL
    DROP TABLE DM.Dim_Tiempo;
GO

CREATE TABLE DM.Dim_Tiempo (
    Id_tiempo INT IDENTITY(1,1) PRIMARY KEY,
    Fecha DATE NOT NULL UNIQUE,
    Anio INT NOT NULL,
    Trimestre INT NOT NULL,
    Mes INT NOT NULL,
    NombreMes VARCHAR(20) NOT NULL,
    Dia INT NOT NULL,
    DiaSemana INT NOT NULL,
    NombreDia VARCHAR(20) NOT NULL,
    Semana INT NOT NULL,
    EsFinDeSemana BIT NOT NULL,
    EsFeriado BIT DEFAULT 0,
    NombreFeriado VARCHAR(100) NULL
);
GO

CREATE INDEX IX_Dim_Tiempo_Fecha ON DM.Dim_Tiempo(Fecha);
CREATE INDEX IX_Dim_Tiempo_Anio_Mes ON DM.Dim_Tiempo(Anio, Mes);
GO

PRINT 'Dim_Tiempo creada exitosamente';
GO

-- DIMENSIÓN PROVEEDOR
IF OBJECT_ID('DM.Dim_Proveedor', 'U') IS NOT NULL
    DROP TABLE DM.Dim_Proveedor;
GO

CREATE TABLE DM.Dim_Proveedor (
    Id_dim_proveedor INT IDENTITY(1,1) PRIMARY KEY,
    Id_proveedor INT NOT NULL, -- Clave de negocio
    Nombre VARCHAR(20) NOT NULL,
    Telefono VARCHAR(20) NULL,
    Direccion VARCHAR(255) NULL,
    Correo_electronico VARCHAR(100) NULL,
    FechaInicio DATETIME NOT NULL DEFAULT GETDATE(),
    FechaFin DATETIME NULL,
    EsActual BIT NOT NULL DEFAULT 1
);
GO

CREATE INDEX IX_Dim_Proveedor_IdProveedor ON DM.Dim_Proveedor(Id_proveedor);
CREATE INDEX IX_Dim_Proveedor_EsActual ON DM.Dim_Proveedor(EsActual);
GO

PRINT 'Dim_Proveedor creada exitosamente';
GO

-- DIMENSIÓN CATEGORÍA
IF OBJECT_ID('DM.Dim_Categoria', 'U') IS NOT NULL
    DROP TABLE DM.Dim_Categoria;
GO

CREATE TABLE DM.Dim_Categoria (
    Id_dim_categoria INT IDENTITY(1,1) PRIMARY KEY,
    Id_categoria INT NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(100) NOT NULL,
    FechaInicio DATETIME NOT NULL DEFAULT GETDATE(),
    FechaFin DATETIME NULL,
    EsActual BIT NOT NULL DEFAULT 1
);
GO

CREATE INDEX IX_Dim_Categoria_IdCategoria ON DM.Dim_Categoria(Id_categoria);
CREATE INDEX IX_Dim_Categoria_EsActual ON DM.Dim_Categoria(EsActual);
GO

PRINT 'Dim_Categoria creada exitosamente';
GO

-- DIMENSIÓN PRODUCTO
IF OBJECT_ID('DM.Dim_Producto', 'U') IS NOT NULL
    DROP TABLE DM.Dim_Producto;
GO

CREATE TABLE DM.Dim_Producto (
    Id_dim_producto INT IDENTITY(1,1) PRIMARY KEY,
    Id_producto INT NOT NULL,
    Nombre VARCHAR(20) NOT NULL,
    Descripcion VARCHAR(100) NULL,
    CodigoBarra VARCHAR(50) NULL,
    PrecioCompra DECIMAL(12,2) NOT NULL,
    PrecioVenta DECIMAL(12,2) NOT NULL,
    Id_dim_categoria INT NOT NULL,
    CantidadActual INT NOT NULL,
    CantidadMinima INT NOT NULL,
    FechaInicio DATETIME NOT NULL DEFAULT GETDATE(),
    FechaFin DATETIME NULL,
    EsActual BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (Id_dim_categoria) REFERENCES DM.Dim_Categoria(Id_dim_categoria)
);
GO

CREATE INDEX IX_Dim_Producto_IdProducto ON DM.Dim_Producto(Id_producto);
CREATE INDEX IX_Dim_Producto_EsActual ON DM.Dim_Producto(EsActual);
CREATE INDEX IX_Dim_Producto_Categoria ON DM.Dim_Producto(Id_dim_categoria);
GO

PRINT 'Dim_Producto creada exitosamente';
GO

-- =============================================
-- PASO 3: TABLA DE HECHOS
-- =============================================

-- TABLA DE HECHOS DE COMPRAS
IF OBJECT_ID('DM.Fact_Compras', 'U') IS NOT NULL
    DROP TABLE DM.Fact_Compras;
GO

CREATE TABLE DM.Fact_Compras (
    Id_fact_compra BIGINT IDENTITY(1,1) PRIMARY KEY,
    
    -- Claves foráneas a dimensiones
    Id_dim_tiempo INT NOT NULL,
    Id_dim_proveedor INT NOT NULL,
    Id_dim_producto INT NOT NULL,
    Id_dim_categoria INT NOT NULL,
    
    -- Claves de negocio (para trazabilidad)
    Id_compra INT NOT NULL,
    NumeroFactura VARCHAR(50) NOT NULL,
    
    -- Métricas aditivas
    CantidadComprada INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    
    -- Métricas calculadas
    TotalCompra DECIMAL(12,2) NOT NULL,
    
    -- Metadatos
    FechaCarga DATETIME NOT NULL DEFAULT GETDATE(),
    
    -- Restricciones de integridad referencial
    CONSTRAINT FK_Fact_Compras_Tiempo FOREIGN KEY (Id_dim_tiempo) 
        REFERENCES DM.Dim_Tiempo(Id_tiempo),
    CONSTRAINT FK_Fact_Compras_Proveedor FOREIGN KEY (Id_dim_proveedor) 
        REFERENCES DM.Dim_Proveedor(Id_dim_proveedor),
    CONSTRAINT FK_Fact_Compras_Producto FOREIGN KEY (Id_dim_producto) 
        REFERENCES DM.Dim_Producto(Id_dim_producto),
    CONSTRAINT FK_Fact_Compras_Categoria FOREIGN KEY (Id_dim_categoria) 
        REFERENCES DM.Dim_Categoria(Id_dim_categoria)
);
GO

-- Índices para optimizar consultas analíticas
CREATE INDEX IX_Fact_Compras_Tiempo ON DM.Fact_Compras(Id_dim_tiempo);
CREATE INDEX IX_Fact_Compras_Proveedor ON DM.Fact_Compras(Id_dim_proveedor);
CREATE INDEX IX_Fact_Compras_Producto ON DM.Fact_Compras(Id_dim_producto);
CREATE INDEX IX_Fact_Compras_Categoria ON DM.Fact_Compras(Id_dim_categoria);
CREATE INDEX IX_Fact_Compras_Compra ON DM.Fact_Compras(Id_compra);
CREATE INDEX IX_Fact_Compras_FechaCarga ON DM.Fact_Compras(FechaCarga);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IX_Fact_Compras_Composite ON DM.Fact_Compras(Id_dim_tiempo, Id_dim_proveedor, Id_dim_producto);
GO

PRINT 'Fact_Compras creada exitosamente';
GO

-- =============================================
-- PASO 4: PROCEDIMIENTOS DE CARGA ETL
-- =============================================

-- PROCEDIMIENTO: Poblar Dimensión Tiempo
IF OBJECT_ID('DM.sp_Cargar_Dim_Tiempo', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Cargar_Dim_Tiempo;
GO

CREATE PROCEDURE DM.sp_Cargar_Dim_Tiempo
    @FechaInicio DATE,
    @FechaFin DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaActual DATE = @FechaInicio;
    
    WHILE @FechaActual <= @FechaFin
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM DM.Dim_Tiempo WHERE Fecha = @FechaActual)
        BEGIN
            INSERT INTO DM.Dim_Tiempo (
                Fecha, Anio, Trimestre, Mes, NombreMes, Dia, 
                DiaSemana, NombreDia, Semana, EsFinDeSemana
            )
            VALUES (
                @FechaActual,
                YEAR(@FechaActual),
                DATEPART(QUARTER, @FechaActual),
                MONTH(@FechaActual),
                CASE MONTH(@FechaActual)
                    WHEN 1 THEN 'Enero'
                    WHEN 2 THEN 'Febrero'
                    WHEN 3 THEN 'Marzo'
                    WHEN 4 THEN 'Abril'
                    WHEN 5 THEN 'Mayo'
                    WHEN 6 THEN 'Junio'
                    WHEN 7 THEN 'Julio'
                    WHEN 8 THEN 'Agosto'
                    WHEN 9 THEN 'Septiembre'
                    WHEN 10 THEN 'Octubre'
                    WHEN 11 THEN 'Noviembre'
                    WHEN 12 THEN 'Diciembre'
                END,
                DAY(@FechaActual),
                DATEPART(WEEKDAY, @FechaActual),
                CASE DATEPART(WEEKDAY, @FechaActual)
                    WHEN 1 THEN 'Domingo'
                    WHEN 2 THEN 'Lunes'
                    WHEN 3 THEN 'Martes'
                    WHEN 4 THEN 'Miércoles'
                    WHEN 5 THEN 'Jueves'
                    WHEN 6 THEN 'Viernes'
                    WHEN 7 THEN 'Sábado'
                END,
                DATEPART(WEEK, @FechaActual),
                CASE WHEN DATEPART(WEEKDAY, @FechaActual) IN (1,7) THEN 1 ELSE 0 END
            );
        END
        
        SET @FechaActual = DATEADD(DAY, 1, @FechaActual);
    END
    
    PRINT 'Dim_Tiempo poblada desde ' + CAST(@FechaInicio AS VARCHAR) + ' hasta ' + CAST(@FechaFin AS VARCHAR);
END
GO

PRINT 'sp_Cargar_Dim_Tiempo creado exitosamente';
GO

-- PROCEDIMIENTO: Cargar Dimensión Proveedor (SCD Tipo 2)
IF OBJECT_ID('DM.sp_Cargar_Dim_Proveedor', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Cargar_Dim_Proveedor;
GO

CREATE PROCEDURE DM.sp_Cargar_Dim_Proveedor
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Cerrar registros antiguos si hay cambios
        UPDATE dp
        SET dp.FechaFin = GETDATE(),
            dp.EsActual = 0
        FROM DM.Dim_Proveedor dp
        INNER JOIN dbo.Proveedor p ON dp.Id_proveedor = p.Id_proveedor
        WHERE dp.EsActual = 1
            AND (dp.Nombre != p.Nombre 
                OR ISNULL(dp.Telefono, '') != ISNULL(p.Telefono, '')
                OR ISNULL(dp.Direccion, '') != ISNULL(p.Direccion, '')
                OR ISNULL(dp.Correo_electronico, '') != ISNULL(p.Correo_electronico, ''));
        
        -- Insertar nuevos registros o actualizaciones
        INSERT INTO DM.Dim_Proveedor (
            Id_proveedor, Nombre, Telefono, Direccion, 
            Correo_electronico, FechaInicio, EsActual
        )
        SELECT 
            p.Id_proveedor,
            p.Nombre,
            p.Telefono,
            p.Direccion,
            p.Correo_electronico,
            GETDATE(),
            1
        FROM dbo.Proveedor p
        WHERE NOT EXISTS (
            SELECT 1 
            FROM DM.Dim_Proveedor dp 
            WHERE dp.Id_proveedor = p.Id_proveedor 
                AND dp.EsActual = 1
        );
        
        COMMIT TRANSACTION;
        PRINT 'Dim_Proveedor cargada exitosamente';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'sp_Cargar_Dim_Proveedor creado exitosamente';
GO

-- PROCEDIMIENTO: Cargar Dimensión Categoría (SCD Tipo 2)
IF OBJECT_ID('DM.sp_Cargar_Dim_Categoria', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Cargar_Dim_Categoria;
GO

CREATE PROCEDURE DM.sp_Cargar_Dim_Categoria
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Cerrar registros antiguos si hay cambios
        UPDATE dc
        SET dc.FechaFin = GETDATE(),
            dc.EsActual = 0
        FROM DM.Dim_Categoria dc
        INNER JOIN dbo.Categoria c ON dc.Id_categoria = c.Id_categoria
        WHERE dc.EsActual = 1
            AND (dc.Nombre != c.Nombre OR dc.Descripcion != c.Descripcion);
        
        -- Insertar nuevos registros o actualizaciones
        INSERT INTO DM.Dim_Categoria (
            Id_categoria, Nombre, Descripcion, FechaInicio, EsActual
        )
        SELECT 
            c.Id_categoria,
            c.Nombre,
            c.Descripcion,
            GETDATE(),
            1
        FROM dbo.Categoria c
        WHERE NOT EXISTS (
            SELECT 1 
            FROM DM.Dim_Categoria dc 
            WHERE dc.Id_categoria = c.Id_categoria 
                AND dc.EsActual = 1
        );
        
        COMMIT TRANSACTION;
        PRINT 'Dim_Categoria cargada exitosamente';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'sp_Cargar_Dim_Categoria creado exitosamente';
GO

-- PROCEDIMIENTO: Cargar Dimensión Producto (SCD Tipo 2)
IF OBJECT_ID('DM.sp_Cargar_Dim_Producto', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Cargar_Dim_Producto;
GO

CREATE PROCEDURE DM.sp_Cargar_Dim_Producto
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Primero asegurar que las categorías estén cargadas
        EXEC DM.sp_Cargar_Dim_Categoria;
        
        -- Cerrar registros antiguos si hay cambios significativos
        UPDATE dp
        SET dp.FechaFin = GETDATE(),
            dp.EsActual = 0
        FROM DM.Dim_Producto dp
        INNER JOIN dbo.Producto p ON dp.Id_producto = p.Id_producto
        WHERE dp.EsActual = 1
            AND (dp.Nombre != p.Nombre 
                OR ISNULL(dp.Descripcion, '') != ISNULL(p.Descripcion, '')
                OR dp.PrecioCompra != p.PrecioCompra
                OR dp.PrecioVenta != p.PrecioVenta
                OR dp.CantidadMinima != p.CantidadMinima);
        
        -- Insertar nuevos registros o actualizaciones
        INSERT INTO DM.Dim_Producto (
            Id_producto, Nombre, Descripcion, CodigoBarra,
            PrecioCompra, PrecioVenta, Id_dim_categoria,
            CantidadActual, CantidadMinima, FechaInicio, EsActual
        )
        SELECT 
            p.Id_producto,
            p.Nombre,
            p.Descripcion,
            p.CodigoBarra,
            p.PrecioCompra,
            p.PrecioVenta,
            dc.Id_dim_categoria,
            p.CantidadActual,
            p.CantidadMinima,
            GETDATE(),
            1
        FROM dbo.Producto p
        INNER JOIN DM.Dim_Categoria dc ON p.Id_categoria = dc.Id_categoria AND dc.EsActual = 1
        WHERE NOT EXISTS (
            SELECT 1 
            FROM DM.Dim_Producto dp 
            WHERE dp.Id_producto = p.Id_producto 
                AND dp.EsActual = 1
        );
        
        COMMIT TRANSACTION;
        PRINT 'Dim_Producto cargada exitosamente';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'sp_Cargar_Dim_Producto creado exitosamente';
GO

-- PROCEDIMIENTO: Cargar Tabla de Hechos (Fact_Compras)
IF OBJECT_ID('DM.sp_Cargar_Fact_Compras', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Cargar_Fact_Compras;
GO

CREATE PROCEDURE DM.sp_Cargar_Fact_Compras
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican fechas, cargar el último día
    IF @FechaInicio IS NULL
        SET @FechaInicio = CAST(GETDATE() AS DATE);
    IF @FechaFin IS NULL
        SET @FechaFin = CAST(GETDATE() AS DATE);
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Cargar todas las dimensiones primero
        EXEC DM.sp_Cargar_Dim_Proveedor;
        EXEC DM.sp_Cargar_Dim_Categoria;
        EXEC DM.sp_Cargar_Dim_Producto;
        
        -- Asegurar que existe la dimensión tiempo
        EXEC DM.sp_Cargar_Dim_Tiempo @FechaInicio, @FechaFin;
        
        -- Insertar hechos de compras
        INSERT INTO DM.Fact_Compras (
            Id_dim_tiempo,
            Id_dim_proveedor,
            Id_dim_producto,
            Id_dim_categoria,
            Id_compra,
            NumeroFactura,
            CantidadComprada,
            PrecioUnitario,
            Subtotal,
            TotalCompra
        )
        SELECT 
            dt.Id_tiempo,
            dp.Id_dim_proveedor,
            dprod.Id_dim_producto,
            dc.Id_dim_categoria,
            c.Id_compra,
            c.NumeroFactura,
            dc_det.CantidadCompra,
            dc_det.PrecioUnitario,
            dc_det.Subtotal,
            c.TotalCompra
        FROM dbo.Compra c
        INNER JOIN dbo.DetalleCompra dc_det ON c.Id_compra = dc_det.Id_compra
        INNER JOIN dbo.Producto p ON dc_det.Id_producto = p.Id_producto
        INNER JOIN DM.Dim_Tiempo dt ON CAST(c.FechaCompra AS DATE) = dt.Fecha
        INNER JOIN DM.Dim_Proveedor dp ON c.Id_proveedor = dp.Id_proveedor AND dp.EsActual = 1
        INNER JOIN DM.Dim_Producto dprod ON p.Id_producto = dprod.Id_producto AND dprod.EsActual = 1
        INNER JOIN DM.Dim_Categoria dc ON dprod.Id_dim_categoria = dc.Id_dim_categoria
        WHERE CAST(c.FechaCompra AS DATE) BETWEEN @FechaInicio AND @FechaFin
            AND NOT EXISTS (
                SELECT 1 
                FROM DM.Fact_Compras fc 
                WHERE fc.Id_compra = c.Id_compra 
                    AND fc.Id_dim_producto = dprod.Id_dim_producto
            );
        
        COMMIT TRANSACTION;
        
        DECLARE @RegistrosInsertados INT = @@ROWCOUNT;
        PRINT 'Fact_Compras cargada: ' + CAST(@RegistrosInsertados AS VARCHAR) + ' registros insertados';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'sp_Cargar_Fact_Compras creado exitosamente';
GO

-- =============================================
-- PASO 5: PROCEDIMIENTO MAESTRO DE CARGA ETL
-- =============================================

IF OBJECT_ID('DM.sp_ETL_DataMart_Completo', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_ETL_DataMart_Completo;
GO

CREATE PROCEDURE DM.sp_ETL_DataMart_Completo
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Inicio DATETIME = GETDATE();
    DECLARE @Mensaje VARCHAR(MAX);
    
    -- Si no se especifican fechas, procesar desde el inicio de los datos
    IF @FechaInicio IS NULL
    BEGIN
        SELECT @FechaInicio = MIN(CAST(FechaCompra AS DATE)) FROM dbo.Compra;
    END
    
    IF @FechaFin IS NULL
        SET @FechaFin = CAST(GETDATE() AS DATE);
    
    PRINT '================================================';
    PRINT 'INICIANDO CARGA COMPLETA DEL DATA MART';
    PRINT 'Fecha Inicio: ' + CAST(@FechaInicio AS VARCHAR);
    PRINT 'Fecha Fin: ' + CAST(@FechaFin AS VARCHAR);
    PRINT '================================================';
    
    BEGIN TRY
        -- 1. Cargar dimensión tiempo
        PRINT 'Cargando Dimensión Tiempo...';
        EXEC DM.sp_Cargar_Dim_Tiempo @FechaInicio, @FechaFin;
        
        -- 2. Cargar dimensión proveedor
        PRINT 'Cargando Dimensión Proveedor...';
        EXEC DM.sp_Cargar_Dim_Proveedor;
        
        -- 3. Cargar dimensión categoría
        PRINT 'Cargando Dimensión Categoría...';
        EXEC DM.sp_Cargar_Dim_Categoria;
        
        -- 4. Cargar dimensión producto
        PRINT 'Cargando Dimensión Producto...';
        EXEC DM.sp_Cargar_Dim_Producto;
        
        -- 5. Cargar tabla de hechos
        PRINT 'Cargando Tabla de Hechos...';
        EXEC DM.sp_Cargar_Fact_Compras @FechaInicio, @FechaFin;
        
        DECLARE @Fin DATETIME = GETDATE();
        DECLARE @Duracion INT = DATEDIFF(SECOND, @Inicio, @Fin);
        
        PRINT '================================================';
        PRINT 'CARGA COMPLETA EXITOSA';
        PRINT 'Duración: ' + CAST(@Duracion AS VARCHAR) + ' segundos';
        PRINT '================================================';
    END TRY
    BEGIN CATCH
        SET @Mensaje = 'ERROR EN CARGA ETL: ' + ERROR_MESSAGE();
        PRINT @Mensaje;
        THROW;
    END CATCH
END
GO

PRINT 'sp_ETL_DataMart_Completo creado exitosamente';
GO

-- =============================================
-- PASO 6: VISTAS ANALÍTICAS
-- =============================================

-- VISTA: Resumen de Compras por Mes
IF OBJECT_ID('DM.vw_Compras_Por_Mes', 'V') IS NOT NULL
    DROP VIEW DM.vw_Compras_Por_Mes;
GO

CREATE VIEW DM.vw_Compras_Por_Mes
AS
SELECT 
    t.Anio,
    t.Mes,
    t.NombreMes,
    COUNT(DISTINCT fc.Id_compra) AS TotalCompras,
    SUM(fc.CantidadComprada) AS TotalUnidades,
    SUM(fc.TotalCompra) AS MontoTotal,
    AVG(fc.TotalCompra) AS PromedioCompra,
    COUNT(DISTINCT fc.Id_dim_proveedor) AS ProveedoresActivos,
    COUNT(DISTINCT fc.Id_dim_producto) AS ProductosComprados
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
GROUP BY t.Anio, t.Mes, t.NombreMes;
GO

PRINT 'vw_Compras_Por_Mes creada exitosamente';
GO

-- VISTA: Top Proveedores
IF OBJECT_ID('DM.vw_Top_Proveedores', 'V') IS NOT NULL
    DROP VIEW DM.vw_Top_Proveedores;
GO

CREATE VIEW DM.vw_Top_Proveedores
AS
SELECT 
    p.Nombre AS Proveedor,
    p.Telefono,
    p.Correo_electronico,
    COUNT(DISTINCT fc.Id_compra) AS TotalCompras,
    SUM(fc.CantidadComprada) AS TotalUnidadesCompradas,
    SUM(fc.TotalCompra) AS MontoTotal,
    AVG(fc.TotalCompra) AS PromedioCompra,
    MAX(t.Fecha) AS UltimaCompra,
    COUNT(DISTINCT fc.Id_dim_producto) AS ProductosDiferentes
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Proveedor p ON fc.Id_dim_proveedor = p.Id_dim_proveedor
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
WHERE p.EsActual = 1
GROUP BY p.Nombre, p.Telefono, p.Correo_electronico;
GO

PRINT 'vw_Top_Proveedores creada exitosamente';
GO

-- VISTA: Productos Más Comprados
IF OBJECT_ID('DM.vw_Productos_Mas_Comprados', 'V') IS NOT NULL
    DROP VIEW DM.vw_Productos_Mas_Comprados;
GO

CREATE VIEW DM.vw_Productos_Mas_Comprados
AS
SELECT 
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.CodigoBarra,
    SUM(fc.CantidadComprada) AS TotalUnidadesCompradas,
    COUNT(DISTINCT fc.Id_compra) AS NumeroCompras,
    SUM(fc.Subtotal) AS MontoTotalComprado,
    AVG(fc.PrecioUnitario) AS PrecioPromedioCompra,
    p.PrecioVenta AS PrecioVentaActual,
    (p.PrecioVenta - AVG(fc.PrecioUnitario)) AS MargenPromedio,
    MAX(t.Fecha) AS UltimaCompra,
    p.CantidadActual AS StockActual,
    p.CantidadMinima AS StockMinimo
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Producto p ON fc.Id_dim_producto = p.Id_dim_producto
INNER JOIN DM.Dim_Categoria c ON fc.Id_dim_categoria = c.Id_dim_categoria
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
WHERE p.EsActual = 1 AND c.EsActual = 1
GROUP BY p.Nombre, c.Nombre, p.CodigoBarra, p.PrecioVenta, p.CantidadActual, p.CantidadMinima;
GO

PRINT 'vw_Productos_Mas_Comprados creada exitosamente';
GO

-- VISTA: Análisis por Categoría
IF OBJECT_ID('DM.vw_Analisis_Por_Categoria', 'V') IS NOT NULL
    DROP VIEW DM.vw_Analisis_Por_Categoria;
GO

CREATE VIEW DM.vw_Analisis_Por_Categoria
AS
SELECT 
    c.Nombre AS Categoria,
    c.Descripcion,
    COUNT(DISTINCT fc.Id_dim_producto) AS ProductosEnCategoria,
    COUNT(DISTINCT fc.Id_compra) AS TotalCompras,
    SUM(fc.CantidadComprada) AS TotalUnidadesCompradas,
    SUM(fc.TotalCompra) AS MontoTotal,
    AVG(fc.PrecioUnitario) AS PrecioPromedioCompra,
    COUNT(DISTINCT fc.Id_dim_proveedor) AS ProveedoresDiferentes
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Categoria c ON fc.Id_dim_categoria = c.Id_dim_categoria
WHERE c.EsActual = 1
GROUP BY c.Nombre, c.Descripcion;
GO

PRINT 'vw_Analisis_Por_Categoria creada exitosamente';
GO

-- VISTA: Tendencias de Compra (Trimestral)
IF OBJECT_ID('DM.vw_Tendencias_Trimestrales', 'V') IS NOT NULL
    DROP VIEW DM.vw_Tendencias_Trimestrales;
GO

CREATE VIEW DM.vw_Tendencias_Trimestrales
AS
SELECT 
    t.Anio,
    t.Trimestre,
    'T' + CAST(t.Trimestre AS VARCHAR) + '-' + CAST(t.Anio AS VARCHAR) AS PeriodoDesc,
    COUNT(DISTINCT fc.Id_compra) AS TotalCompras,
    SUM(fc.CantidadComprada) AS TotalUnidades,
    SUM(fc.TotalCompra) AS MontoTotal,
    AVG(fc.TotalCompra) AS PromedioCompra,
    COUNT(DISTINCT fc.Id_dim_proveedor) AS ProveedoresActivos,
    COUNT(DISTINCT fc.Id_dim_producto) AS ProductosComprados,
    COUNT(DISTINCT fc.Id_dim_categoria) AS CategoriasActivas
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
GROUP BY t.Anio, t.Trimestre;
GO

PRINT 'vw_Tendencias_Trimestrales creada exitosamente';
GO

-- VISTA: Análisis de Rentabilidad por Producto
IF OBJECT_ID('DM.vw_Rentabilidad_Productos', 'V') IS NOT NULL
    DROP VIEW DM.vw_Rentabilidad_Productos;
GO

CREATE VIEW DM.vw_Rentabilidad_Productos
AS
SELECT 
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.PrecioCompra AS PrecioCompraActual,
    p.PrecioVenta AS PrecioVentaActual,
    (p.PrecioVenta - p.PrecioCompra) AS MargenUnitario,
    CASE 
        WHEN p.PrecioCompra > 0 
        THEN ((p.PrecioVenta - p.PrecioCompra) / p.PrecioCompra * 100)
        ELSE 0 
    END AS PorcentajeMargen,
    AVG(fc.PrecioUnitario) AS CostoPromedioHistorico,
    (p.PrecioVenta - AVG(fc.PrecioUnitario)) AS MargenPromedioReal,
    SUM(fc.CantidadComprada) AS TotalUnidadesCompradas,
    SUM(fc.TotalCompra) AS InversionTotal,
    p.CantidadActual AS InventarioActual,
    (p.CantidadActual * p.PrecioCompra) AS ValorInventario,
    (p.CantidadActual * p.PrecioVenta) AS ValorPotencialVenta
FROM DM.Fact_Compras fc
INNER JOIN DM.Dim_Producto p ON fc.Id_dim_producto = p.Id_dim_producto
INNER JOIN DM.Dim_Categoria c ON p.Id_dim_categoria = c.Id_dim_categoria
WHERE p.EsActual = 1 AND c.EsActual = 1
GROUP BY p.Nombre, c.Nombre, p.PrecioCompra, p.PrecioVenta, p.CantidadActual;
GO

PRINT 'vw_Rentabilidad_Productos creada exitosamente';
GO

-- VISTA: Alertas de Inventario
IF OBJECT_ID('DM.vw_Alertas_Inventario', 'V') IS NOT NULL
    DROP VIEW DM.vw_Alertas_Inventario;
GO

CREATE VIEW DM.vw_Alertas_Inventario
AS
SELECT 
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.CantidadActual AS StockActual,
    p.CantidadMinima AS StockMinimo,
    (p.CantidadMinima - p.CantidadActual) AS DeficitUnidades,
    CASE 
        WHEN p.CantidadActual <= 0 THEN 'CRÍTICO - Sin Stock'
        WHEN p.CantidadActual <= p.CantidadMinima THEN 'URGENTE - Por debajo del mínimo'
        WHEN p.CantidadActual <= (p.CantidadMinima * 1.2) THEN 'ADVERTENCIA - Cerca del mínimo'
        ELSE 'NORMAL'
    END AS NivelAlerta,
    AVG(fc.CantidadComprada) AS PromedioCompra,
    MAX(t.Fecha) AS UltimaCompra,
    DATEDIFF(DAY, MAX(t.Fecha), GETDATE()) AS DiasDesdeUltimaCompra,
    COUNT(DISTINCT prov.Id_dim_proveedor) AS ProveedoresDisponibles
FROM DM.Dim_Producto p
INNER JOIN DM.Dim_Categoria c ON p.Id_dim_categoria = c.Id_dim_categoria
LEFT JOIN DM.Fact_Compras fc ON p.Id_dim_producto = fc.Id_dim_producto
LEFT JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
LEFT JOIN DM.Dim_Proveedor prov ON fc.Id_dim_proveedor = prov.Id_dim_proveedor
WHERE p.EsActual = 1 
    AND c.EsActual = 1
    AND p.CantidadActual <= (p.CantidadMinima * 1.2)
GROUP BY 
    p.Nombre, c.Nombre, p.CantidadActual, p.CantidadMinima;
GO

PRINT 'vw_Alertas_Inventario creada exitosamente';
GO

-- =============================================
-- PASO 7: FUNCIONES AUXILIARES
-- =============================================

-- FUNCIÓN: Obtener ventas de un periodo
IF OBJECT_ID('DM.fn_Compras_Periodo', 'FN') IS NOT NULL
    DROP FUNCTION DM.fn_Compras_Periodo;
GO

CREATE FUNCTION DM.fn_Compras_Periodo
(
    @FechaInicio DATE,
    @FechaFin DATE
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        t.Fecha,
        p.Nombre AS Proveedor,
        prod.Nombre AS Producto,
        cat.Nombre AS Categoria,
        fc.CantidadComprada,
        fc.PrecioUnitario,
        fc.Subtotal,
        fc.TotalCompra,
        fc.NumeroFactura
    FROM DM.Fact_Compras fc
    INNER JOIN DM.Dim_Tiempo t ON fc.Id_dim_tiempo = t.Id_tiempo
    INNER JOIN DM.Dim_Proveedor p ON fc.Id_dim_proveedor = p.Id_dim_proveedor
    INNER JOIN DM.Dim_Producto prod ON fc.Id_dim_producto = prod.Id_dim_producto
    INNER JOIN DM.Dim_Categoria cat ON fc.Id_dim_categoria = cat.Id_dim_categoria
    WHERE t.Fecha BETWEEN @FechaInicio AND @FechaFin
);
GO

PRINT 'fn_Compras_Periodo creada exitosamente';
GO

-- =============================================
-- PASO 8: SCRIPTS DE MANTENIMIENTO
-- =============================================

-- PROCEDIMIENTO: Limpiar datos antiguos del Data Mart
IF OBJECT_ID('DM.sp_Limpiar_Datos_Antiguos', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Limpiar_Datos_Antiguos;
GO

CREATE PROCEDURE DM.sp_Limpiar_Datos_Antiguos
    @AñosAConservar INT = 3
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaLimite DATE = DATEADD(YEAR, -@AñosAConservar, GETDATE());
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Eliminar hechos antiguos
        DELETE FROM DM.Fact_Compras
        WHERE Id_dim_tiempo IN (
            SELECT Id_tiempo 
            FROM DM.Dim_Tiempo 
            WHERE Fecha < @FechaLimite
        );
        
        DECLARE @RegistrosEliminados INT = @@ROWCOUNT;
        
        -- Eliminar dimensiones de tiempo sin uso
        DELETE FROM DM.Dim_Tiempo
        WHERE Fecha < @FechaLimite
            AND Id_tiempo NOT IN (SELECT DISTINCT Id_dim_tiempo FROM DM.Fact_Compras);
        
        COMMIT TRANSACTION;
        
        PRINT 'Limpieza completada: ' + CAST(@RegistrosEliminados AS VARCHAR) + ' registros eliminados';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'sp_Limpiar_Datos_Antiguos creado exitosamente';
GO

-- =============================================
-- PASO 9: ESTADÍSTICAS Y MONITOREO
-- =============================================

-- PROCEDIMIENTO: Obtener estadísticas del Data Mart
IF OBJECT_ID('DM.sp_Estadisticas_DataMart', 'P') IS NOT NULL
    DROP PROCEDURE DM.sp_Estadisticas_DataMart;
GO

CREATE PROCEDURE DM.sp_Estadisticas_DataMart
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas de tablas
    SELECT 
        'Dim_Tiempo' AS Tabla,
        COUNT(*) AS TotalRegistros,
        MIN(Fecha) AS FechaMinima,
        MAX(Fecha) AS FechaMaxima
    FROM DM.Dim_Tiempo
    
    UNION ALL
    
    SELECT 
        'Dim_Proveedor',
        COUNT(*),
        MIN(FechaInicio),
        MAX(ISNULL(FechaFin, GETDATE()))
    FROM DM.Dim_Proveedor
    
    UNION ALL
    
    SELECT 
        'Dim_Categoria',
        COUNT(*),
        MIN(FechaInicio),
        MAX(ISNULL(FechaFin, GETDATE()))
    FROM DM.Dim_Categoria
    
    UNION ALL
    
    SELECT 
        'Dim_Producto',
        COUNT(*),
        MIN(FechaInicio),
        MAX(ISNULL(FechaFin, GETDATE()))
    FROM DM.Dim_Producto
    
    UNION ALL
    
    SELECT 
        'Fact_Compras',
        COUNT(*),
        MIN(FechaCarga),
        MAX(FechaCarga)
    FROM DM.Fact_Compras;
    
    -- Resumen de compras
    SELECT 
        COUNT(DISTINCT Id_compra) AS TotalCompras,
        SUM(TotalCompra) AS MontoTotal,
        AVG(TotalCompra) AS PromedioCompra,
        MIN(FechaCarga) AS PrimeraCompra,
        MAX(FechaCarga) AS UltimaCompra
    FROM DM.Fact_Compras;
END
GO

PRINT 'sp_Estadisticas_DataMart creado exitosamente';
GO

PRINT '================================================';
PRINT 'DATA MART IMPLEMENTADO EXITOSAMENTE';
PRINT '================================================';
PRINT '';
PRINT 'Para inicializar y cargar datos, ejecute:';
PRINT 'EXEC DM.sp_ETL_DataMart_Completo;';
PRINT '';
PRINT 'Para ver estadísticas:';
PRINT 'EXEC DM.sp_Estadisticas_DataMart;';
PRINT '';
PRINT '================================================';
GO
