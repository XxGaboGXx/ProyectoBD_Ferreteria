-- Procedimientos almacenados para Alquiler (SQL Server Express)
-- Despliega este script en la misma base de datos que usa tu aplicación.
-- AlquilerService
IF OBJECT_ID('dbo.sp_CreateAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateAlquiler;
GO
CREATE PROCEDURE dbo.sp_CreateAlquiler
    @clienteId INT,
    @colaboradorId INT,
    @productoId INT,
    @cantidad INT,
    @precioDia DECIMAL(10,2),
    @dias INT,
    @total DECIMAL(10,2),
    @fechaInicio DATETIME,
    @fechaFin DATETIME,
    @newId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Alquiler
        (Id_Cliente, Id_Colaborador, Id_Producto, Cantidad, PrecioDia, Dias, Total, FechaInicio, FechaFin, Estado)
    VALUES
        (@clienteId, @colaboradorId, @productoId, @cantidad, @precioDia, @dias, @total, @fechaInicio, @fechaFin, 'ACTIVO');

    SET @newId = SCOPE_IDENTITY();
END
GO

IF OBJECT_ID('dbo.sp_GetAlquilerById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAlquilerById;
GO
CREATE PROCEDURE dbo.sp_GetAlquilerById
    @alquilerId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id_Alquiler, Id_Producto, Cantidad, Estado
    FROM Alquiler
    WHERE Id_Alquiler = @alquilerId;
END
GO

IF OBJECT_ID('dbo.sp_FinalizarAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_FinalizarAlquiler;
GO
CREATE PROCEDURE dbo.sp_FinalizarAlquiler
    @alquilerId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Alquiler
    SET Estado = 'FINALIZADO',
        FechaDevolucion = GETDATE()
    WHERE Id_Alquiler = @alquilerId;
END
GO

IF OBJECT_ID('dbo.sp_GetAlquileresActivos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAlquileresActivos;
GO
CREATE PROCEDURE dbo.sp_GetAlquileresActivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.*,
        c.Nombre as ClienteNombre,
        c.Apellidos as ClienteApellidos,
        p.Nombre as ProductoNombre,
        col.Nombre as ColaboradorNombre,
        DATEDIFF(day, GETDATE(), a.FechaFin) as DiasRestantes
    FROM Alquiler a
    INNER JOIN Cliente c ON a.Id_Cliente = c.Id_Cliente
    INNER JOIN Producto p ON a.Id_Producto = p.Id_Producto
    INNER JOIN Colaborador col ON a.Id_Colaborador = col.Id_Colaborador
    WHERE a.Estado = 'ACTIVO'
    ORDER BY a.FechaFin ASC;
END
GO

IF OBJECT_ID('dbo.sp_GetAlquileresVencidos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAlquileresVencidos;
GO
CREATE PROCEDURE dbo.sp_GetAlquileresVencidos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.*,
        c.Nombre as ClienteNombre,
        c.Apellidos as ClienteApellidos,
        c.Telefono as ClienteTelefono,
        p.Nombre as ProductoNombre,
        DATEDIFF(day, a.FechaFin, GETDATE()) as DiasVencidos
    FROM Alquiler a
    INNER JOIN Cliente c ON a.Id_Cliente = c.Id_Cliente
    INNER JOIN Producto p ON a.Id_Producto = p.Id_Producto
    WHERE a.Estado = 'ACTIVO'
      AND a.FechaFin < GETDATE()
    ORDER BY a.FechaFin ASC;
END
GO

-- backupService
-- Procedimientos almacenados para operaciones de backup/restore
-- Desplegar en la misma base de datos (o en master según permisos) de tu SQL Server Express.

-- sp_CreateBackup
-- Parámetros:
--   @backupFullPath  NVARCHAR(4000) : ruta completa (accesible por el servicio SQL Server) donde se escribirá el .bak
IF OBJECT_ID('dbo.sp_CreateBackup', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateBackup;
GO
CREATE PROCEDURE dbo.sp_CreateBackup
    @backupFullPath NVARCHAR(4000)
AS
BEGIN
    SET NOCOUNT ON;

    -- Componer y ejecutar el comando BACKUP dinámicamente para evitar problemas con comillas
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'BACKUP DATABASE FerreteriaCentral TO DISK = N''' + REPLACE(@backupFullPath, '''', '''''') + N''' WITH FORMAT, MEDIANAME = N''FerreteriaCentralBackup'', NAME = N''Full Backup of FerreteriaCentral'', COMPRESSION;';
    EXEC sp_executesql @sql;
END
GO

-- sp_RestoreBackup
-- Parámetros:
--   @backupFullPath  NVARCHAR(4000) : ruta completa (accesible por el servicio SQL Server) del .bak a restaurar
IF OBJECT_ID('dbo.sp_RestoreBackup', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RestoreBackup;
GO
CREATE PROCEDURE dbo.sp_RestoreBackup
    @backupFullPath NVARCHAR(4000)
AS
BEGIN
    SET NOCOUNT ON;

    -- Cambiar a master y restaurar. Usamos SQL dinámico para evitar efectos de contexto.
    DECLARE @sql NVARCHAR(MAX);

    -- Poner la BD en SINGLE_USER con rollback inmediato
    SET @sql = N'ALTER DATABASE FerreteriaCentral SET SINGLE_USER WITH ROLLBACK IMMEDIATE;';
    EXEC sp_executesql @sql;

    -- Ejecutar RESTORE
    SET @sql = N'RESTORE DATABASE FerreteriaCentral FROM DISK = N''' + REPLACE(@backupFullPath, '''', '''''') + N''' WITH REPLACE, RECOVERY;';
    EXEC sp_executesql @sql;

    -- Devolver a MULTI_USER
    SET @sql = N'ALTER DATABASE FerreteriaCentral SET MULTI_USER;';
    EXEC sp_executesql @sql;
END
GO

-- baseService
-- Procedimientos almacenados genéricos para CRUD y búsqueda con paginación
-- Nota: Estos procedimientos usan SQL dinámico (sp_executesql) para permitir operar
-- sobre tablas/columnas pasadas como parámetros. Debes desplegarlos en la base de datos
-- y otorgar EXECUTE al usuario de la aplicación.
-- IMPORTANTE: revisa y ajusta permisos y considera riesgos de SQL dinámico en producción.

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- sp_GetAllPaged
-- Parámetros:
--  @tableName NVARCHAR(128)       -> nombre de la tabla
--  @primaryKey NVARCHAR(128)      -> columna PK (para ORDER BY)
--  @page INT
--  @limit INT
--  @filterColumns NVARCHAR(MAX)   -> JSON array of column names e.g. '["Nombre","Apellidos"]'
--  @filterValues NVARCHAR(MAX)    -> JSON array of values e.g. '["juan","perez"]'
IF OBJECT_ID('dbo.sp_GetAllPaged', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAllPaged;
GO
CREATE PROCEDURE dbo.sp_GetAllPaged
    @tableName NVARCHAR(128),
    @primaryKey NVARCHAR(128),
    @page INT,
    @limit INT,
    @filterColumns NVARCHAR(MAX) = NULL,
    @filterValues NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = CASE WHEN @page > 0 THEN (@page - 1) * @limit ELSE 0 END;
    DECLARE @where NVARCHAR(MAX) = N'';
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @paramDef NVARCHAR(MAX) = N'';
    DECLARE @i INT = 0;

    -- If filters provided, build WHERE with parameterized @p0,@p1,...
    IF @filterColumns IS NOT NULL AND @filterValues IS NOT NULL
    BEGIN
        -- Build a temporary table of index, col, val
        DECLARE @pairs TABLE ([idx] INT, colName NVARCHAR(128), colValue NVARCHAR(MAX));

        INSERT INTO @pairs([idx], colName)
        SELECT CONVERT(INT, [key]), value
        FROM OPENJSON(@filterColumns);

        INSERT INTO @pairs([idx], colValue)
        SELECT CONVERT(INT, [key]), value
        FROM OPENJSON(@filterValues);

        -- Build where clause and param defs
        DECLARE @col NVARCHAR(128);
        DECLARE @val NVARCHAR(MAX);
        DECLARE @paramName NVARCHAR(50);

        DECLARE pair_cursor CURSOR FOR
            SELECT colName, colValue FROM @pairs ORDER BY [idx];

        OPEN pair_cursor;
        FETCH NEXT FROM pair_cursor INTO @col, @val;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @paramName = N'@p' + CONVERT(NVARCHAR(10), @i);
            IF @where <> N'' SET @where = @where + N' AND ';
            SET @where = @where + QUOTENAME(@col) + N' LIKE ' + @paramName;
            -- extend param definition and add param value via sp_executesql parameter list later
            IF @paramDef <> N'' SET @paramDef = @paramDef + N', ';
            SET @paramDef = @paramDef + @paramName + N' NVARCHAR(4000)';
            -- Replace occurrences in a separate parameters string - handled via sp_executesql exec later
            -- We'll build dynamic exec string with parameters mapping.
            SET @i = @i + 1;
            FETCH NEXT FROM pair_cursor INTO @col, @val;
        END
        CLOSE pair_cursor;
        DEALLOCATE pair_cursor;
    END

    -- Build SQL: first result set -> total, second -> paginated rows
    IF @where = N'' 
        SET @sql = N'SELECT COUNT(*) AS Total FROM ' + QUOTENAME(@tableName) + N';' + NCHAR(13) + 
                   N'SELECT * FROM ' + QUOTENAME(@tableName) + N' ORDER BY ' + QUOTENAME(@primaryKey) + N' DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;';
    ELSE
        SET @sql = N'SELECT COUNT(*) AS Total FROM ' + QUOTENAME(@tableName) + N' WHERE ' + @where + N';' + NCHAR(13) +
                   N'SELECT * FROM ' + QUOTENAME(@tableName) + N' WHERE ' + @where + N' ORDER BY ' + QUOTENAME(@primaryKey) + N' DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;';

    -- Compose full param definition (filters params + offset + limit)
    IF @paramDef = N'' 
        SET @paramDef = N'@offset INT, @limit INT';
    ELSE
        SET @paramDef = @paramDef + N', @offset INT, @limit INT';

    -- Prepare parameter values for sp_executesql by reconstructing them from OPENJSON again
    DECLARE @paramsValues NVARCHAR(MAX) = N'';
    DECLARE @j INT = 0;
    IF @filterValues IS NOT NULL
    BEGIN
        DECLARE @valCursor CURSOR;
        DECLARE @v NVARCHAR(MAX);
        SET @valCursor = CURSOR FOR SELECT value FROM OPENJSON(@filterValues) ORDER BY [key];
        OPEN @valCursor;
        FETCH NEXT FROM @valCursor INTO @v;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            IF @paramsValues <> N'' SET @paramsValues = @paramsValues + N', ';
            SET @paramsValues = @paramsValues + N'@p' + CONVERT(NVARCHAR(10), @j) + N' = ' + QUOTENAME('%' + @v + '%', '''');
            SET @j = @j + 1;
            FETCH NEXT FROM @valCursor INTO @v;
        END
        CLOSE @valCursor;
        DEALLOCATE @valCursor;
    END

    -- Append offset and limit param values
    IF @paramsValues = N'' 
        SET @paramsValues = N'@offset = ' + CONVERT(NVARCHAR(20), @offset) + N', @limit = ' + CONVERT(NVARCHAR(20), @limit);
    ELSE
        SET @paramsValues = @paramsValues + N', @offset = ' + CONVERT(NVARCHAR(20), @offset) + N', @limit = ' + CONVERT(NVARCHAR(20), @limit);

    -- Execute and return result sets
    EXEC sp_executesql @sql, @paramDef, -- parameter definitions
        -- The parameter values string is built above; execute via dynamic EXEC to map named params.
        -- But sp_executesql does not accept a parameters string; it accepts parameter values directly.
        -- To call it dynamically with a variable list we use EXEC(N'EXEC sp_executesql ...') pattern.
        -- Build final execution string:
        @params = N'';
    DECLARE @execSql NVARCHAR(MAX) = N'EXEC sp_executesql N''' + REPLACE(@sql, '''', '''''') + N''', N''' + REPLACE(@paramDef, '''', '''''') + N'''';
    IF @paramsValues <> N'' 
        SET @execSql = @execSql + N', ' + @paramsValues;

    EXEC (@execSql);
END
GO

-- sp_GetById
IF OBJECT_ID('dbo.sp_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetById;
GO
CREATE PROCEDURE dbo.sp_GetById
    @tableName NVARCHAR(128),
    @primaryKey NVARCHAR(128),
    @id SQL_VARIANT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM ' + QUOTENAME(@tableName) + N' WHERE ' + QUOTENAME(@primaryKey) + N' = @id;';
    EXEC sp_executesql @sql, N'@id sql_variant', @id = @id;
END
GO

-- sp_CreateRecord
IF OBJECT_ID('dbo.sp_CreateRecord', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateRecord;
GO
CREATE PROCEDURE dbo.sp_CreateRecord
    @tableName NVARCHAR(128),
    @columns NVARCHAR(MAX),   -- JSON array of columns: '["ColA","ColB"]'
    @values NVARCHAR(MAX),    -- JSON array of values: '["valA","valB"]'
    @primaryKey NVARCHAR(128) -- column to OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cols NVARCHAR(MAX) = N'';
    DECLARE @paramNames NVARCHAR(MAX) = N'';
    DECLARE @paramDef NVARCHAR(MAX) = N'';
    DECLARE @i INT = 0;

    -- Build column list and parameter names
    DECLARE @col NVARCHAR(128);
    DECLARE @val NVARCHAR(MAX);

    DECLARE col_cursor CURSOR FOR SELECT value FROM OPENJSON(@columns) ORDER BY [key];
    DECLARE val_cursor CURSOR FOR SELECT value FROM OPENJSON(@values) ORDER BY [key];

    OPEN col_cursor; OPEN val_cursor;
    FETCH NEXT FROM col_cursor INTO @col;
    FETCH NEXT FROM val_cursor INTO @val;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @cols <> N'' SET @cols = @cols + N', ';
        SET @cols = @cols + QUOTENAME(@col);

        IF @paramNames <> N'' SET @paramNames = @paramNames + N', ';
        SET @paramNames = @paramNames + N'@p' + CONVERT(NVARCHAR(10), @i);

        IF @paramDef <> N'' SET @paramDef = @paramDef + N', ';
        SET @paramDef = @paramDef + N'@p' + CONVERT(NVARCHAR(10), @i) + N' NVARCHAR(4000)';

        SET @i = @i + 1;

        FETCH NEXT FROM col_cursor INTO @col;
        FETCH NEXT FROM val_cursor INTO @val;
    END

    CLOSE col_cursor; DEALLOCATE col_cursor;
    CLOSE val_cursor; DEALLOCATE val_cursor;

    DECLARE @sql NVARCHAR(MAX) = N'INSERT INTO ' + QUOTENAME(@tableName) + N' (' + @cols + N') OUTPUT INSERTED.' + QUOTENAME(@primaryKey) + N' VALUES (' + @paramNames + N');';
    -- Build parameter assignment string for EXEC
    DECLARE @assignments NVARCHAR(MAX) = N'';
    SET @i = 0;
    DECLARE @v NVARCHAR(MAX);
    DECLARE val_cursor2 CURSOR FOR SELECT value FROM OPENJSON(@values) ORDER BY [key];
    OPEN val_cursor2;
    FETCH NEXT FROM val_cursor2 INTO @v;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @assignments <> N'' SET @assignments = @assignments + N', ';
        SET @assignments = @assignments + N'@p' + CONVERT(NVARCHAR(10), @i) + N' = ' + QUOTENAME(@v, '''');
        SET @i = @i + 1;
        FETCH NEXT FROM val_cursor2 INTO @v;
    END
    CLOSE val_cursor2; DEALLOCATE val_cursor2;

    -- Final exec string
    DECLARE @execSql NVARCHAR(MAX) = N'EXEC sp_executesql N''' + REPLACE(@sql, '''', '''''') + N''', N''' + REPLACE(@paramDef, '''', '''''') + N'''';
    IF @assignments <> N'' SET @execSql = @execSql + N', ' + @assignments;

    EXEC (@execSql);
END
GO

-- sp_UpdateRecord
IF OBJECT_ID('dbo.sp_UpdateRecord', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateRecord;
GO
CREATE PROCEDURE dbo.sp_UpdateRecord
    @tableName NVARCHAR(128),
    @primaryKey NVARCHAR(128),
    @id SQL_VARIANT,
    @columns NVARCHAR(MAX),   -- JSON array of columns
    @values NVARCHAR(MAX)     -- JSON array of values
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @setClause NVARCHAR(MAX) = N'';
    DECLARE @paramDef NVARCHAR(MAX) = N'';
    DECLARE @paramNames NVARCHAR(MAX) = N'';
    DECLARE @i INT = 0;
    DECLARE @col NVARCHAR(128);
    DECLARE @val NVARCHAR(MAX);

    DECLARE col_cursor CURSOR FOR SELECT value FROM OPENJSON(@columns) ORDER BY [key];
    DECLARE val_cursor CURSOR FOR SELECT value FROM OPENJSON(@values) ORDER BY [key];

    OPEN col_cursor; OPEN val_cursor;
    FETCH NEXT FROM col_cursor INTO @col;
    FETCH NEXT FROM val_cursor INTO @val;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @setClause <> N'' SET @setClause = @setClause + N', ';
        SET @setClause = @setClause + QUOTENAME(@col) + N' = @p' + CONVERT(NVARCHAR(10), @i);

        IF @paramDef <> N'' SET @paramDef = @paramDef + N', ';
        SET @paramDef = @paramDef + N'@p' + CONVERT(NVARCHAR(10), @i) + N' NVARCHAR(4000)';

        IF @paramNames <> N'' SET @paramNames = @paramNames + N', ';
        SET @paramNames = @paramNames + N'@p' + CONVERT(NVARCHAR(10), @i) + N' = ' + QUOTENAME(@val, '''');

        SET @i = @i + 1;

        FETCH NEXT FROM col_cursor INTO @col;
        FETCH NEXT FROM val_cursor INTO @val;
    END

    CLOSE col_cursor; DEALLOCATE col_cursor;
    CLOSE val_cursor; DEALLOCATE val_cursor;

    DECLARE @sql NVARCHAR(MAX) = N'UPDATE ' + QUOTENAME(@tableName) + N' SET ' + @setClause + N' WHERE ' + QUOTENAME(@primaryKey) + N' = @id;';

    DECLARE @execSql NVARCHAR(MAX) = N'EXEC sp_executesql N''' + REPLACE(@sql, '''', '''''') + N''', N''@id sql_variant' 
        + CASE WHEN @paramDef <> N'' THEN N', ' + REPLACE(@paramDef, '''', '''''') ELSE N'' END + N'''';
    IF @paramNames <> N'' 
        SET @execSql = @execSql + N', @id = ' + QUOTENAME(COALESCE(CAST(@id AS NVARCHAR(MAX)), ''), '''') + N', ' + @paramNames;
    ELSE
        SET @execSql = @execSql + N', @id = ' + QUOTENAME(COALESCE(CAST(@id AS NVARCHAR(MAX)), ''), '''');

    EXEC (@execSql);
END
GO

-- sp_DeleteRecord
IF OBJECT_ID('dbo.sp_DeleteRecord', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_DeleteRecord;
GO
CREATE PROCEDURE dbo.sp_DeleteRecord
    @tableName NVARCHAR(128),
    @primaryKey NVARCHAR(128),
    @id SQL_VARIANT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX) = N'DELETE FROM ' + QUOTENAME(@tableName) + N' WHERE ' + QUOTENAME(@primaryKey) + N' = @id;';
    EXEC sp_executesql @sql, N'@id sql_variant', @id = @id;
END
GO

-- sp_Search (multiple criteria, no pagination)
IF OBJECT_ID('dbo.sp_Search', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Search;
GO
CREATE PROCEDURE dbo.sp_Search
    @tableName NVARCHAR(128),
    @primaryKey NVARCHAR(128),
    @filterColumns NVARCHAR(MAX),
    @filterValues NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @where NVARCHAR(MAX) = N'';
    DECLARE @i INT = 0;
    DECLARE @col NVARCHAR(128);
    DECLARE @val NVARCHAR(MAX);

    DECLARE col_cursor CURSOR FOR SELECT value FROM OPENJSON(@filterColumns) ORDER BY [key];
    DECLARE val_cursor CURSOR FOR SELECT value FROM OPENJSON(@filterValues) ORDER BY [key];

    OPEN col_cursor; OPEN val_cursor;
    FETCH NEXT FROM col_cursor INTO @col;
    FETCH NEXT FROM val_cursor INTO @val;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @where <> N'' SET @where = @where + N' AND ';
        SET @where = @where + QUOTENAME(@col) + N' LIKE ' + QUOTENAME('%' + @val + '%', '''');
        SET @i = @i + 1;

        FETCH NEXT FROM col_cursor INTO @col;
        FETCH NEXT FROM val_cursor INTO @val;
    END

    CLOSE col_cursor; DEALLOCATE col_cursor;
    CLOSE val_cursor; DEALLOCATE val_cursor;

    DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM ' + QUOTENAME(@tableName) 
        + CASE WHEN @where = N'' THEN N'' ELSE N' WHERE ' + @where END
        + N' ORDER BY ' + QUOTENAME(@primaryKey) + N' DESC;';

    EXEC sp_executesql @sql;
END
GO

-- ClienteService

-- Procedimientos almacenados para ClienteService (SQL Server)
-- Despliega este script en la misma base de datos que usa tu aplicación.

/* sp_GetClienteByCedula
   Devuelve todos los campos de la tabla Cliente para una cédula dada.
*/
IF OBJECT_ID('dbo.sp_GetClienteByCedula', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetClienteByCedula;
GO
CREATE PROCEDURE dbo.sp_GetClienteByCedula
    @cedula NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM Cliente
    WHERE Cedula = @cedula;
END
GO

/* sp_GetHistorialComprasByClienteId
   Devuelve historial de ventas del cliente con columnas compatibles:
   todas las columnas de Venta (v.*), ColaboradorNombre, ColaboradorApellidos, TotalProductos
*/
IF OBJECT_ID('dbo.sp_GetHistorialComprasByClienteId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetHistorialComprasByClienteId;
GO
CREATE PROCEDURE dbo.sp_GetHistorialComprasByClienteId
    @clienteId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        v.*,
        col.Nombre AS ColaboradorNombre,
        col.Apellidos AS ColaboradorApellidos,
        COUNT(dv.Id_DetalleVenta) AS TotalProductos
    FROM Venta v
    INNER JOIN Colaborador col ON v.Id_Colaborador = col.Id_Colaborador
    LEFT JOIN DetalleVenta dv ON v.Id_Venta = dv.Id_Venta
    WHERE v.Id_Cliente = @clienteId
    GROUP BY 
        v.Id_Venta, v.Id_Cliente, v.Id_Colaborador, v.Subtotal, 
        v.Descuento, v.Impuesto, v.Total, v.MetodoPago, v.Fecha, 
        v.Estado, col.Nombre, col.Apellidos
    ORDER BY v.Fecha DESC;
END
GO

/* sp_GetEstadisticasCliente
   Devuelve agregados estadísticos para un cliente (TotalCompras, TotalGastado, PromedioCompra, UltimaCompra, PrimeraCompra)
*/
IF OBJECT_ID('dbo.sp_GetEstadisticasCliente', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetEstadisticasCliente;
GO
CREATE PROCEDURE dbo.sp_GetEstadisticasCliente
    @clienteId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(v.Id_Venta) AS TotalCompras,
        ISNULL(SUM(v.Total), 0) AS TotalGastado,
        ISNULL(AVG(CAST(v.Total AS DECIMAL(18,2))), 0) AS PromedioCompra,
        MAX(v.Fecha) AS UltimaCompra,
        MIN(v.Fecha) AS PrimeraCompra
    FROM Venta v
    WHERE v.Id_Cliente = @clienteId
      AND v.Estado = 'COMPLETADA';
END
GO

-- COMPRAService

-- Procedimientos almacenados para Compra (SQL Server Express)
-- Despliega este script en la misma base de datos usada por la app.

IF OBJECT_ID('dbo.sp_CreateCompra', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateCompra;
GO
CREATE PROCEDURE dbo.sp_CreateCompra
    @proveedorId INT,
    @colaboradorId INT,
    @productoId INT,
    @cantidad INT,
    @precioUnitario DECIMAL(10,2),
    @total DECIMAL(10,2),
    @newId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Compra
        (Id_Proveedor, Id_Colaborador, Id_Producto, Cantidad, PrecioUnitario, Total, Fecha, Estado)
    VALUES
        (@proveedorId, @colaboradorId, @productoId, @cantidad, @precioUnitario, @total, GETDATE(), 'COMPLETADA');

    SET @newId = SCOPE_IDENTITY();
END
GO

IF OBJECT_ID('dbo.sp_GetCompraDetailsById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetCompraDetailsById;
GO
CREATE PROCEDURE dbo.sp_GetCompraDetailsById
    @compraId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.*,
        p.Nombre AS ProductoNombre,
        prov.Nombre AS ProveedorNombre,
        col.Nombre AS ColaboradorNombre,
        col.Apellidos AS ColaboradorApellidos
    FROM Compra c
    INNER JOIN Producto p ON c.Id_Producto = p.Id_Producto
    INNER JOIN Proveedor prov ON c.Id_Proveedor = prov.Id_Proveedor
    INNER JOIN Colaborador col ON c.Id_Colaborador = col.Id_Colaborador
    WHERE c.Id_Compra = @compraId;
END
GO

-- DashboardService

-- Procedimientos almacenados para Dashboard (SQL Server Express)
-- Desplegar en la misma base de datos que usa la aplicación.
-- Cada procedimiento devuelve el conjunto de resultados esperado por el service.

SET NOCOUNT ON;
GO

-- Ventas hoy
IF OBJECT_ID('dbo.sp_GetVentasHoy', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasHoy;
GO
CREATE PROCEDURE dbo.sp_GetVentasHoy
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS cantidad,
        ISNULL(SUM(TotalVenta), 0) AS total,
        ISNULL(AVG(TotalVenta), 0) AS promedio
    FROM Venta
    WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
      AND Estado = 'Completada';
END
GO

-- Ventas mes actual
IF OBJECT_ID('dbo.sp_GetVentasMes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasMes;
GO
CREATE PROCEDURE dbo.sp_GetVentasMes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS cantidad,
        ISNULL(SUM(TotalVenta), 0) AS total,
        ISNULL(AVG(TotalVenta), 0) AS promedio
    FROM Venta
    WHERE YEAR(Fecha) = YEAR(GETDATE())
      AND MONTH(Fecha) = MONTH(GETDATE())
      AND Estado = 'Completada';
END
GO

-- Productos totales (resumen inventario)
IF OBJECT_ID('dbo.sp_GetProductosTotal', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetProductosTotal;
GO
CREATE PROCEDURE dbo.sp_GetProductosTotal
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS total,
        ISNULL(SUM(CantidadActual), 0) AS unidadesTotal,
        ISNULL(SUM(CantidadActual * PrecioVenta), 0) AS valorInventario
    FROM Producto;
END
GO

-- Productos con stock bajo
IF OBJECT_ID('dbo.sp_GetProductosLowStock', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetProductosLowStock;
GO
CREATE PROCEDURE dbo.sp_GetProductosLowStock
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS cantidad
    FROM Producto
    WHERE CantidadActual <= CantidadMinima;
END
GO

-- Clientes total (puedes extender para nuevosHoy en otro SP si lo deseas)
IF OBJECT_ID('dbo.sp_GetClientesTotal', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetClientesTotal;
GO
CREATE PROCEDURE dbo.sp_GetClientesTotal
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS total,
        0 AS nuevosHoy
    FROM Cliente;
END
GO

-- Alquileres activos resumen
IF OBJECT_ID('dbo.sp_GetAlquileresActivosSummary', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAlquileresActivosSummary;
GO
CREATE PROCEDURE dbo.sp_GetAlquileresActivosSummary
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS total,
        ISNULL(SUM(Total), 0) AS valorTotal
    FROM Alquiler
    WHERE Estado = 'Activo';
END
GO

-- Top productos (último mes) con parámetro @limit
IF OBJECT_ID('dbo.sp_GetTopProductos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetTopProductos;
GO
CREATE PROCEDURE dbo.sp_GetTopProductos
    @limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit)
        p.Id_Producto,
        p.Nombre,
        p.PrecioVenta,
        COUNT(dv.Id_detalleVenta) AS cantidadVentas,
        SUM(dv.CantidadVenta) AS unidadesVendidas,
        SUM(dv.Subtotal) AS totalVentas
    FROM DetalleVenta dv
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
    WHERE v.Estado = 'Completada'
      AND v.Fecha >= DATEADD(MONTH, -1, GETDATE())
    GROUP BY p.Id_Producto, p.Nombre, p.PrecioVenta
    ORDER BY unidadesVendidas DESC;
END
GO

-- Ventas recientes con parámetro @limit
IF OBJECT_ID('dbo.sp_GetVentasRecientes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasRecientes;
GO
CREATE PROCEDURE dbo.sp_GetVentasRecientes
    @limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit)
        v.Id_venta,
        v.TotalVenta,
        v.Fecha,
        v.Estado,
        v.MetodoPago,
        c.Nombre + ' ' + ISNULL(c.Apellido1,'') AS ClienteNombre,
        col.Nombre + ' ' + ISNULL(col.Apellido1,'') AS ColaboradorNombre,
        COUNT(dv.Id_detalleVenta) AS CantidadItems
    FROM Venta v
    INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
    LEFT JOIN DetalleVenta dv ON v.Id_venta = dv.Id_venta
    GROUP BY v.Id_venta, v.TotalVenta, v.Fecha, v.Estado, v.MetodoPago,
             c.Nombre, c.Apellido1, col.Nombre, col.Apellido1
    ORDER BY v.Fecha DESC;
END
GO

-- Ventas por día (últimos @days días)
IF OBJECT_ID('dbo.sp_GetVentasPorDia', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasPorDia;
GO
CREATE PROCEDURE dbo.sp_GetVentasPorDia
    @days INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH Fechas AS (
        SELECT TOP (@days)
            CAST(DATEADD(DAY, -ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 1, GETDATE()) AS DATE) AS Fecha
        FROM sys.all_objects
    )
    SELECT 
        f.Fecha,
        DATENAME(WEEKDAY, f.Fecha) AS DiaSemana,
        ISNULL(COUNT(v.Id_venta), 0) AS CantidadVentas,
        ISNULL(SUM(v.TotalVenta), 0) AS TotalVentas,
        ISNULL(AVG(v.TotalVenta), 0) AS PromedioVenta
    FROM Fechas f
    LEFT JOIN Venta v ON CAST(v.Fecha AS DATE) = f.Fecha AND v.Estado = 'Completada'
    GROUP BY f.Fecha
    ORDER BY f.Fecha ASC;
END
GO

-- Ventas por categoría (último mes)
IF OBJECT_ID('dbo.sp_GetVentasPorCategoria', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasPorCategoria;
GO
CREATE PROCEDURE dbo.sp_GetVentasPorCategoria
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.Nombre AS Categoria,
        COUNT(DISTINCT dv.Id_venta) AS CantidadVentas,
        SUM(dv.CantidadVenta) AS UnidadesVendidas,
        SUM(dv.Subtotal) AS TotalVentas,
        AVG(dv.Subtotal) AS PromedioVenta
    FROM DetalleVenta dv
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    INNER JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
    WHERE v.Estado = 'Completada'
      AND v.Fecha >= DATEADD(MONTH, -1, GETDATE())
    GROUP BY c.Id_categoria, c.Nombre
    ORDER BY TotalVentas DESC;
END
GO

-- Ventas por método de pago (último mes)
IF OBJECT_ID('dbo.sp_GetVentasPorMetodoPago', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasPorMetodoPago;
GO
CREATE PROCEDURE dbo.sp_GetVentasPorMetodoPago
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        MetodoPago,
        COUNT(*) AS CantidadVentas,
        SUM(TotalVenta) AS TotalVentas,
        AVG(TotalVenta) AS PromedioVenta,
        CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2)) AS Porcentaje
    FROM Venta
    WHERE Estado = 'Completada'
      AND Fecha >= DATEADD(MONTH, -1, GETDATE())
    GROUP BY MetodoPago
    ORDER BY TotalVentas DESC;
END
GO

-- Top clientes (por gasto)
IF OBJECT_ID('dbo.sp_GetTopClientes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetTopClientes;
GO
CREATE PROCEDURE dbo.sp_GetTopClientes
    @limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit)
        c.Id_cliente,
        c.Nombre,
        c.Apellido1,
        c.Apellido2,
        c.Telefono,
        c.Correo,
        COUNT(v.Id_venta) AS CantidadCompras,
        SUM(v.TotalVenta) AS TotalGastado,
        AVG(v.TotalVenta) AS PromedioCompra,
        MAX(v.Fecha) AS UltimaCompra
    FROM Cliente c
    INNER JOIN Venta v ON c.Id_cliente = v.Id_cliente
    WHERE v.Estado = 'Completada'
    GROUP BY c.Id_cliente, c.Nombre, c.Apellido1, c.Apellido2, c.Telefono, c.Correo
    ORDER BY TotalGastado DESC;
END
GO

-- Rendimiento de colaboradores (último mes)
IF OBJECT_ID('dbo.sp_GetRendimientoColaboradores', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetRendimientoColaboradores;
GO
CREATE PROCEDURE dbo.sp_GetRendimientoColaboradores
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        col.Id_colaborador,
        col.Nombre,
        col.Apellido1,
        col.Apellido2,
        COUNT(v.Id_venta) AS CantidadVentas,
        ISNULL(SUM(v.TotalVenta), 0) AS TotalVentas,
        ISNULL(AVG(v.TotalVenta), 0) AS PromedioVenta,
        MAX(v.Fecha) AS UltimaVenta
    FROM Colaborador col
    LEFT JOIN Venta v ON col.Id_colaborador = v.Id_colaborador 
        AND v.Estado = 'Completada'
        AND v.Fecha >= DATEADD(MONTH, -1, GETDATE())
    GROUP BY col.Id_colaborador, col.Nombre, col.Apellido1, col.Apellido2
    ORDER BY TotalVentas DESC;
END
GO

-- Análisis de inventario: devuelve dos resultsets: resumen y por categoria
IF OBJECT_ID('dbo.sp_GetAnalisisInventario', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAnalisisInventario;
GO
CREATE PROCEDURE dbo.sp_GetAnalisisInventario
AS
BEGIN
    SET NOCOUNT ON;

    -- Resumen
    SELECT 
        COUNT(*) AS TotalProductos,
        ISNULL(SUM(CantidadActual),0) AS UnidadesTotales,
        ISNULL(SUM(CantidadActual * PrecioVenta),0) AS ValorInventario,
        ISNULL(SUM(CASE WHEN CantidadActual <= CantidadMinima THEN 1 ELSE 0 END),0) AS ProductosStockBajo,
        ISNULL(SUM(CASE WHEN CantidadActual = 0 THEN 1 ELSE 0 END),0) AS ProductosAgotados,
        ISNULL(AVG(CantidadActual),0) AS PromedioStock,
        ISNULL(MIN(CantidadActual),0) AS StockMinimoActual,
        ISNULL(MAX(CantidadActual),0) AS StockMaximoActual
    FROM Producto;

    -- Por categoria
    SELECT 
        c.Nombre AS Categoria,
        COUNT(p.Id_Producto) AS CantidadProductos,
        ISNULL(SUM(p.CantidadActual),0) AS UnidadesTotales,
        ISNULL(SUM(p.CantidadActual * p.PrecioVenta),0) AS ValorInventario,
        ISNULL(AVG(p.PrecioVenta),0) AS PrecioPromedio
    FROM Categoria c
    LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
    GROUP BY c.Id_categoria, c.Nombre
    ORDER BY ValorInventario DESC;
END
GO

-- Movimientos recientes
IF OBJECT_ID('dbo.sp_GetMovimientosRecientes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetMovimientosRecientes;
GO
CREATE PROCEDURE dbo.sp_GetMovimientosRecientes
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit)
        dm.Id_detalleMovimiento,
        dm.Cantidad,
        dm.Descripcion,
        m.Fecha,
        p.Nombre AS ProductoNombre,
        p.CantidadActual AS StockActual,
        c.Nombre AS CategoriaNombre,
        tdm.Nombre AS TipoMovimiento
    FROM DetalleMovimiento dm
    INNER JOIN Movimiento m ON dm.Id_movimiento = m.Id_movimiento
    INNER JOIN Producto p ON dm.Id_producto = p.Id_Producto
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    INNER JOIN TipoDetalleMovimiento tdm ON dm.Id_tipoDetalleMovimiento = tdm.Id_tipoDetalleMovimiento
    ORDER BY m.Fecha DESC;
END
GO

-- Resumen financiero: devuelve varios resultsets (ventasHoy, ventasSemana, ventasMes, comprasMes, alquileresActivos)
IF OBJECT_ID('dbo.sp_GetResumenFinanciero', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetResumenFinanciero;
GO
CREATE PROCEDURE dbo.sp_GetResumenFinanciero
AS
BEGIN
    SET NOCOUNT ON;
    -- ventasHoy
    SELECT 
        ISNULL(SUM(TotalVenta),0) AS total,
        COUNT(*) AS cantidad
    FROM Venta
    WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
      AND Estado = 'Completada';

    -- ventasSemana
    SELECT 
        ISNULL(SUM(TotalVenta),0) AS total,
        COUNT(*) AS cantidad
    FROM Venta
    WHERE Fecha >= DATEADD(DAY, -7, GETDATE())
      AND Estado = 'Completada';

    -- ventasMes
    SELECT 
        ISNULL(SUM(TotalVenta),0) AS total,
        COUNT(*) AS cantidad
    FROM Venta
    WHERE YEAR(Fecha) = YEAR(GETDATE())
      AND MONTH(Fecha) = MONTH(GETDATE())
      AND Estado = 'Completada';

    -- comprasMes
    SELECT
        ISNULL(SUM(Total),0) AS total,
        COUNT(*) AS cantidad
    FROM Compra
    WHERE YEAR(Fecha) = YEAR(GETDATE())
      AND MONTH(Fecha) = MONTH(GETDATE());

    -- alquileresActivos
    SELECT 
        ISNULL(SUM(Total),0) AS total,
        COUNT(*) AS cantidad
    FROM Alquiler
    WHERE Estado = 'Activo';
END
GO

-- Alertas: devuelve tres resultsets (stockBajo, alquileresVencidos, sinMovimiento)
IF OBJECT_ID('dbo.sp_GetAlertasDashboard', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAlertasDashboard;
GO
CREATE PROCEDURE dbo.sp_GetAlertasDashboard
AS
BEGIN
    SET NOCOUNT ON;

    -- stockBajo
    SELECT 
        p.Id_Producto,
        p.Nombre,
        p.CantidadActual,
        p.CantidadMinima,
        (p.CantidadMinima - p.CantidadActual) AS Faltante,
        c.Nombre AS Categoria
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE p.CantidadActual <= p.CantidadMinima
    ORDER BY Faltante DESC;

    -- alquileresVencidos
    SELECT 
        a.Id_Alquiler AS Id_alquiler,
        a.FechaFin,
        DATEDIFF(DAY, a.FechaFin, GETDATE()) AS DiasVencidos,
        p.Nombre AS ProductoNombre,
        c.Nombre + ' ' + ISNULL(c.Apellido1,'') AS ClienteNombre,
        c.Telefono AS ClienteTelefono
    FROM Alquiler a
    INNER JOIN DetalleAlquiler da ON a.Id_Alquiler = da.Id_Alquiler
    INNER JOIN Producto p ON da.Id_Producto = p.Id_Producto
    INNER JOIN Cliente c ON a.Id_Cliente = c.Id_Cliente
    WHERE a.Estado = 'Activo'
      AND a.FechaFin < GETDATE()
    ORDER BY DiasVencidos DESC;

    -- sinMovimiento (top 10)
    SELECT TOP 10
        p.Id_Producto,
        p.Nombre,
        p.CantidadActual,
        p.PrecioVenta,
        c.Nombre AS Categoria,
        DATEDIFF(DAY, p.FechaEntrada, GETDATE()) AS DiasSinMovimiento
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
END
GO

-- productoService

-- Procedimientos almacenados para Producto (SQL Server Express)
-- Desplegar este script en la misma base de datos que usa la aplicación.
SET NOCOUNT ON;
GO

--------------------------------------------------------------------------------
-- sp_GetProductosPaged
-- Parámetros:
--  @page INT
--  @limit INT
--  @filterColumns NVARCHAR(MAX)  -> JSON array of column names e.g. '["Nombre","Marca"]'
--  @filterValues NVARCHAR(MAX)   -> JSON array of values e.g. '["tal","otra"]'
-- Devuelve dos resultsets: primero { Total }, segundo rows paginadas con join a Categoria.
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetProductosPaged', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetProductosPaged;
GO
CREATE PROCEDURE dbo.sp_GetProductosPaged
    @page INT,
    @limit INT,
    @filterColumns NVARCHAR(MAX) = NULL,
    @filterValues NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = CASE WHEN @page > 0 THEN (@page - 1) * @limit ELSE 0 END;
    DECLARE @where NVARCHAR(MAX) = N'';
    DECLARE @sqlTotal NVARCHAR(MAX);
    DECLARE @sqlRows NVARCHAR(MAX);
    DECLARE @sql NVARCHAR(MAX);

    IF @filterColumns IS NOT NULL AND @filterValues IS NOT NULL
    BEGIN
        -- Build WHERE clause by pairing the JSON arrays (assuming same order)
        DECLARE @i INT = 0;
        DECLARE @col NVARCHAR(128);
        DECLARE @val NVARCHAR(MAX);
        DECLARE cols_cursor CURSOR FOR SELECT value FROM OPENJSON(@filterColumns) ORDER BY [key];
        DECLARE vals_cursor CURSOR FOR SELECT value FROM OPENJSON(@filterValues) ORDER BY [key];

        OPEN cols_cursor; OPEN vals_cursor;
        FETCH NEXT FROM cols_cursor INTO @col;
        FETCH NEXT FROM vals_cursor INTO @val;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            IF @where <> N'' SET @where = @where + N' AND ';
            -- Use LIKE with escaped value; we embed the value safely by doubling single quotes
            SET @where = @where + QUOTENAME(@col) + N' LIKE ' + QUOTENAME('%' + REPLACE(@val,'''','''''') + '%', '''');
            SET @i = @i + 1;
            FETCH NEXT FROM cols_cursor INTO @col;
            FETCH NEXT FROM vals_cursor INTO @val;
        END
        CLOSE cols_cursor; DEALLOCATE cols_cursor;
        CLOSE vals_cursor; DEALLOCATE vals_cursor;
    END

    IF @where = N''
    BEGIN
        SET @sqlTotal = N'SELECT COUNT(*) AS Total FROM Producto p';
        SET @sqlRows = N'
            SELECT 
                p.*,
                c.Nombre AS CategoriaNombre,
                c.Descripcion AS CategoriaDescripcion
            FROM Producto p
            LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
            ORDER BY p.Id_Producto DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    END
    ELSE
    BEGIN
        SET @sqlTotal = N'SELECT COUNT(*) AS Total FROM Producto p WHERE ' + @where;
        SET @sqlRows = N'
            SELECT 
                p.*,
                c.Nombre AS CategoriaNombre,
                c.Descripcion AS CategoriaDescripcion
            FROM Producto p
            LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
            WHERE ' + @where + N'
            ORDER BY p.Id_Producto DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    END

    -- Execute total then rows via sp_executesql with parameters for offset/limit
    EXEC sp_executesql @sqlTotal;
    EXEC sp_executesql @sqlRows, N'@offset INT, @limit INT', @offset = @offset, @limit = @limit;
END
GO

--------------------------------------------------------------------------------
-- sp_GetLowStockProducts
-- Devuelve productos con stock bajo (CantidadActual <= CantidadMinima)
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetLowStockProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetLowStockProducts;
GO
CREATE PROCEDURE dbo.sp_GetLowStockProducts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.*,
        c.Nombre AS CategoriaNombre,
        (p.CantidadMinima - p.CantidadActual) AS Faltante
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE p.CantidadActual <= p.CantidadMinima
    ORDER BY Faltante DESC;
END
GO

--------------------------------------------------------------------------------
-- sp_AdjustStock
-- Actualiza stock, crea Movimiento y DetalleMovimiento de forma atómica.
-- Parámetros:
--   @prodId INT,
--   @cantidad INT,
--   @descripcion NVARCHAR(4000),
--   @userId NVARCHAR(200), -- responsable/usuario
--   @tipoMovCode NVARCHAR(100) = NULL -- opcional, busca Codigo='AJUSTE' si NULL busca por nombre LIKE '%AJUSTE%'
-- Devuelve:
--   OUTPUT @movId INT (Id_movimiento insertado)
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_AdjustStock', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AdjustStock;
GO
CREATE PROCEDURE dbo.sp_AdjustStock
    @prodId INT,
    @cantidad INT,
    @descripcion NVARCHAR(4000),
    @userId NVARCHAR(200),
    @tipoMovCode NVARCHAR(100) = NULL,
    @movId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Update Producto stock
    UPDATE Producto
    SET CantidadActual = CantidadActual + @cantidad
    WHERE Id_Producto = @prodId;

    -- Insert Movimiento
    INSERT INTO Movimiento (Fecha, Responsable, Id_colaborador)
    OUTPUT INSERTED.Id_movimiento INTO @movIdTable -- temporary capture
    VALUES (GETDATE(), @userId, 1);

    -- We need a table variable to capture OUTPUT
    DECLARE @movIdTable TABLE (movId INT);
    -- redo insert using OUTPUT into table variable
    DELETE FROM Movimiento WHERE 0 = 1; -- no-op to ensure table exists (not necessary but keeping flow)
    -- Actually perform insert properly capturing id
    INSERT INTO Movimiento (Fecha, Responsable, Id_colaborador)
    OUTPUT INSERTED.Id_movimiento INTO @movIdTable
    VALUES (GETDATE(), @userId, 1);

    SELECT TOP 1 @movId = movId FROM @movIdTable;

    -- Find tipo movimiento
    DECLARE @tipoMovId INT = NULL;
    IF @tipoMovCode IS NOT NULL
    BEGIN
        SELECT TOP 1 @tipoMovId = Id_tipoDetalleMovimiento
        FROM TipoDetalleMovimiento
        WHERE Codigo = @tipoMovCode;
    END

    IF @tipoMovId IS NULL
    BEGIN
        SELECT TOP 1 @tipoMovId = Id_tipoDetalleMovimiento
        FROM TipoDetalleMovimiento
        WHERE Codigo = 'AJUSTE' OR Nombre LIKE '%AJUSTE%';
    END

    IF @tipoMovId IS NULL
        SET @tipoMovId = 1; -- fallback

    -- Insert detalle
    INSERT INTO DetalleMovimiento (Cantidad, Descripcion, Id_tipoDetalleMovimiento, Id_movimiento, Id_producto)
    VALUES (@cantidad, @descripcion, @tipoMovId, @movId, @prodId);
END
GO

--------------------------------------------------------------------------------
-- sp_GetMovimientosByProducto
-- Parámetros:
--   @prodId INT,
--   @limit INT = 20
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetMovimientosByProducto', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetMovimientosByProducto;
GO
CREATE PROCEDURE dbo.sp_GetMovimientosByProducto
    @prodId INT,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@limit)
        dm.Cantidad,
        dm.Descripcion,
        m.Fecha,
        tdm.Nombre AS TipoMovimiento,
        m.Responsable
    FROM DetalleMovimiento dm
    INNER JOIN Movimiento m ON dm.Id_movimiento = m.Id_movimiento
    INNER JOIN TipoDetalleMovimiento tdm ON dm.Id_tipoDetalleMovimiento = tdm.Id_tipoDetalleMovimiento
    WHERE dm.Id_producto = @prodId
    ORDER BY m.Fecha DESC;
END
GO

-- proveedorService

-- Procedimientos almacenados para Proveedor (SQL Server)
-- Despliega este script en la misma base de datos que usa la aplicación.
SET NOCOUNT ON;
GO

-- sp_GetHistorialComprasProveedor
-- Devuelve el historial de compras para un proveedor, con información del colaborador
IF OBJECT_ID('dbo.sp_GetHistorialComprasProveedor', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetHistorialComprasProveedor;
GO
CREATE PROCEDURE dbo.sp_GetHistorialComprasProveedor
    @proveedorId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.*,
        col.Nombre AS ColaboradorNombre,
        col.Apellidos AS ColaboradorApellidos
    FROM Compra c
    INNER JOIN Colaborador col ON c.Id_Colaborador = col.Id_Colaborador
    WHERE c.Id_Proveedor = @proveedorId
    ORDER BY c.Fecha DESC;
END
GO

-- sp_GetProductosByProveedor
-- Devuelve los productos asociados a un proveedor (distinct), con la categoría
IF OBJECT_ID('dbo.sp_GetProductosByProveedor', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetProductosByProveedor;
GO
CREATE PROCEDURE dbo.sp_GetProductosByProveedor
    @proveedorId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        p.*,
        c.Nombre AS CategoriaNombre
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
    INNER JOIN Compra comp ON p.Id_Producto = comp.Id_Producto
    WHERE comp.Id_Proveedor = @proveedorId
    ORDER BY p.Nombre;
END
GO

-- reportService

-- Procedimientos almacenados para Reportes (SQL Server Express)
-- Despliega este script en la misma base de datos que usa tu aplicación.
SET NOCOUNT ON;
GO

--------------------------------------------------------------------------------
-- sp_ReporteVentas
-- Parámetros: @fechaInicio DATETIME, @fechaFin DATETIME
-- Devuelve dos resultsets: 1) filas de ventas, 2) resumen agregado
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ReporteVentas', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ReporteVentas;
GO
CREATE PROCEDURE dbo.sp_ReporteVentas
    @fechaInicio DATETIME,
    @fechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        v.Id_venta,
        v.Fecha,
        v.TotalVenta,
        v.MetodoPago,
        v.Estado,
        c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') AS Cliente,
        col.Nombre + ' ' + col.Apellido1 AS Colaborador,
        COUNT(dv.Id_detalleVenta) AS CantidadItems,
        ISNULL(SUM(dv.CantidadVenta), 0) AS TotalUnidades
    FROM Venta v
    INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
    LEFT JOIN DetalleVenta dv ON v.Id_venta = dv.Id_venta
    WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin
    GROUP BY v.Id_venta, v.Fecha, v.TotalVenta, v.MetodoPago, v.Estado,
             c.Nombre, c.Apellido1, c.Apellido2, col.Nombre, col.Apellido1
    ORDER BY v.Fecha DESC;

    SELECT 
        COUNT(*) AS TotalVentas,
        ISNULL(SUM(TotalVenta), 0) AS TotalIngresos,
        ISNULL(AVG(TotalVenta), 0) AS PromedioVenta,
        ISNULL(MAX(TotalVenta), 0) AS VentaMaxima,
        ISNULL(MIN(TotalVenta), 0) AS VentaMinima
    FROM Venta
    WHERE Fecha BETWEEN @fechaInicio AND @fechaFin
      AND Estado = 'Completada';
END
GO

--------------------------------------------------------------------------------
-- sp_ReporteInventario
-- Devuelve dos resultsets: 1) productos (con estado y valor), 2) resumen agregado
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ReporteInventario', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ReporteInventario;
GO
CREATE PROCEDURE dbo.sp_ReporteInventario
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.Id_Producto,
        p.Nombre,
        p.Descripcion,
        p.PrecioVenta,
        p.CantidadActual,
        p.CantidadMinima,
        c.Nombre AS Categoria,
        (p.CantidadActual * p.PrecioVenta) AS ValorStock,
        CASE 
            WHEN p.CantidadActual = 0 THEN 'AGOTADO'
            WHEN p.CantidadActual <= p.CantidadMinima THEN 'STOCK BAJO'
            ELSE 'NORMAL'
        END AS Estado
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    ORDER BY c.Nombre, p.Nombre;

    SELECT 
        COUNT(*) AS TotalProductos,
        ISNULL(SUM(CantidadActual), 0) AS UnidadesTotales,
        ISNULL(SUM(CantidadActual * PrecioVenta), 0) AS ValorTotalInventario,
        ISNULL(SUM(CASE WHEN CantidadActual = 0 THEN 1 ELSE 0 END), 0) AS ProductosAgotados,
        ISNULL(SUM(CASE WHEN CantidadActual <= CantidadMinima THEN 1 ELSE 0 END), 0) AS ProductosStockBajo
    FROM Producto;
END
GO

--------------------------------------------------------------------------------
-- sp_ReporteClientes
-- Devuelve listado de clientes con agregados de compras
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ReporteClientes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ReporteClientes;
GO
CREATE PROCEDURE dbo.sp_ReporteClientes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.Id_cliente,
        c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') AS NombreCompleto,
        c.Telefono,
        c.Correo,
        c.Direccion,
        COUNT(v.Id_venta) AS TotalCompras,
        ISNULL(SUM(v.TotalVenta), 0) AS TotalGastado,
        ISNULL(AVG(v.TotalVenta), 0) AS PromedioCompra,
        MAX(v.Fecha) AS UltimaCompra,
        DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) AS DiasUltimaCompra
    FROM Cliente c
    LEFT JOIN Venta v ON c.Id_cliente = v.Id_cliente AND v.Estado = 'Completada'
    GROUP BY c.Id_cliente, c.Nombre, c.Apellido1, c.Apellido2, 
             c.Telefono, c.Correo, c.Direccion
    ORDER BY TotalGastado DESC;
END
GO

--------------------------------------------------------------------------------
-- sp_ReporteProductosMasVendidos
-- Parámetros: @fechaInicio DATETIME, @fechaFin DATETIME, @limit INT
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ReporteProductosMasVendidos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ReporteProductosMasVendidos;
GO
CREATE PROCEDURE dbo.sp_ReporteProductosMasVendidos
    @fechaInicio DATETIME,
    @fechaFin DATETIME,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@limit)
        p.Id_Producto,
        p.Nombre,
        p.PrecioVenta,
        c.Nombre AS Categoria,
        COUNT(DISTINCT dv.Id_venta) AS CantidadVentas,
        ISNULL(SUM(dv.CantidadVenta), 0) AS UnidadesVendidas,
        ISNULL(SUM(dv.Subtotal), 0) AS TotalVentas,
        ISNULL(AVG(dv.PrecioUnitario), 0) AS PrecioPromedio
    FROM DetalleVenta dv
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
    WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin
      AND v.Estado = 'Completada'
    GROUP BY p.Id_Producto, p.Nombre, p.PrecioVenta, c.Nombre
    ORDER BY UnidadesVendidas DESC;
END
GO

--------------------------------------------------------------------------------
-- sp_ReporteCompras
-- Parámetros: @fechaInicio DATETIME, @fechaFin DATETIME
-- Devuelve dos resultsets: 1) compras detalle, 2) resumen agregado
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ReporteCompras', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ReporteCompras;
GO
CREATE PROCEDURE dbo.sp_ReporteCompras
    @fechaInicio DATETIME,
    @fechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.Id_compra,
        c.FechaCompra AS Fecha,
        c.TotalCompra AS Total,
        dc.Cantidad,
        dc.PrecioUnitario,
        p.Nombre AS Producto,
        prov.Nombre AS Proveedor,
        col.Nombre + ' ' + col.Apellido1 AS Colaborador
    FROM Compra c
    INNER JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
    INNER JOIN Proveedor prov ON c.Id_proveedor = prov.Id_proveedor
    INNER JOIN Colaborador col ON c.Id_colaborador = col.Id_colaborador
    WHERE c.FechaCompra BETWEEN @fechaInicio AND @fechaFin
    ORDER BY c.FechaCompra DESC;

    SELECT 
        COUNT(DISTINCT c.Id_compra) AS TotalCompras,
        ISNULL(SUM(c.TotalCompra), 0) AS TotalGastado,
        ISNULL(SUM(dc.Cantidad), 0) AS UnidadesCompradas,
        ISNULL(AVG(c.TotalCompra), 0) AS PromedioCompra
    FROM Compra c
    INNER JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    WHERE c.FechaCompra BETWEEN @fechaInicio AND @fechaFin;
END
GO

--------------------------------------------------------------------------------
-- sp_ReporteAlquileres
-- Parámetros: @fechaInicio DATETIME, @fechaFin DATETIME
-- Devuelve dos resultsets: 1) alquileres detalle, 2) resumen agregado
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ReporteAlquileres', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ReporteAlquileres;
GO
CREATE PROCEDURE dbo.sp_ReporteAlquileres
    @fechaInicio DATETIME,
    @fechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.Id_Alquiler AS Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.FechaDevolucion,
        a.Total AS TotalAlquiler,
        a.Estado,
        p.Nombre AS Producto,
        da.Cantidad,
        c.Nombre + ' ' + c.Apellido1 AS Cliente,
        col.Nombre + ' ' + col.Apellido1 AS Colaborador,
        CASE 
            WHEN a.Estado = 'Activo' AND a.FechaFin < GETDATE() THEN 'VENCIDO'
            ELSE a.Estado
        END AS EstadoActual
    FROM Alquiler a
    INNER JOIN DetalleAlquiler da ON a.Id_Alquiler = da.Id_Alquiler
    INNER JOIN Producto p ON da.Id_Producto = p.Id_Producto
    INNER JOIN Cliente c ON a.Id_Cliente = c.Id_Cliente
    INNER JOIN Colaborador col ON a.Id_Colaborador = col.Id_Colaborador
    WHERE a.FechaInicio BETWEEN @fechaInicio AND @fechaFin
    ORDER BY a.FechaInicio DESC;

    SELECT 
        COUNT(*) AS TotalAlquileres,
        ISNULL(SUM(a.Total), 0) AS TotalIngresos,
        ISNULL(AVG(a.Total), 0) AS PromedioAlquiler,
        ISNULL(SUM(CASE WHEN a.Estado = 'Activo' THEN 1 ELSE 0 END), 0) AS Activos,
        ISNULL(SUM(CASE WHEN a.Estado = 'Finalizado' THEN 1 ELSE 0 END), 0) AS Finalizados
    FROM Alquiler a
    WHERE a.FechaInicio BETWEEN @fechaInicio AND @fechaFin;
END
GO

-- TransactionService

-- Procedimientos almacenados para TransactionService (SQL Server)
-- Desplegar en la misma base de datos que usa la aplicación.
-- NOTA: revisa permisos y ajusta nombres de columnas/PK si difieren en tu esquema real.

SET NOCOUNT ON;
GO

-- sp_GetProductoById
-- Devuelve datos del producto necesarios para validaciones de stock
IF OBJECT_ID('dbo.sp_GetProductoById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetProductoById;
GO
CREATE PROCEDURE dbo.sp_GetProductoById
    @productId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Id_Producto,
        Nombre,
        CantidadActual,
        -- Column name used in service: StockMinimo (fallback to CantidadMinima if exists)
        CASE 
            WHEN COLUMNPROPERTY(object_id('dbo.Producto'), 'StockMinimo', 'ColumnId') IS NOT NULL THEN StockMinimo
            WHEN COLUMNPROPERTY(object_id('dbo.Producto'), 'CantidadMinima', 'ColumnId') IS NOT NULL THEN CantidadMinima
            ELSE NULL
        END AS StockMinimo
    FROM Producto
    WHERE Id_Producto = @productId;
END
GO

-- sp_UpdateStock
-- Actualiza el stock del producto y registra un movimiento en MovimientoStock.
-- Parámetros:
--   @productId INT,
--   @change INT,
--   @movType NVARCHAR(200),
--   @quantity INT = NULL  -- si se pasa NULL, se utiliza ABS(@change)
IF OBJECT_ID('dbo.sp_UpdateStock', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateStock;
GO
CREATE PROCEDURE dbo.sp_UpdateStock
    @productId INT,
    @change INT,
    @movType NVARCHAR(200),
    @quantity INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @qty INT = ISNULL(@quantity, ABS(ISNULL(@change,0)));

    -- Actualizar cantidad y fecha
    UPDATE Producto
    SET CantidadActual = ISNULL(CantidadActual, 0) + @change,
        FechaActualizacion = GETDATE()
    WHERE Id_Producto = @productId;

    -- Registrar movimiento de stock
    INSERT INTO MovimientoStock (Id_Producto, TipoMovimiento, Cantidad, Fecha)
    VALUES (@productId, @movType, @qty, GETDATE());
END
GO

-- sp_LogToBitacora
-- Inserta un registro en la bitácora de producto
IF OBJECT_ID('dbo.sp_LogToBitacora', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_LogToBitacora;
GO
CREATE PROCEDURE dbo.sp_LogToBitacora
    @tabla NVARCHAR(200),
    @accion NVARCHAR(100),
    @id_registro INT,
    @usuario NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO BitacoraProducto (Tabla, Accion, Id_Registro, Usuario, Fecha)
    VALUES (@tabla, @accion, @id_registro, @usuario, GETDATE());
END
GO

-- sp_CheckStockAlertByProductId
-- Devuelve producto si está en o por debajo del stock mínimo
IF OBJECT_ID('dbo.sp_CheckStockAlertByProductId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CheckStockAlertByProductId;
GO
CREATE PROCEDURE dbo.sp_CheckStockAlertByProductId
    @productId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Id_Producto,
        Nombre,
        CantidadActual,
        CASE 
            WHEN COLUMNPROPERTY(object_id('dbo.Producto'), 'StockMinimo', 'ColumnId') IS NOT NULL THEN StockMinimo
            WHEN COLUMNPROPERTY(object_id('dbo.Producto'), 'CantidadMinima', 'ColumnId') IS NOT NULL THEN CantidadMinima
            ELSE NULL
        END AS StockMinimo
    FROM Producto
    WHERE Id_Producto = @productId
      AND (CantidadActual <= 
           CASE 
             WHEN COLUMNPROPERTY(object_id('dbo.Producto'), 'StockMinimo', 'ColumnId') IS NOT NULL THEN StockMinimo
             WHEN COLUMNPROPERTY(object_id('dbo.Producto'), 'CantidadMinima', 'ColumnId') IS NOT NULL THEN CantidadMinima
             ELSE -1
           END);
END
GO

-- VentaService

-- Procedimientos almacenados para Venta (SQL Server Express)
-- Despliega este script en la misma base de datos que usa la aplicación.
SET NOCOUNT ON;
GO

--------------------------------------------------------------------------------
-- sp_GetVentasPaged
-- Parámetros opcionales para filtrar: @estado, @fechaInicio, @fechaFin, @clienteId
-- Devuelve filas paginadas según offset/limit
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetVentasPaged', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasPaged;
GO
CREATE PROCEDURE dbo.sp_GetVentasPaged
    @offset INT,
    @limit INT,
    @estado NVARCHAR(100) = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL,
    @clienteId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT 
            v.Id_venta,
            v.Fecha,
            v.TotalVenta,
            v.MetodoPago,
            v.Estado,
            c.Nombre + '' '' + c.Apellido1 + ISNULL('' '' + c.Apellido2, '''') AS Cliente,
            col.Nombre + '' '' + col.Apellido1 + ISNULL('' '' + col.Apellido2, '''') AS Colaborador,
            (SELECT COUNT(*) FROM DetalleVenta WHERE Id_venta = v.Id_venta) AS CantidadItems
        FROM Venta v
        INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
        INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
        WHERE 1=1 ';

    IF @estado IS NOT NULL
        SET @sql = @sql + N' AND v.Estado = @estadoParam';
    IF @fechaInicio IS NOT NULL
        SET @sql = @sql + N' AND v.Fecha >= @fechaInicioParam';
    IF @fechaFin IS NOT NULL
        SET @sql = @sql + N' AND v.Fecha <= @fechaFinParam';
    IF @clienteId IS NOT NULL
        SET @sql = @sql + N' AND v.Id_cliente = @clienteIdParam';

    SET @sql = @sql + N' ORDER BY v.Fecha DESC OFFSET @offsetParam ROWS FETCH NEXT @limitParam ROWS ONLY;';

    DECLARE @paramDefs NVARCHAR(MAX) = N'@offsetParam INT, @limitParam INT, @estadoParam NVARCHAR(100), @fechaInicioParam DATETIME, @fechaFinParam DATETIME, @clienteIdParam INT';

    EXEC sp_executesql 
        @sql,
        @paramDefs,
        @offsetParam = @offset,
        @limitParam = @limit,
        @estadoParam = @estado,
        @fechaInicioParam = @fechaInicio,
        @fechaFinParam = @fechaFin,
        @clienteIdParam = @clienteId;
END
GO

--------------------------------------------------------------------------------
-- sp_GetVentasCount
-- Devuelve el total de registros que cumplen filtros
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetVentasCount', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentasCount;
GO
CREATE PROCEDURE dbo.sp_GetVentasCount
    @estado NVARCHAR(100) = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL,
    @clienteId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @sql NVARCHAR(MAX) = N'SELECT COUNT(*) AS total FROM Venta v WHERE 1=1 ';

    IF @estado IS NOT NULL
        SET @sql = @sql + N' AND v.Estado = @estadoParam';
    IF @fechaInicio IS NOT NULL
        SET @sql = @sql + N' AND v.Fecha >= @fechaInicioParam';
    IF @fechaFin IS NOT NULL
        SET @sql = @sql + N' AND v.Fecha <= @fechaFinParam';
    IF @clienteId IS NOT NULL
        SET @sql = @sql + N' AND v.Id_cliente = @clienteIdParam';

    DECLARE @paramDefs NVARCHAR(MAX) = N'@estadoParam NVARCHAR(100), @fechaInicioParam DATETIME, @fechaFinParam DATETIME, @clienteIdParam INT';

    EXEC sp_executesql 
        @sql,
        @paramDefs,
        @estadoParam = @estado,
        @fechaInicioParam = @fechaInicio,
        @fechaFinParam = @fechaFin,
        @clienteIdParam = @clienteId;
END
GO

--------------------------------------------------------------------------------
-- sp_GetVentaById
-- Devuelve una venta con datos de cliente y colaborador
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetVentaById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetVentaById;
GO
CREATE PROCEDURE dbo.sp_GetVentaById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        v.*,
        c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') AS ClienteNombre,
        c.Telefono AS ClienteTelefono,
        c.Correo AS ClienteCorreo,
        col.Nombre + ' ' + col.Apellido1 + ISNULL(' ' + col.Apellido2, '') AS ColaboradorNombre
    FROM Venta v
    INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
    WHERE v.Id_venta = @id;
END
GO

--------------------------------------------------------------------------------
-- sp_GetDetallesByVentaId
-- Devuelve los detalles de una venta
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetDetallesByVentaId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDetallesByVentaId;
GO
CREATE PROCEDURE dbo.sp_GetDetallesByVentaId
    @ventaId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        dv.Id_detalleVenta,
        dv.CantidadVenta,
        dv.NumeroLinea,
        dv.PrecioUnitario,
        dv.Subtotal,
        p.Id_Producto,
        p.Nombre AS ProductoNombre,
        p.Descripcion AS ProductoDescripcion
    FROM DetalleVenta dv
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    WHERE dv.Id_venta = @ventaId
    ORDER BY dv.NumeroLinea;
END
GO

--------------------------------------------------------------------------------
-- sp_CreateVenta
-- Inserta una venta y devuelve Id por OUTPUT
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_CreateVenta', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateVenta;
GO
CREATE PROCEDURE dbo.sp_CreateVenta
    @fecha DATETIME,
    @total DECIMAL(12,2),
    @metodoPago NVARCHAR(100),
    @estado NVARCHAR(100),
    @clienteId INT,
    @colaboradorId INT,
    @newId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Venta (Fecha, TotalVenta, MetodoPago, Estado, Id_cliente, Id_colaborador)
    VALUES (@fecha, @total, @metodoPago, @estado, @clienteId, @colaboradorId);

    SET @newId = SCOPE_IDENTITY();
END
GO

--------------------------------------------------------------------------------
-- sp_InsertDetalleVenta
-- Inserta un detalle de venta
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_InsertDetalleVenta', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_InsertDetalleVenta;
GO
CREATE PROCEDURE dbo.sp_InsertDetalleVenta
    @cantidad INT,
    @numeroLinea INT,
    @precio DECIMAL(12,2),
    @subtotal DECIMAL(12,2),
    @ventaId INT,
    @productoId INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO DetalleVenta (CantidadVenta, NumeroLinea, PrecioUnitario, Subtotal, Id_venta, Id_producto)
    VALUES (@cantidad, @numeroLinea, @precio, @subtotal, @ventaId, @productoId);
END
GO

--------------------------------------------------------------------------------
-- sp_CancelVenta
-- Marca la venta como 'Cancelada'
--------------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_CancelVenta', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CancelVenta;
GO
CREATE PROCEDURE dbo.sp_CancelVenta
    @ventaId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Venta
    SET Estado = 'Cancelada'
    WHERE Id_venta = @ventaId;
END
GO