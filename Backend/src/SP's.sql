-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE ALQUILERES
-- Base de Datos: FerreteriaCentral
-- Fecha: 2025-11-05
-- Total SPs: 11
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP 1: Crear Alquiler
-- Descripción: Crea un nuevo registro de alquiler
-- Parámetros: @Id_cliente, @Id_colaborador, @FechaInicio, @FechaFin, @TotalAlquiler
-- Retorna: Registro completo del alquiler creado
-- =============================================
IF OBJECT_ID('SP_CrearAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearAlquiler;
GO

CREATE PROCEDURE SP_CrearAlquiler
    @Id_cliente INT,
    @Id_colaborador INT,
    @FechaInicio DATETIME,
    @FechaFin DATETIME,
    @TotalAlquiler DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_cliente = @Id_cliente)
        BEGIN
            RAISERROR('Cliente no encontrado', 16, 1);
            RETURN;
        END

        -- Insertar alquiler
        INSERT INTO Alquiler (FechaInicio, FechaFin, Estado, TotalAlquiler, Id_cliente, Id_colaborador)
        VALUES (@FechaInicio, @FechaFin, 'ACTIVO', @TotalAlquiler, @Id_cliente, @Id_colaborador);

        -- Retornar el registro creado
        SELECT * FROM Alquiler WHERE Id_alquiler = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP 2: Crear Detalle Alquiler
-- Descripción: Crea detalle de alquiler y reduce stock del producto
-- Parámetros: @Cantidad, @Dias, @Subtotal, @TarifaDiaria, @Deposito, @Id_alquiler, @Id_producto
-- Retorna: Registro completo del detalle creado
-- Nota: Valida stock y registra en bitácora
-- =============================================
IF OBJECT_ID('SP_CrearDetalleAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearDetalleAlquiler;
GO

CREATE PROCEDURE SP_CrearDetalleAlquiler
    @Cantidad INT,
    @Dias DECIMAL(10,2),
    @Subtotal DECIMAL(10,2),
    @TarifaDiaria DECIMAL(10,2),
    @Deposito DECIMAL(10,2),
    @Id_alquiler INT,
    @Id_producto INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar stock
        DECLARE @StockActual INT;
        SELECT @StockActual = CantidadActual FROM Producto WHERE Id_Producto = @Id_producto;

        IF @StockActual < @Cantidad
        BEGIN
            DECLARE @ErrorMsg NVARCHAR(500);
            SELECT @ErrorMsg = 'Stock insuficiente para ' + Nombre + '. Disponible: ' + CAST(@StockActual AS VARCHAR) + ', Solicitado: ' + CAST(@Cantidad AS VARCHAR)
            FROM Producto WHERE Id_Producto = @Id_producto;
            RAISERROR(@ErrorMsg, 16, 1);
            RETURN;
        END

        -- Insertar detalle
        INSERT INTO DetalleAlquiler (CantidadDetalleAlquiler, DiasAlquilados, Subtotal, TarifaDiaria, Deposito, Id_alquiler, Id_producto)
        VALUES (@Cantidad, @Dias, @Subtotal, @TarifaDiaria, @Deposito, @Id_alquiler, @Id_producto);

        -- Reducir stock
        UPDATE Producto
        SET CantidadActual = CantidadActual - @Cantidad
        WHERE Id_Producto = @Id_producto;

        -- Registrar en bitácora
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Producto', 'SALIDA', @Id_producto, 'ALQUILER - Reducción de stock: -' + CAST(@Cantidad AS VARCHAR));

        -- Retornar el detalle creado
        SELECT * FROM DetalleAlquiler WHERE Id_detalleAlquiler = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP 3: Obtener Todos los Alquileres
-- Descripción: Obtiene alquileres con paginación y filtros
-- Parámetros: @Limit, @Offset, @Estado, @ClienteId, @FechaInicio, @FechaFin
-- Retorna: 2 resultsets (datos paginados + total de registros)
-- Nota: Detecta alquileres vencidos y por vencer
-- =============================================
IF OBJECT_ID('SP_ObtenerAlquileres', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerAlquileres;
GO

CREATE PROCEDURE SP_ObtenerAlquileres
    @Limit INT = 50,
    @Offset INT = 0,
    @Estado VARCHAR(50) = NULL,
    @ClienteId INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener registros con filtros
    SELECT 
        a.Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.Estado,
        a.TotalAlquiler,
        a.Multa,
        a.Id_cliente,
        a.Id_colaborador,
        c.Nombre as ClienteNombre,
        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
        c.Telefono as ClienteTelefono,
        col.Nombre as ColaboradorNombre,
        col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorApellidos,
        COUNT(da.Id_detalleAlquiler) as TotalProductos,
        SUM(da.CantidadDetalleAlquiler) as TotalUnidades,
        CASE 
            WHEN a.Estado = 'ACTIVO' AND GETDATE() > a.FechaFin THEN 'VENCIDO'
            WHEN a.Estado = 'ACTIVO' AND DATEDIFF(day, GETDATE(), a.FechaFin) <= 2 THEN 'POR_VENCER'
            ELSE a.Estado
        END as EstadoActual,
        DATEDIFF(day, GETDATE(), a.FechaFin) as DiasRestantes
    FROM Alquiler a
    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
    LEFT JOIN DetalleAlquiler da ON a.Id_alquiler = da.Id_alquiler
    WHERE 1=1
        AND (@Estado IS NULL OR a.Estado = @Estado)
        AND (@ClienteId IS NULL OR a.Id_cliente = @ClienteId)
        AND (@FechaInicio IS NULL OR a.FechaInicio >= @FechaInicio)
        AND (@FechaFin IS NULL OR a.FechaFin <= @FechaFin)
    GROUP BY 
        a.Id_alquiler, a.FechaInicio, a.FechaFin, a.Estado, a.TotalAlquiler, a.Multa,
        a.Id_cliente, a.Id_colaborador,
        c.Nombre, c.Apellido1, c.Apellido2, c.Telefono,
        col.Nombre, col.Apellido1, col.Apellido2
    ORDER BY 
        CASE WHEN a.Estado = 'ACTIVO' AND GETDATE() > a.FechaFin THEN 1 
             WHEN a.Estado = 'ACTIVO' THEN 2 
             ELSE 3 END,
        a.FechaFin ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Obtener total de registros (para paginación)
    SELECT COUNT(DISTINCT a.Id_alquiler) as Total
    FROM Alquiler a
    WHERE 1=1
        AND (@Estado IS NULL OR a.Estado = @Estado)
        AND (@ClienteId IS NULL OR a.Id_cliente = @ClienteId)
        AND (@FechaInicio IS NULL OR a.FechaInicio >= @FechaInicio)
        AND (@FechaFin IS NULL OR a.FechaFin <= @FechaFin);
END
GO

-- =============================================
-- SP 4: Obtener Alquiler por ID
-- Descripción: Obtiene un alquiler específico con sus detalles
-- Parámetros: @Id
-- Retorna: 2 resultsets (maestro + detalles)
-- =============================================
IF OBJECT_ID('SP_ObtenerAlquilerPorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerAlquilerPorId;
GO

CREATE PROCEDURE SP_ObtenerAlquilerPorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener maestro
    SELECT 
        a.Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.Estado,
        a.TotalAlquiler,
        a.Multa,
        a.Id_cliente,
        a.Id_colaborador,
        c.Nombre as ClienteNombre,
        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
        c.Telefono as ClienteTelefono,
        c.Correo as ClienteEmail,
        col.Nombre as ColaboradorNombre,
        col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorApellidos,
        DATEDIFF(day, a.FechaInicio, ISNULL(a.FechaFin, GETDATE())) as DiasTranscurridos
    FROM Alquiler a
    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
    WHERE a.Id_alquiler = @Id;

    -- Obtener detalles
    SELECT 
        da.*,
        p.Nombre as ProductoNombre,
        p.Descripcion as ProductoDescripcion,
        p.CodigoBarra as ProductoCodigoBarra
    FROM DetalleAlquiler da
    INNER JOIN Producto p ON da.Id_producto = p.Id_Producto
    WHERE da.Id_alquiler = @Id;
END
GO

-- =============================================
-- SP 5: Finalizar Alquiler
-- Descripción: Finaliza un alquiler y devuelve stock de productos
-- Parámetros: @Id_alquiler, @UserId
-- Retorna: Resultado de la operación (alquilerId, itemsRestored, status)
-- Nota: Usa transacción y cursor para devolver stock
-- =============================================
IF OBJECT_ID('SP_FinalizarAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE SP_FinalizarAlquiler;
GO

CREATE PROCEDURE SP_FinalizarAlquiler
    @Id_alquiler INT,
    @UserId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validar que el alquiler existe
        DECLARE @Estado VARCHAR(50);
        SELECT @Estado = Estado FROM Alquiler WHERE Id_alquiler = @Id_alquiler;

        IF @Estado IS NULL
        BEGIN
            RAISERROR('Alquiler no encontrado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Estado = 'FINALIZADO'
        BEGIN
            RAISERROR('El alquiler ya está finalizado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Estado = 'CANCELADO'
        BEGIN
            RAISERROR('El alquiler está cancelado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        -- Devolver stock de cada producto
        DECLARE @Id_producto INT, @Cantidad INT;
        DECLARE detalle_cursor CURSOR FOR
            SELECT Id_producto, CantidadDetalleAlquiler
            FROM DetalleAlquiler
            WHERE Id_alquiler = @Id_alquiler;

        OPEN detalle_cursor;
        FETCH NEXT FROM detalle_cursor INTO @Id_producto, @Cantidad;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Devolver stock
            UPDATE Producto
            SET CantidadActual = CantidadActual + @Cantidad
            WHERE Id_Producto = @Id_producto;

            -- Bitácora
            INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
            VALUES ('Producto', 'ENTRADA', @Id_producto, 'DEVOLUCION_ALQUILER - Incremento de stock: +' + CAST(@Cantidad AS VARCHAR));

            FETCH NEXT FROM detalle_cursor INTO @Id_producto, @Cantidad;
        END

        CLOSE detalle_cursor;
        DEALLOCATE detalle_cursor;

        -- Actualizar estado del alquiler
        UPDATE Alquiler
        SET Estado = 'FINALIZADO',
            FechaFin = GETDATE()
        WHERE Id_alquiler = @Id_alquiler;

        -- Bitácora del alquiler
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Alquiler', 'UPDATE', @Id_alquiler, 'Alquiler finalizado por: ' + @UserId);

        COMMIT;

        -- Retornar resultado
        SELECT 
            @Id_alquiler as alquilerId,
            (SELECT COUNT(*) FROM DetalleAlquiler WHERE Id_alquiler = @Id_alquiler) as itemsRestored,
            'FINALIZADO' as status;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP 6: Extender Alquiler
-- Descripción: Extiende la duración de un alquiler activo
-- Parámetros: @Id_alquiler, @DiasAdicionales, @UserId
-- Retorna: Información actualizada (nuevaFechaFin, costoAdicional, nuevoTotal)
-- Nota: Recalcula costos y actualiza detalles
-- =============================================
IF OBJECT_ID('SP_ExtenderAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE SP_ExtenderAlquiler;
GO

CREATE PROCEDURE SP_ExtenderAlquiler
    @Id_alquiler INT,
    @DiasAdicionales INT,
    @UserId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validar que el alquiler existe y está activo
        DECLARE @FechaFin DATETIME, @TotalAlquiler DECIMAL(10,2), @Estado VARCHAR(50);
        SELECT @FechaFin = FechaFin, @TotalAlquiler = TotalAlquiler, @Estado = Estado
        FROM Alquiler WHERE Id_alquiler = @Id_alquiler;

        IF @Estado IS NULL
        BEGIN
            RAISERROR('Alquiler no encontrado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Estado != 'ACTIVO'
        BEGIN
            RAISERROR('Solo se pueden extender alquileres activos', 16, 1);
            ROLLBACK;
            RETURN;
        END

        -- Calcular nueva fecha fin
        DECLARE @NuevaFechaFin DATETIME = DATEADD(day, @DiasAdicionales, @FechaFin);

        -- Calcular costo adicional
        DECLARE @TotalDiario DECIMAL(10,2);
        SELECT @TotalDiario = SUM(TarifaDiaria * CantidadDetalleAlquiler)
        FROM DetalleAlquiler
        WHERE Id_alquiler = @Id_alquiler;

        DECLARE @CostoAdicional DECIMAL(10,2) = @TotalDiario * @DiasAdicionales;
        DECLARE @NuevoTotal DECIMAL(10,2) = @TotalAlquiler + @CostoAdicional;

        -- Actualizar maestro
        UPDATE Alquiler
        SET FechaFin = @NuevaFechaFin,
            TotalAlquiler = @NuevoTotal
        WHERE Id_alquiler = @Id_alquiler;

        -- Actualizar detalles
        UPDATE DetalleAlquiler
        SET DiasAlquilados = DiasAlquilados + @DiasAdicionales,
            Subtotal = (DiasAlquilados + @DiasAdicionales) * TarifaDiaria * CantidadDetalleAlquiler
        WHERE Id_alquiler = @Id_alquiler;

        -- Bitácora
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Alquiler', 'UPDATE', @Id_alquiler, 'Alquiler extendido ' + CAST(@DiasAdicionales AS VARCHAR) + ' días por: ' + @UserId);

        COMMIT;

        -- Retornar resultado
        SELECT 
            @Id_alquiler as alquilerId,
            @NuevaFechaFin as nuevaFechaFin,
            @DiasAdicionales as diasAdicionales,
            @CostoAdicional as costoAdicional,
            @NuevoTotal as nuevoTotal;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP 7: Cancelar Alquiler
-- Descripción: Cancela un alquiler y devuelve stock de productos
-- Parámetros: @Id_alquiler, @Motivo, @UserId
-- Retorna: Resultado de la operación (alquilerId, itemsRestored, status, motivo)
-- Nota: No se puede cancelar alquileres finalizados o ya cancelados
-- =============================================
IF OBJECT_ID('SP_CancelarAlquiler', 'P') IS NOT NULL
    DROP PROCEDURE SP_CancelarAlquiler;
GO

CREATE PROCEDURE SP_CancelarAlquiler
    @Id_alquiler INT,
    @Motivo VARCHAR(255),
    @UserId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validar que el alquiler existe
        DECLARE @Estado VARCHAR(50);
        SELECT @Estado = Estado FROM Alquiler WHERE Id_alquiler = @Id_alquiler;

        IF @Estado IS NULL
        BEGIN
            RAISERROR('Alquiler no encontrado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Estado = 'FINALIZADO'
        BEGIN
            RAISERROR('No se puede cancelar un alquiler finalizado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Estado = 'CANCELADO'
        BEGIN
            RAISERROR('El alquiler ya está cancelado', 16, 1);
            ROLLBACK;
            RETURN;
        END

        -- Devolver stock de cada producto
        DECLARE @Id_producto INT, @Cantidad INT;
        DECLARE detalle_cursor CURSOR FOR
            SELECT Id_producto, CantidadDetalleAlquiler
            FROM DetalleAlquiler
            WHERE Id_alquiler = @Id_alquiler;

        OPEN detalle_cursor;
        FETCH NEXT FROM detalle_cursor INTO @Id_producto, @Cantidad;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Devolver stock
            UPDATE Producto
            SET CantidadActual = CantidadActual + @Cantidad
            WHERE Id_Producto = @Id_producto;

            -- Bitácora
            INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
            VALUES ('Producto', 'ENTRADA', @Id_producto, 'CANCELACION_ALQUILER - Incremento de stock: +' + CAST(@Cantidad AS VARCHAR));

            FETCH NEXT FROM detalle_cursor INTO @Id_producto, @Cantidad;
        END

        CLOSE detalle_cursor;
        DEALLOCATE detalle_cursor;

        -- Actualizar estado del alquiler
        UPDATE Alquiler
        SET Estado = 'CANCELADO'
        WHERE Id_alquiler = @Id_alquiler;

        -- Bitácora del alquiler
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Alquiler', 'UPDATE', @Id_alquiler, 'Alquiler cancelado. Motivo: ' + @Motivo + ' por: ' + @UserId);

        COMMIT;

        -- Retornar resultado
        SELECT 
            @Id_alquiler as alquilerId,
            (SELECT COUNT(*) FROM DetalleAlquiler WHERE Id_alquiler = @Id_alquiler) as itemsRestored,
            'CANCELADO' as status,
            @Motivo as motivo;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP 8: Obtener Alquileres Activos
-- Descripción: Obtiene todos los alquileres con estado ACTIVO
-- Parámetros: @Limit, @Offset
-- Retorna: 2 resultsets (datos paginados + total)
-- Nota: Incluye cálculo de días restantes y estado de vigencia
-- =============================================
IF OBJECT_ID('SP_ObtenerAlquileresActivos', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerAlquileresActivos;
GO

CREATE PROCEDURE SP_ObtenerAlquileresActivos
    @Limit INT = 50,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener registros
    SELECT 
        a.Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.Estado,
        a.TotalAlquiler,
        a.Multa,
        a.Id_cliente,
        a.Id_colaborador,
        c.Nombre as ClienteNombre,
        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
        c.Telefono as ClienteTelefono,
        col.Nombre + ' ' + col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorNombre,
        DATEDIFF(day, GETDATE(), a.FechaFin) as DiasRestantes,
        CASE 
            WHEN DATEDIFF(day, GETDATE(), a.FechaFin) < 0 THEN 'VENCIDO'
            WHEN DATEDIFF(day, GETDATE(), a.FechaFin) <= 2 THEN 'POR_VENCER'
            ELSE 'VIGENTE'
        END as EstadoVigencia
    FROM Alquiler a
    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
    WHERE a.Estado = 'ACTIVO'
    ORDER BY a.FechaFin ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Obtener total
    SELECT COUNT(*) as Total FROM Alquiler WHERE Estado = 'ACTIVO';
END
GO

-- =============================================
-- SP 9: Obtener Alquileres Vencidos
-- Descripción: Obtiene alquileres activos que ya pasaron su fecha de fin
-- Parámetros: @Limit, @Offset
-- Retorna: 2 resultsets (datos paginados + total)
-- Nota: Calcula días de vencimiento
-- =============================================
IF OBJECT_ID('SP_ObtenerAlquileresVencidos', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerAlquileresVencidos;
GO

CREATE PROCEDURE SP_ObtenerAlquileresVencidos
    @Limit INT = 50,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener registros
    SELECT 
        a.Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.Estado,
        a.TotalAlquiler,
        a.Multa,
        a.Id_cliente,
        a.Id_colaborador,
        c.Nombre as ClienteNombre,
        c.Apellido1 + ' ' + ISNULL(c.Apellido2, '') as ClienteApellidos,
        c.Telefono as ClienteTelefono,
        c.Correo as ClienteEmail,
        DATEDIFF(day, a.FechaFin, GETDATE()) as DiasVencidos
    FROM Alquiler a
    INNER JOIN Cliente c ON a.Id_cliente = c.Id_cliente
    WHERE a.Estado = 'ACTIVO'
    AND a.FechaFin < GETDATE()
    ORDER BY DiasVencidos DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Obtener total
    SELECT COUNT(*) as Total 
    FROM Alquiler 
    WHERE Estado = 'ACTIVO' AND FechaFin < GETDATE();
END
GO

-- =============================================
-- SP 10: Obtener Estadísticas de Alquileres
-- Descripción: Obtiene estadísticas generales de todos los alquileres
-- Parámetros: Ninguno
-- Retorna: 1 resultset (totales por estado + ingresos)
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasAlquileres', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasAlquileres;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasAlquileres
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        COUNT(*) as TotalAlquileres,
        SUM(CASE WHEN Estado = 'ACTIVO' THEN 1 ELSE 0 END) as Activos,
        SUM(CASE WHEN Estado = 'FINALIZADO' THEN 1 ELSE 0 END) as Finalizados,
        SUM(CASE WHEN Estado = 'CANCELADO' THEN 1 ELSE 0 END) as Cancelados,
        SUM(CASE WHEN Estado = 'ACTIVO' AND FechaFin < GETDATE() THEN 1 ELSE 0 END) as Vencidos,
        ISNULL(SUM(TotalAlquiler), 0) as IngresoTotal,
        ISNULL(AVG(TotalAlquiler), 0) as PromedioIngresos
    FROM Alquiler;
END
GO

-- =============================================
-- SP 11: Obtener Historial de Cliente
-- Descripción: Obtiene todos los alquileres de un cliente específico
-- Parámetros: @ClienteId, @Limit, @Offset
-- Retorna: 2 resultsets (datos paginados + total)
-- =============================================
IF OBJECT_ID('SP_ObtenerHistorialCliente', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerHistorialCliente;
GO

CREATE PROCEDURE SP_ObtenerHistorialCliente
    @ClienteId INT,
    @Limit INT = 50,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener registros
    SELECT 
        a.Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.Estado,
        a.TotalAlquiler,
        a.Multa,
        a.Id_cliente,
        a.Id_colaborador,
        col.Nombre + ' ' + col.Apellido1 + ' ' + ISNULL(col.Apellido2, '') as ColaboradorNombre,
        COUNT(da.Id_detalleAlquiler) as TotalProductos
    FROM Alquiler a
    INNER JOIN Colaborador col ON a.Id_colaborador = col.Id_colaborador
    LEFT JOIN DetalleAlquiler da ON a.Id_alquiler = da.Id_alquiler
    WHERE a.Id_cliente = @ClienteId
    GROUP BY 
        a.Id_alquiler, a.FechaInicio, a.FechaFin, a.Estado, a.TotalAlquiler, a.Multa,
        a.Id_cliente, a.Id_colaborador,
        col.Nombre, col.Apellido1, col.Apellido2
    ORDER BY a.FechaInicio DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Obtener total
    SELECT COUNT(*) as Total 
    FROM Alquiler 
    WHERE Id_cliente = @ClienteId;
END
GO

-- =============================================
-- Verificación de creación de SPs
-- =============================================
PRINT '==========================================';
PRINT 'Stored Procedures de ALQUILER creados:';
PRINT '==========================================';
SELECT 
    name AS 'Stored Procedure',
    create_date AS 'Fecha Creación'
FROM sys.procedures
WHERE name LIKE 'SP_%Alquiler%' OR name LIKE 'SP_Crear%Alquiler%' OR name LIKE 'SP_Obtener%Alquiler%'
ORDER BY name;
PRINT '==========================================';
PRINT 'Total: 11 Stored Procedures';
PRINT '==========================================';
----------------------------------------------------
-- =============================================
-- PRUEBA COMPLETA DEL MÓDULO DE ALQUILERES
-- =============================================

USE FerreteriaCentral;
GO

-- 1. Ver el alquiler por ID (muestra maestro + detalles)
EXEC SP_ObtenerAlquilerPorId @Id = 1;

-- 2. Ver los detalles
SELECT * FROM DetalleAlquiler WHERE Id_alquiler = 1;

-- 3. Verificar que el stock se redujo
SELECT Id_Producto, Nombre, CantidadActual
FROM Producto
WHERE Id_Producto IN (2, 3);

-- El Taladro debe tener: 15 - 2 = 13
-- El Martillo debe tener: 25 - 1 = 24


--SP realacionados con BACKUP

-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE BACKUPS
-- =============================================
USE FerreteriaCentral;
GO

-- =============================================
-- SP_CrearBackup: Crear backup de la base de datos
-- =============================================
IF OBJECT_ID('SP_CrearBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearBackup;
GO

CREATE PROCEDURE SP_CrearBackup
    @RutaCompleta NVARCHAR(500),
    @NombreArchivo NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @SQL NVARCHAR(MAX);
        
        -- Crear backup sin compresión (SQL Server Express)
        SET @SQL = N'
            BACKUP DATABASE [FerreteriaCentral]
            TO DISK = N''' + @RutaCompleta + '''
            WITH FORMAT, 
            MEDIANAME = ''FerreteriaCentralBackup'',
            NAME = ''Full Backup of FerreteriaCentral'',
            STATS = 10;
        ';
        
        EXEC sp_executesql @SQL;
        
        -- Retornar información del backup
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            GETDATE() as CreatedAt,
            'SUCCESS' as Status,
            'Backup creado exitosamente' as Message;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            NULL as CreatedAt,
            'ERROR' as Status,
            @ErrorMessage as Message;
            
        RAISERROR(@ErrorMessage, @ErrorSeverity, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_RestaurarBackup: Restaurar backup de la base de datos
-- =============================================
IF OBJECT_ID('SP_RestaurarBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_RestaurarBackup;
GO

CREATE PROCEDURE SP_RestaurarBackup
    @RutaCompleta NVARCHAR(500),
    @NombreArchivo NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Variables para construcción dinámica
        DECLARE @RestoreSQL NVARCHAR(MAX);
        
        -- Poner BD en modo single user
        ALTER DATABASE [FerreteriaCentral] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        
        BEGIN TRY
            -- Construir y ejecutar RESTORE sin MOVE (usar ubicaciones originales)
            SET @RestoreSQL = N'
                RESTORE DATABASE [FerreteriaCentral]
                FROM DISK = N''' + @RutaCompleta + '''
                WITH REPLACE, RECOVERY, STATS = 10;
            ';
            
            EXEC(@RestoreSQL);
            
            -- Volver a modo multi user
            ALTER DATABASE [FerreteriaCentral] SET MULTI_USER;
        END TRY
        BEGIN CATCH
            -- Volver a modo multi user en caso de error
            ALTER DATABASE [FerreteriaCentral] SET MULTI_USER;
            THROW;
        END CATCH
        
        -- Retornar información
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            GETDATE() as RestoredAt,
            'SUCCESS' as Status,
            'Backup restaurado exitosamente' as Message;
            
    END TRY
    BEGIN CATCH
        -- Intentar volver a modo multi user en caso de error
        BEGIN TRY
            ALTER DATABASE [FerreteriaCentral] SET MULTI_USER;
        END TRY
        BEGIN CATCH
            -- Ignorar error si ya está en multi user
        END CATCH
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            NULL as RestoredAt,
            'ERROR' as Status,
            @ErrorMessage as Message;
            
        RAISERROR(@ErrorMessage, @ErrorSeverity, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_VerificarBackup: Verificar integridad de un backup
-- =============================================
IF OBJECT_ID('SP_VerificarBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_VerificarBackup;
GO

CREATE PROCEDURE SP_VerificarBackup
    @RutaCompleta NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @SQL NVARCHAR(MAX);
        
        -- Verificar backup
        SET @SQL = N'
            RESTORE VERIFYONLY 
            FROM DISK = N''' + @RutaCompleta + '''
        ';
        
        EXEC sp_executesql @SQL;
        
        -- Si llega aquí, el backup es válido
        SELECT 
            @RutaCompleta as FullPath,
            'VALID' as Status,
            'Backup verificado correctamente' as Message,
            GETDATE() as VerifiedAt;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        
        SELECT 
            @RutaCompleta as FullPath,
            'INVALID' as Status,
            @ErrorMessage as Message,
            GETDATE() as VerifiedAt;
            
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ObtenerInfoBackup: Obtener información de un archivo de backup
-- =============================================
IF OBJECT_ID('SP_ObtenerInfoBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerInfoBackup;
GO

CREATE PROCEDURE SP_ObtenerInfoBackup
    @RutaCompleta NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @SQL NVARCHAR(MAX);
        DECLARE @DatabaseName NVARCHAR(128);
        DECLARE @BackupStartDate DATETIME;
        DECLARE @BackupFinishDate DATETIME;
        DECLARE @BackupSize BIGINT;
        DECLARE @BackupType SMALLINT;
        
        -- Obtener información usando RESTORE FILELISTONLY (más compatible)
        CREATE TABLE #FileListInfo (
            LogicalName NVARCHAR(128),
            PhysicalName NVARCHAR(260),
            Type CHAR(1),
            FileGroupName NVARCHAR(128),
            Size NUMERIC(20,0),
            MaxSize NUMERIC(20,0),
            FileID BIGINT,
            CreateLSN NUMERIC(25,0),
            DropLSN NUMERIC(25,0),
            UniqueID UNIQUEIDENTIFIER,
            ReadOnlyLSN NUMERIC(25,0),
            ReadWriteLSN NUMERIC(25,0),
            BackupSizeInBytes BIGINT,
            SourceBlockSize INT,
            FileGroupID INT,
            LogGroupGUID UNIQUEIDENTIFIER,
            DifferentialBaseLSN NUMERIC(25,0),
            DifferentialBaseGUID UNIQUEIDENTIFIER,
            IsReadOnly BIT,
            IsPresent BIT,
            TDEThumbprint VARBINARY(32),
            SnapshotUrl NVARCHAR(360)
        );
        
        SET @SQL = N'RESTORE FILELISTONLY FROM DISK = N''' + @RutaCompleta + '''';
        INSERT INTO #FileListInfo EXEC sp_executesql @SQL;
        
        -- Calcular tamaño total
        SELECT @BackupSize = SUM(BackupSizeInBytes) FROM #FileListInfo;
        
        -- Retornar información básica
        SELECT 
            'FerreteriaCentral' as DatabaseName,
            @RutaCompleta as BackupPath,
            @BackupSize as BackupSizeBytes,
            CAST(@BackupSize / 1024.0 / 1024.0 AS DECIMAL(10,2)) as BackupSizeMB,
            'Full Backup' as BackupType,
            COUNT(*) as FileCount
        FROM #FileListInfo;
        
        DROP TABLE #FileListInfo;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        
        -- Retornar error como resultado
        SELECT 
            'ERROR' as Status,
            @ErrorMessage as ErrorMessage,
            @RutaCompleta as BackupPath;
    END CATCH
END;
GO

PRINT '✅ Todos los Stored Procedures de Backups creados exitosamente';
-------------------------------------------------------------------
-- Ver el tamaño actual de la base de datos
EXEC sp_spaceused;

-- Ver todos los backups existentes en el historial de SQL Server
SELECT 
    database_name,
    backup_start_date,
    backup_finish_date,
    backup_size / 1024 / 1024 AS 'Tamaño (MB)',
    physical_device_name
FROM msdb.dbo.backupset bs
INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE database_name = 'FerreteriaCentral'
ORDER BY backup_start_date DESC;



--SP realacionados con VENTAS
-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE VENTAS
-- Versión: 1.0 - Funcional y Probado
-- Base de Datos: FerreteriaCentral
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP: Crear Venta
-- =============================================
IF OBJECT_ID('SP_CrearVenta', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearVenta;
GO

CREATE PROCEDURE SP_CrearVenta
    @Id_cliente INT,
    @Id_colaborador INT,
    @MetodoPago VARCHAR(20),
    @TotalVenta DECIMAL(12,2),
    @Estado VARCHAR(20) = 'Completada'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_cliente = @Id_cliente)
        BEGIN
            RAISERROR('Cliente no encontrado', 16, 1);
            RETURN;
        END

        -- Validar que el colaborador existe
        IF NOT EXISTS (SELECT 1 FROM Colaborador WHERE Id_colaborador = @Id_colaborador)
        BEGIN
            RAISERROR('Colaborador no encontrado', 16, 1);
            RETURN;
        END

        -- Insertar venta
        INSERT INTO Venta (Id_cliente, Id_colaborador, Fecha, MetodoPago, TotalVenta, Estado)
        VALUES (@Id_cliente, @Id_colaborador, GETDATE(), @MetodoPago, @TotalVenta, @Estado);

        -- Retornar el registro creado
        SELECT * FROM Venta WHERE Id_venta = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP: Crear Detalle Venta
-- =============================================
IF OBJECT_ID('SP_CrearDetalleVenta', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearDetalleVenta;
GO

CREATE PROCEDURE SP_CrearDetalleVenta
    @Id_venta INT,
    @Id_producto INT,
    @CantidadVenta INT,
    @NumeroLinea INT,
    @PrecioUnitario DECIMAL(10,2),
    @Subtotal DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar stock
        DECLARE @StockActual INT;
        SELECT @StockActual = CantidadActual FROM Producto WHERE Id_Producto = @Id_producto;

        IF @StockActual IS NULL
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1);
            RETURN;
        END

        IF @StockActual < @CantidadVenta
        BEGIN
            DECLARE @ErrorMsg NVARCHAR(500);
            SELECT @ErrorMsg = 'Stock insuficiente para ' + Nombre + '. Disponible: ' + CAST(@StockActual AS VARCHAR) + ', Solicitado: ' + CAST(@CantidadVenta AS VARCHAR)
            FROM Producto WHERE Id_Producto = @Id_producto;
            RAISERROR(@ErrorMsg, 16, 1);
            RETURN;
        END

        -- Insertar detalle
        INSERT INTO DetalleVenta (Id_venta, Id_producto, CantidadVenta, NumeroLinea, PrecioUnitario, Subtotal)
        VALUES (@Id_venta, @Id_producto, @CantidadVenta, @NumeroLinea, @PrecioUnitario, @Subtotal);

        -- Reducir stock
        UPDATE Producto
        SET CantidadActual = CantidadActual - @CantidadVenta
        WHERE Id_Producto = @Id_producto;

        -- Registrar en bitácora
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Producto', 'SALIDA', @Id_producto, 'VENTA - Reducción de stock: -' + CAST(@CantidadVenta AS VARCHAR));

        -- Retornar el detalle creado
        SELECT * FROM DetalleVenta WHERE Id_detalleVenta = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP: Obtener Todas las Ventas (con paginación y filtros)
-- =============================================
IF OBJECT_ID('SP_ObtenerVentas', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerVentas;
GO

CREATE PROCEDURE SP_ObtenerVentas
    @Limit INT = 50,
    @Offset INT = 0,
    @Estado VARCHAR(20) = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @ClienteId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener registros con filtros
    SELECT 
        v.Id_venta,
        v.Fecha,
        v.TotalVenta,
        v.MetodoPago,
        v.Estado,
        c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') as Cliente,
        col.Nombre + ' ' + col.Apellido1 + ISNULL(' ' + col.Apellido2, '') as Colaborador,
        (SELECT COUNT(*) FROM DetalleVenta WHERE Id_venta = v.Id_venta) as CantidadItems
    FROM Venta v
    INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
    WHERE 1=1
        AND (@Estado IS NULL OR v.Estado = @Estado)
        AND (@FechaInicio IS NULL OR v.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR v.Fecha <= @FechaFin)
        AND (@ClienteId IS NULL OR v.Id_cliente = @ClienteId)
    ORDER BY v.Fecha DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Obtener total de registros (para paginación)
    SELECT COUNT(*) as Total
    FROM Venta v
    WHERE 1=1
        AND (@Estado IS NULL OR v.Estado = @Estado)
        AND (@FechaInicio IS NULL OR v.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR v.Fecha <= @FechaFin)
        AND (@ClienteId IS NULL OR v.Id_cliente = @ClienteId);
END
GO

-- =============================================
-- SP: Obtener Venta por ID
-- =============================================
IF OBJECT_ID('SP_ObtenerVentaPorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerVentaPorId;
GO

CREATE PROCEDURE SP_ObtenerVentaPorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener maestro
    SELECT 
        v.*,
        c.Nombre + ' ' + c.Apellido1 + ISNULL(' ' + c.Apellido2, '') as ClienteNombre,
        c.Telefono as ClienteTelefono,
        c.Correo as ClienteCorreo,
        col.Nombre + ' ' + col.Apellido1 + ISNULL(' ' + col.Apellido2, '') as ColaboradorNombre
    FROM Venta v
    INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
    INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
    WHERE v.Id_venta = @Id;

    -- Obtener detalles
    SELECT 
        dv.Id_detalleVenta,
        dv.CantidadVenta,
        dv.NumeroLinea,
        dv.PrecioUnitario,
        dv.Subtotal,
        p.Id_Producto,
        p.Nombre as ProductoNombre,
        p.Descripcion as ProductoDescripcion
    FROM DetalleVenta dv
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    WHERE dv.Id_venta = @Id
    ORDER BY dv.NumeroLinea;
END
GO

-- =============================================
-- SP: Obtener Detalles de Venta
-- =============================================
IF OBJECT_ID('SP_ObtenerDetallesVenta', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerDetallesVenta;
GO

CREATE PROCEDURE SP_ObtenerDetallesVenta
    @VentaId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que la venta existe
    IF NOT EXISTS (SELECT 1 FROM Venta WHERE Id_venta = @VentaId)
    BEGIN
        RAISERROR('Venta no encontrada', 16, 1);
        RETURN;
    END
    
    -- Obtener detalles con información completa
    SELECT 
        dv.Id_detalleVenta,
        dv.CantidadVenta,
        dv.NumeroLinea,
        dv.PrecioUnitario,
        dv.Subtotal,
        dv.Id_producto,
        p.Nombre as ProductoNombre,
        p.Descripcion as ProductoDescripcion,
        p.CodigoBarra,
        c.Nombre as Categoria
    FROM DetalleVenta dv
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE dv.Id_venta = @VentaId
    ORDER BY dv.NumeroLinea;
END
GO

-- =============================================
-- SP: Obtener Estadísticas de Ventas
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasVentas', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasVentas;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasVentas
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas de ventas completadas
    SELECT 
        COUNT(*) as TotalVentas,
        ISNULL(SUM(TotalVenta), 0) as VentaTotal,
        ISNULL(AVG(TotalVenta), 0) as PromedioVenta,
        ISNULL(MAX(TotalVenta), 0) as VentaMayor,
        ISNULL(MIN(TotalVenta), 0) as VentaMenor,
        COUNT(DISTINCT Id_cliente) as ClientesUnicos
    FROM Venta
    WHERE Estado = 'Completada'
        AND (@FechaInicio IS NULL OR Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR Fecha <= @FechaFin);

    -- Ventas canceladas
    SELECT COUNT(*) as VentasCanceladas
    FROM Venta
    WHERE Estado = 'Cancelada'
        AND (@FechaInicio IS NULL OR Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR Fecha <= @FechaFin);

    -- Ventas pendientes
    SELECT COUNT(*) as VentasPendientes
    FROM Venta
    WHERE Estado = 'Pendiente'
        AND (@FechaInicio IS NULL OR Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR Fecha <= @FechaFin);
END
GO

-- =============================================
-- SP: Obtener Productos Más Vendidos
-- =============================================
IF OBJECT_ID('SP_ObtenerProductosMasVendidos', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductosMasVendidos;
GO

CREATE PROCEDURE SP_ObtenerProductosMasVendidos
    @Limit INT = 10,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        p.Id_Producto,
        p.Nombre,
        p.Descripcion,
        c.Nombre as Categoria,
        SUM(dv.CantidadVenta) as TotalVendido,
        COUNT(DISTINCT v.Id_venta) as NumeroVentas,
        SUM(dv.Subtotal) as TotalIngresos,
        AVG(dv.PrecioUnitario) as PrecioPromedio
    FROM DetalleVenta dv
    INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
    INNER JOIN Producto p ON dv.Id_producto = p.Id_Producto
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE v.Estado = 'Completada'
        AND (@FechaInicio IS NULL OR v.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR v.Fecha <= @FechaFin)
    GROUP BY p.Id_Producto, p.Nombre, p.Descripcion, c.Nombre
    ORDER BY TotalVendido DESC;
END
GO

-- =============================================
-- SP: Cancelar Venta
-- =============================================
IF OBJECT_ID('SP_CancelarVenta', 'P') IS NOT NULL
    DROP PROCEDURE SP_CancelarVenta;
GO

CREATE PROCEDURE SP_CancelarVenta
    @Id_venta INT,
    @Motivo VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validar que la venta existe
        DECLARE @Estado VARCHAR(20);
        SELECT @Estado = Estado FROM Venta WHERE Id_venta = @Id_venta;

        IF @Estado IS NULL
        BEGIN
            RAISERROR('Venta no encontrada', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Estado = 'Cancelada'
        BEGIN
            RAISERROR('La venta ya está cancelada', 16, 1);
            ROLLBACK;
            RETURN;
        END

        -- Restaurar inventario solo si la venta estaba completada
        IF @Estado = 'Completada'
        BEGIN
            DECLARE @Id_producto INT, @Cantidad INT;
            DECLARE detalle_cursor CURSOR FOR
                SELECT Id_producto, CantidadVenta
                FROM DetalleVenta
                WHERE Id_venta = @Id_venta;

            OPEN detalle_cursor;
            FETCH NEXT FROM detalle_cursor INTO @Id_producto, @Cantidad;

            WHILE @@FETCH_STATUS = 0
            BEGIN
                -- Devolver stock
                UPDATE Producto
                SET CantidadActual = CantidadActual + @Cantidad
                WHERE Id_Producto = @Id_producto;

                -- Bitácora
                INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
                VALUES ('Producto', 'ENTRADA', @Id_producto, 'CANCELACION_VENTA - Incremento de stock: +' + CAST(@Cantidad AS VARCHAR));

                FETCH NEXT FROM detalle_cursor INTO @Id_producto, @Cantidad;
            END

            CLOSE detalle_cursor;
            DEALLOCATE detalle_cursor;
        END

        -- Actualizar estado de la venta
        UPDATE Venta
        SET Estado = 'Cancelada'
        WHERE Id_venta = @Id_venta;

        -- Bitácora de la venta
        DECLARE @NumProductos INT;
        SELECT @NumProductos = COUNT(*) FROM DetalleVenta WHERE Id_venta = @Id_venta;

        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Venta', 'UPDATE', @Id_venta, 'Venta cancelada. Motivo: ' + @Motivo);

        COMMIT;

        -- Retornar resultado
        SELECT 
            @Id_venta as Id_venta,
            @NumProductos as ProductosRestaurados,
            'Cancelada' as Estado,
            @Motivo as Motivo,
            CASE WHEN @Estado = 'Completada' THEN 1 ELSE 0 END as InventarioRestaurado;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- =============================================
-- VERIFICACIÓN: Listar SPs Creados
-- =============================================
PRINT '';
PRINT '===========================================';
PRINT '✅ STORED PROCEDURES DE VENTAS CREADOS';
PRINT '===========================================';

SELECT 
    name as NombreSP, 
    create_date as FechaCreacion
FROM sys.procedures
WHERE name LIKE 'SP_%Venta%'
ORDER BY name;

GO
------------------------------------

-- Ver historial de ventas de un cliente específico
EXEC SP_ObtenerVentas @ClienteId = 1, @Limit = 100;

-- Ver ventas del día actual
DECLARE @HoyInicio DATETIME = CAST(CAST(GETDATE() AS DATE) AS DATETIME);
DECLARE @HoyFin DATETIME = DATEADD(day, 1, @HoyInicio);

EXEC SP_ObtenerVentas 
    @FechaInicio = @HoyInicio, 
    @FechaFin = @HoyFin;

-- Ver todas las ventas canceladas
EXEC SP_ObtenerVentas @Estado = 'Cancelada', @Limit = 100;

-- Ver movimientos de bitácora relacionados con ventas
SELECT TOP 20 * 
FROM BitacoraProducto 
WHERE TablaAfectada IN ('Venta', 'Producto') 
  AND Descripcion LIKE '%VENTA%'
ORDER BY Fecha DESC, Hora DESC;

--SP realacionados con COMPRAS
--SP realacionados con COMPRAS
-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE COMPRAS
-- Versión: 1.0 - Funcional y Probado
-- Base de Datos: FerreteriaCentral
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP: Crear Compra
-- =============================================
IF OBJECT_ID('SP_CrearCompra', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearCompra;
GO

CREATE PROCEDURE SP_CrearCompra
    @Id_proveedor INT,
    @FechaCompra DATETIME,
    @TotalCompra DECIMAL(12,2),
    @NumeroFactura VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el proveedor existe
        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE Id_proveedor = @Id_proveedor)
        BEGIN
            RAISERROR('Proveedor no encontrado', 16, 1);
            RETURN;
        END

        -- Insertar compra
        INSERT INTO Compra (FechaCompra, TotalCompra, NumeroFactura, Id_proveedor)
        VALUES (@FechaCompra, @TotalCompra, @NumeroFactura, @Id_proveedor);

        -- Retornar el registro creado
        SELECT * FROM Compra WHERE Id_compra = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP: Crear Detalle Compra
-- =============================================
IF OBJECT_ID('SP_CrearDetalleCompra', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearDetalleCompra;
GO

CREATE PROCEDURE SP_CrearDetalleCompra
    @Id_compra INT,
    @Id_producto INT,
    @CantidadCompra INT,
    @NumeroLinea INT,
    @PrecioUnitario DECIMAL(12,2),
    @Subtotal DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_Producto = @Id_producto)
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1);
            RETURN;
        END

        -- Insertar detalle
        INSERT INTO DetalleCompra (CantidadCompra, NumeroLinea, PrecioUnitario, Subtotal, Id_compra, Id_producto)
        VALUES (@CantidadCompra, @NumeroLinea, @PrecioUnitario, @Subtotal, @Id_compra, @Id_producto);

        -- Aumentar stock y actualizar precio de compra
        UPDATE Producto
        SET CantidadActual = CantidadActual + @CantidadCompra,
            PrecioCompra = @PrecioUnitario,
            FechaEntrada = GETDATE()
        WHERE Id_Producto = @Id_producto;

        -- Registrar en bitácora
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Producto', 'ENTRADA', @Id_producto, 'COMPRA - Incremento de stock: +' + CAST(@CantidadCompra AS VARCHAR));

        -- Retornar el detalle creado
        SELECT * FROM DetalleCompra WHERE Id_detalleCompra = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP: Obtener Todas las Compras (con paginación y filtros)
-- =============================================
IF OBJECT_ID('SP_ObtenerCompras', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerCompras;
GO

CREATE PROCEDURE SP_ObtenerCompras
    @Limit INT = 50,
    @Offset INT = 0,
    @Id_proveedor INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener registros con filtros
    SELECT 
        c.Id_compra,
        c.FechaCompra,
        c.TotalCompra,
        c.NumeroFactura,
        c.Id_proveedor,
        p.Nombre as ProveedorNombre,
        p.Telefono as ProveedorTelefono,
        p.Direccion as ProveedorDireccion,
        p.Correo_electronico as ProveedorCorreo,
        COUNT(dc.Id_detalleCompra) as TotalProductos
    FROM Compra c
    INNER JOIN Proveedor p ON c.Id_proveedor = p.Id_proveedor
    LEFT JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    WHERE 1=1
        AND (@Id_proveedor IS NULL OR c.Id_proveedor = @Id_proveedor)
        AND (@FechaInicio IS NULL OR c.FechaCompra >= @FechaInicio)
        AND (@FechaFin IS NULL OR c.FechaCompra <= @FechaFin)
    GROUP BY c.Id_compra, c.FechaCompra, c.TotalCompra, c.NumeroFactura,
             c.Id_proveedor, p.Nombre, p.Telefono, p.Direccion, p.Correo_electronico
    ORDER BY c.FechaCompra DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Obtener total de registros (para paginación)
    SELECT COUNT(DISTINCT c.Id_compra) as Total
    FROM Compra c
    WHERE 1=1
        AND (@Id_proveedor IS NULL OR c.Id_proveedor = @Id_proveedor)
        AND (@FechaInicio IS NULL OR c.FechaCompra >= @FechaInicio)
        AND (@FechaFin IS NULL OR c.FechaCompra <= @FechaFin);
END
GO

-- =============================================
-- SP: Obtener Compra por ID
-- =============================================
IF OBJECT_ID('SP_ObtenerCompraPorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerCompraPorId;
GO

CREATE PROCEDURE SP_ObtenerCompraPorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener maestro
    SELECT 
        c.*,
        p.Nombre as ProveedorNombre,
        p.Telefono as ProveedorTelefono,
        p.Direccion as ProveedorDireccion,
        p.Correo_electronico as ProveedorCorreo
    FROM Compra c
    INNER JOIN Proveedor p ON c.Id_proveedor = p.Id_proveedor
    WHERE c.Id_compra = @Id;

    -- Obtener detalles
    SELECT 
        dc.*,
        p.Nombre as ProductoNombre,
        p.Descripcion as ProductoDescripcion,
        p.CodigoBarra,
        c.Nombre as Categoria
    FROM DetalleCompra dc
    INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE dc.Id_compra = @Id
    ORDER BY dc.NumeroLinea;
END
GO

-- =============================================
-- SP: Obtener Estadísticas de Compras
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasCompras', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasCompras;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasCompras
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        COUNT(*) as TotalCompras,
        ISNULL(SUM(TotalCompra), 0) as CompraTotal,
        ISNULL(AVG(TotalCompra), 0) as PromedioCompra,
        ISNULL(MAX(TotalCompra), 0) as CompraMayor,
        ISNULL(MIN(TotalCompra), 0) as CompraMenor,
        COUNT(DISTINCT Id_proveedor) as ProveedoresUnicos
    FROM Compra
    WHERE 1=1
        AND (@FechaInicio IS NULL OR FechaCompra >= @FechaInicio)
        AND (@FechaFin IS NULL OR FechaCompra <= @FechaFin);
END
GO

-- =============================================
-- SP: Obtener Productos Más Comprados
-- =============================================
IF OBJECT_ID('SP_ObtenerProductosMasComprados', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductosMasComprados;
GO

CREATE PROCEDURE SP_ObtenerProductosMasComprados
    @Limit INT = 10,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        p.Id_Producto,
        p.Nombre,
        p.Descripcion,
        cat.Nombre as Categoria,
        SUM(dc.CantidadCompra) as TotalComprado,
        COUNT(DISTINCT c.Id_compra) as NumeroCompras,
        SUM(dc.Subtotal) as TotalInvertido,
        AVG(dc.PrecioUnitario) as PrecioPromedio
    FROM DetalleCompra dc
    INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
    INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
    LEFT JOIN Categoria cat ON p.Id_categoria = cat.Id_categoria
    WHERE 1=1
        AND (@FechaInicio IS NULL OR c.FechaCompra >= @FechaInicio)
        AND (@FechaFin IS NULL OR c.FechaCompra <= @FechaFin)
    GROUP BY p.Id_Producto, p.Nombre, p.Descripcion, cat.Nombre
    ORDER BY TotalComprado DESC;
END
GO

-- =============================================
-- VERIFICACIÓN: Listar SPs Creados
-- =============================================
PRINT '';
PRINT '===========================================';
PRINT '✅ STORED PROCEDURES DE COMPRAS CREADOS';
PRINT '===========================================';

SELECT 
    name as NombreSP, 
    create_date as FechaCreacion
FROM sys.procedures
WHERE name LIKE 'SP_%Compra%'
ORDER BY name;

GO

-- Crear proveedor con nombre más corto
INSERT INTO Proveedor (Nombre, Telefono, Direccion, Correo_electronico)
VALUES ('Ferretería Nacional', '2222-3333', 'San José', 'info@ferretera.com');

-- Verificar que se creó
SELECT * FROM Proveedor;

-----------------------------
-- Ver productos con sus últimas compras
SELECT 
    p.Id_Producto,
    p.Nombre,
    p.CantidadActual,
    p.PrecioCompra,
    p.FechaEntrada,
    (
        SELECT TOP 1 c.FechaCompra 
        FROM DetalleCompra dc 
        INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
        WHERE dc.Id_producto = p.Id_Producto
        ORDER BY c.FechaCompra DESC
    ) as UltimaCompra,
    (
        SELECT TOP 1 dc.CantidadCompra 
        FROM DetalleCompra dc 
        INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
        WHERE dc.Id_producto = p.Id_Producto
        ORDER BY c.FechaCompra DESC
    ) as UltimaCantidadComprada
FROM Producto p
ORDER BY p.FechaEntrada DESC;

--SP realacionados con PRODUCTO

-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE PRODUCTOS
-- =============================================
USE FerreteriaCentral;
GO

-- =============================================
-- SP_ObtenerProductos: Lista productos con paginación y filtros
-- =============================================
IF OBJECT_ID('SP_ObtenerProductos', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductos;
GO

CREATE PROCEDURE SP_ObtenerProductos
    @Limit INT = 50,
    @Offset INT = 0,
    @Nombre VARCHAR(50) = NULL,
    @Id_categoria INT = NULL,
    @CantidadMinima INT = NULL,
    @CantidadMaxima INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Consulta principal con filtros
    SELECT 
        p.Id_producto,
        p.Nombre,
        p.Descripcion,
        p.CantidadActual,
        p.PrecioVenta,
        p.PrecioCompra,
        p.CantidadMinima,
        p.Id_categoria,
        c.Nombre as NombreCategoria,
        p.FechaEntrada,
        -- Estadísticas básicas
        CASE 
            WHEN p.CantidadActual <= p.CantidadMinima THEN 'Bajo'
            WHEN p.CantidadActual >= 100 THEN 'Alto'
            ELSE 'Normal'
        END as EstadoStock
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE 
        (@Nombre IS NULL OR p.Nombre LIKE '%' + @Nombre + '%')
        AND (@Id_categoria IS NULL OR p.Id_categoria = @Id_categoria)
        AND (@CantidadMinima IS NULL OR p.CantidadActual >= @CantidadMinima)
        AND (@CantidadMaxima IS NULL OR p.CantidadActual <= @CantidadMaxima)
    ORDER BY p.Nombre ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Producto p
    WHERE 
        (@Nombre IS NULL OR p.Nombre LIKE '%' + @Nombre + '%')
        AND (@Id_categoria IS NULL OR p.Id_categoria = @Id_categoria)
        AND (@CantidadMinima IS NULL OR p.CantidadActual >= @CantidadMinima)
        AND (@CantidadMaxima IS NULL OR p.CantidadActual <= @CantidadMaxima);
END;
GO

-- =============================================
-- SP_ObtenerProductoPorId: Obtener producto por ID con estadísticas
-- =============================================
IF OBJECT_ID('SP_ObtenerProductoPorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductoPorId;
GO

CREATE PROCEDURE SP_ObtenerProductoPorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Datos del producto
    SELECT 
        p.Id_producto,
        p.Nombre,
        p.Descripcion,
        p.CantidadActual,
        p.PrecioVenta,
        p.PrecioCompra,
        p.CantidadMinima,
        p.Id_categoria,
        c.Nombre as NombreCategoria,
        p.FechaEntrada,
        p.CodigoBarra,
        -- Margen de ganancia
        CASE 
            WHEN p.PrecioCompra > 0 
            THEN CAST(((p.PrecioVenta - p.PrecioCompra) / p.PrecioCompra * 100) AS DECIMAL(10,2))
            ELSE 0 
        END as MargenGanancia,
        -- Estado del stock
        CASE 
            WHEN p.CantidadActual <= p.CantidadMinima THEN 'Bajo'
            WHEN p.CantidadActual >= 100 THEN 'Alto'
            ELSE 'Normal'
        END as EstadoStock
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE p.Id_producto = @Id;

    -- Estadísticas de ventas
    SELECT 
        COUNT(DISTINCT dv.Id_venta) as TotalVentas,
        ISNULL(SUM(dv.CantidadVenta), 0) as CantidadVendida,
        ISNULL(SUM(dv.Subtotal), 0) as MontoTotalVendido,
        MAX(v.Fecha) as UltimaVenta
    FROM DetalleVenta dv
    INNER JOIN Venta v ON dv.Id_venta = v.Id_venta
    WHERE dv.Id_producto = @Id;

    -- Estadísticas de compras
    SELECT 
        COUNT(DISTINCT dc.Id_compra) as TotalCompras,
        ISNULL(SUM(dc.CantidadCompra), 0) as CantidadComprada,
        ISNULL(SUM(dc.Subtotal), 0) as MontoTotalComprado,
        MAX(c.FechaCompra) as UltimaCompra
    FROM DetalleCompra dc
    INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
    WHERE dc.Id_producto = @Id;

    -- Historial de movimientos (últimos 10)
    SELECT TOP 10
        bp.Id_bitacora,
        bp.TablaAfectada,
        bp.Accion,
        bp.Fecha,
        bp.Hora,
        bp.Descripcion
    FROM BitacoraProducto bp
    WHERE bp.Id_producto = @Id
    ORDER BY bp.Fecha DESC, bp.Hora DESC;
END;
GO

-- =============================================
-- SP_CrearProducto: Crear nuevo producto
-- =============================================
IF OBJECT_ID('SP_CrearProducto', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearProducto;
GO

CREATE PROCEDURE SP_CrearProducto
    @Nombre VARCHAR(20),
    @Descripcion VARCHAR(100) = NULL,
    @CantidadActual INT,
    @PrecioVenta DECIMAL(12,2),
    @PrecioCompra DECIMAL(12,2),
    @CantidadMinima INT = 5,
    @Id_categoria INT = NULL,
    @CodigoBarra VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validaciones
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            RAISERROR('El nombre del producto es requerido', 16, 1);
            RETURN;
        END

        IF @CantidadActual < 0
        BEGIN
            RAISERROR('La cantidad no puede ser negativa', 16, 1);
            RETURN;
        END

        IF @PrecioVenta <= 0
        BEGIN
            RAISERROR('El precio de venta debe ser mayor a cero', 16, 1);
            RETURN;
        END

        IF @PrecioCompra < 0
        BEGIN
            RAISERROR('El precio de compra no puede ser negativo', 16, 1);
            RETURN;
        END

        -- Verificar si ya existe un producto con el mismo nombre
        IF EXISTS (SELECT 1 FROM Producto WHERE Nombre = @Nombre)
        BEGIN
            RAISERROR('Ya existe un producto con ese nombre', 16, 1);
            RETURN;
        END

        -- Insertar producto
        INSERT INTO Producto (Nombre, Descripcion, CantidadActual, PrecioVenta, PrecioCompra, CantidadMinima, Id_categoria, CodigoBarra, FechaEntrada)
        VALUES (@Nombre, @Descripcion, @CantidadActual, @PrecioVenta, @PrecioCompra, @CantidadMinima, @Id_categoria, @CodigoBarra, GETDATE());

        DECLARE @Id INT = SCOPE_IDENTITY();

        -- Registrar en bitácora si hay stock inicial
        IF @CantidadActual > 0
        BEGIN
            DECLARE @DescripcionBitacora VARCHAR(255) = 'Creación de producto con inventario inicial de ' + CAST(@CantidadActual AS VARCHAR) + ' unidades';
            INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
            VALUES ('Producto', 'INSERT', @Id, @DescripcionBitacora);
        END

        -- Retornar producto creado
        SELECT 
            p.Id_producto,
            p.Nombre,
            p.Descripcion,
            p.CantidadActual,
            p.PrecioVenta,
            p.PrecioCompra,
            p.CantidadMinima,
            p.Id_categoria,
            p.CodigoBarra,
            p.FechaEntrada,
            c.Nombre as NombreCategoria
        FROM Producto p
        LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
        WHERE p.Id_producto = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ActualizarProducto: Actualizar producto existente
-- =============================================
IF OBJECT_ID('SP_ActualizarProducto', 'P') IS NOT NULL
    DROP PROCEDURE SP_ActualizarProducto;
GO

CREATE PROCEDURE SP_ActualizarProducto
    @Id INT,
    @Nombre VARCHAR(20) = NULL,
    @Descripcion VARCHAR(100) = NULL,
    @PrecioVenta DECIMAL(12,2) = NULL,
    @PrecioCompra DECIMAL(12,2) = NULL,
    @CantidadMinima INT = NULL,
    @Id_categoria INT = NULL,
    @CodigoBarra VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_producto = @Id)
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1);
            RETURN;
        END

        -- Si se actualiza el nombre, verificar que no exista otro con ese nombre
        IF @Nombre IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM Producto WHERE Nombre = @Nombre AND Id_producto != @Id)
            BEGIN
                RAISERROR('Ya existe otro producto con ese nombre', 16, 1);
                RETURN;
            END
        END

        -- Validaciones
        IF @PrecioVenta IS NOT NULL AND @PrecioVenta <= 0
        BEGIN
            RAISERROR('El precio de venta debe ser mayor a cero', 16, 1);
            RETURN;
        END

        IF @PrecioCompra IS NOT NULL AND @PrecioCompra < 0
        BEGIN
            RAISERROR('El precio de compra no puede ser negativo', 16, 1);
            RETURN;
        END

        -- Actualizar solo los campos proporcionados
        UPDATE Producto
        SET 
            Nombre = ISNULL(@Nombre, Nombre),
            Descripcion = CASE WHEN @Descripcion IS NOT NULL THEN @Descripcion ELSE Descripcion END,
            PrecioVenta = ISNULL(@PrecioVenta, PrecioVenta),
            PrecioCompra = ISNULL(@PrecioCompra, PrecioCompra),
            CantidadMinima = ISNULL(@CantidadMinima, CantidadMinima),
            Id_categoria = CASE WHEN @Id_categoria IS NOT NULL THEN @Id_categoria ELSE Id_categoria END,
            CodigoBarra = CASE WHEN @CodigoBarra IS NOT NULL THEN @CodigoBarra ELSE CodigoBarra END
        WHERE Id_producto = @Id;

        -- Registrar en bitácora
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Producto', 'UPDATE', @Id, 'Actualización de información del producto');

        -- Retornar producto actualizado
        SELECT 
            p.Id_producto,
            p.Nombre,
            p.Descripcion,
            p.CantidadActual,
            p.PrecioVenta,
            p.PrecioCompra,
            p.CantidadMinima,
            p.Id_categoria,
            p.CodigoBarra,
            p.FechaEntrada,
            c.Nombre as NombreCategoria
        FROM Producto p
        LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
        WHERE p.Id_producto = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_EliminarProducto: Eliminar producto (con validaciones)
-- =============================================
IF OBJECT_ID('SP_EliminarProducto', 'P') IS NOT NULL
    DROP PROCEDURE SP_EliminarProducto;
GO

CREATE PROCEDURE SP_EliminarProducto
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_producto = @Id)
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1);
            RETURN;
        END

        DECLARE @NombreProducto VARCHAR(20);
        SELECT @NombreProducto = Nombre FROM Producto WHERE Id_producto = @Id;

        -- Verificar si tiene ventas asociadas
        DECLARE @TotalVentas INT;
        SELECT @TotalVentas = COUNT(*) FROM DetalleVenta WHERE Id_producto = @Id;

        IF @TotalVentas > 0
        BEGIN
            DECLARE @MensajeVentas VARCHAR(200) = 
                'No se puede eliminar el producto "' + @NombreProducto + 
                '" porque tiene ' + CAST(@TotalVentas AS VARCHAR) + ' venta(s) asociada(s)';
            RAISERROR(@MensajeVentas, 16, 1);
            RETURN;
        END

        -- Verificar si tiene compras asociadas
        DECLARE @TotalCompras INT;
        SELECT @TotalCompras = COUNT(*) FROM DetalleCompra WHERE Id_producto = @Id;

        IF @TotalCompras > 0
        BEGIN
            DECLARE @MensajeCompras VARCHAR(200) = 
                'No se puede eliminar el producto "' + @NombreProducto + 
                '" porque tiene ' + CAST(@TotalCompras AS VARCHAR) + ' compra(s) asociada(s)';
            RAISERROR(@MensajeCompras, 16, 1);
            RETURN;
        END

        -- Verificar si tiene alquileres asociados
        DECLARE @TotalAlquileres INT;
        SELECT @TotalAlquileres = COUNT(*) FROM DetalleAlquiler WHERE Id_producto = @Id;

        IF @TotalAlquileres > 0
        BEGIN
            DECLARE @MensajeAlquileres VARCHAR(200) = 
                'No se puede eliminar el producto "' + @NombreProducto + 
                '" porque tiene ' + CAST(@TotalAlquileres AS VARCHAR) + ' alquiler(es) asociado(s)';
            RAISERROR(@MensajeAlquileres, 16, 1);
            RETURN;
        END

        -- Guardar datos antes de eliminar
        DECLARE @ProductoEliminado TABLE (
            Id_producto INT,
            Nombre VARCHAR(20),
            Descripcion VARCHAR(100),
            CantidadActual INT,
            PrecioVenta DECIMAL(12,2),
            PrecioCompra DECIMAL(12,2)
        );

        -- Eliminar bitácora asociada
        DELETE FROM BitacoraProducto WHERE Id_producto = @Id;

        -- Eliminar producto
        DELETE FROM Producto
        OUTPUT DELETED.Id_producto, DELETED.Nombre, DELETED.Descripcion, 
               DELETED.CantidadActual, DELETED.PrecioVenta, DELETED.PrecioCompra
        INTO @ProductoEliminado
        WHERE Id_producto = @Id;

        -- Retornar producto eliminado
        SELECT * FROM @ProductoEliminado;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_AjustarInventario: Ajustar manualmente el stock de un producto
-- =============================================
IF OBJECT_ID('SP_AjustarInventario', 'P') IS NOT NULL
    DROP PROCEDURE SP_AjustarInventario;
GO

CREATE PROCEDURE SP_AjustarInventario
    @Id_producto INT,
    @CantidadAjuste INT,
    @TipoMovimiento VARCHAR(50),
    @Descripcion VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_producto = @Id_producto)
        BEGIN
            RAISERROR('Producto no encontrado', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @CantidadAnterior INT;
        SELECT @CantidadAnterior = CantidadActual FROM Producto WHERE Id_producto = @Id_producto;

        DECLARE @CantidadNueva INT = @CantidadAnterior + @CantidadAjuste;

        -- Validar que el stock no quede negativo
        IF @CantidadNueva < 0
        BEGIN
            RAISERROR('El ajuste resultaría en cantidad negativa', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Actualizar stock
        UPDATE Producto
        SET CantidadActual = @CantidadNueva
        WHERE Id_producto = @Id_producto;

        -- Registrar en bitácora
        DECLARE @DescripcionCompleta VARCHAR(255) = ISNULL(@Descripcion, '') + ' | Ajuste: ' + CAST(@CantidadAjuste AS VARCHAR) + ' | Anterior: ' + CAST(@CantidadAnterior AS VARCHAR) + ' | Nuevo: ' + CAST(@CantidadNueva AS VARCHAR);
        
        INSERT INTO BitacoraProducto (TablaAfectada, Accion, Id_producto, Descripcion)
        VALUES ('Producto', @TipoMovimiento, @Id_producto, @DescripcionCompleta);

        COMMIT TRANSACTION;

        -- Retornar producto actualizado
        SELECT 
            p.Id_producto,
            p.Nombre,
            p.CantidadActual as StockActual,
            @CantidadAnterior as StockAnterior,
            @CantidadAjuste as Ajuste,
            @TipoMovimiento as TipoMovimiento
        FROM Producto p
        WHERE p.Id_producto = @Id_producto;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ObtenerProductosBajoStock: Productos con stock bajo o crítico
-- =============================================
IF OBJECT_ID('SP_ObtenerProductosBajoStock', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductosBajoStock;
GO

CREATE PROCEDURE SP_ObtenerProductosBajoStock
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.Id_producto,
        p.Nombre,
        p.CantidadActual,
        p.CantidadMinima,
        p.PrecioVenta,
        p.PrecioCompra,
        c.Nombre as NombreCategoria,
        CASE 
            WHEN p.CantidadActual = 0 THEN 'Sin Stock'
            WHEN p.CantidadActual <= p.CantidadMinima / 2 THEN 'Crítico'
            WHEN p.CantidadActual <= p.CantidadMinima THEN 'Bajo'
            ELSE 'Normal'
        END as NivelCriticidad,
        (p.CantidadMinima - p.CantidadActual) as CantidadRequerida
    FROM Producto p
    LEFT JOIN Categoria c ON p.Id_categoria = c.Id_categoria
    WHERE p.CantidadActual <= p.CantidadMinima
    ORDER BY 
        CASE 
            WHEN p.CantidadActual = 0 THEN 1
            WHEN p.CantidadActual <= p.CantidadMinima / 2 THEN 2
            ELSE 3
        END,
        p.CantidadActual ASC;
END;
GO

-- =============================================
-- SP_ObtenerEstadisticasInventario: Estadísticas generales del inventario
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasInventario', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasInventario;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasInventario
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(*) as TotalProductos,
        SUM(CantidadActual) as StockTotal,
        SUM(CantidadActual * PrecioCompra) as ValorInventarioCompra,
        SUM(CantidadActual * PrecioVenta) as ValorInventarioVenta,
        SUM(CantidadActual * (PrecioVenta - PrecioCompra)) as GananciaPotencial,
        AVG(PrecioVenta) as PromedioPrecios,
        SUM(CASE WHEN CantidadActual <= CantidadMinima THEN 1 ELSE 0 END) as ProductosBajoStock,
        SUM(CASE WHEN CantidadActual = 0 THEN 1 ELSE 0 END) as ProductosSinStock,
        SUM(CASE WHEN CantidadActual >= 100 THEN 1 ELSE 0 END) as ProductosAltoStock
    FROM Producto;
END;
GO

-- =============================================
-- SP_ObtenerProductosPorCategoria: Listar productos de una categoría
-- =============================================
IF OBJECT_ID('SP_ObtenerProductosPorCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductosPorCategoria;
GO

CREATE PROCEDURE SP_ObtenerProductosPorCategoria
    @Id_categoria INT,
    @Limit INT = 50,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- Lista de productos
    SELECT 
        p.Id_producto,
        p.Nombre,
        p.Descripcion,
        p.CantidadActual,
        p.PrecioVenta,
        p.PrecioCompra,
        p.CantidadMinima,
        CASE 
            WHEN p.CantidadActual <= p.CantidadMinima THEN 'Bajo'
            WHEN p.CantidadActual >= 100 THEN 'Alto'
            ELSE 'Normal'
        END as EstadoStock
    FROM Producto p
    WHERE p.Id_categoria = @Id_categoria
    ORDER BY p.Nombre ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de productos en la categoría
    SELECT COUNT(*) as Total
    FROM Producto
    WHERE Id_categoria = @Id_categoria;
END;
GO

PRINT '✅ Todos los Stored Procedures de Productos creados exitosamente';
------------------------------------
SELECT 
    name as NombreSP, 
    create_date as FechaCreacion
FROM sys.procedures
WHERE name LIKE 'SP_%Producto%'
ORDER BY name;

-----------------------

USE FerreteriaCentral;

SELECT 
    Id_producto,
    Nombre,
    Descripcion,
    CantidadActual,
    PrecioVenta,
    PrecioCompra,
    CantidadMinima,
    Id_categoria
FROM Producto
ORDER BY Id_producto;

--SP realacionados con Proveedores

-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE PROVEEDORES
-- =============================================
USE FerreteriaCentral;
GO

-- =============================================
-- SP_ObtenerProveedores: Lista proveedores con paginación y filtros
-- =============================================
IF OBJECT_ID('SP_ObtenerProveedores', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProveedores;
GO

CREATE PROCEDURE SP_ObtenerProveedores
    @Limit INT = 50,
    @Offset INT = 0,
    @Nombre VARCHAR(20) = NULL,
    @Telefono VARCHAR(20) = NULL,
    @Correo VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Consulta principal con estadísticas de compras
    SELECT 
        p.Id_proveedor,
        p.Nombre,
        p.Telefono,
        p.Direccion,
        p.Correo_electronico,
        COUNT(DISTINCT c.Id_compra) as TotalCompras,
        ISNULL(SUM(c.TotalCompra), 0) as MontoTotalComprado,
        MAX(c.FechaCompra) as UltimaCompra
    FROM Proveedor p
    LEFT JOIN Compra c ON p.Id_proveedor = c.Id_proveedor
    WHERE 
        (@Nombre IS NULL OR p.Nombre LIKE '%' + @Nombre + '%')
        AND (@Telefono IS NULL OR p.Telefono LIKE '%' + @Telefono + '%')
        AND (@Correo IS NULL OR p.Correo_electronico LIKE '%' + @Correo + '%')
    GROUP BY p.Id_proveedor, p.Nombre, p.Telefono, p.Direccion, p.Correo_electronico
    ORDER BY p.Nombre ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Proveedor p
    WHERE 
        (@Nombre IS NULL OR p.Nombre LIKE '%' + @Nombre + '%')
        AND (@Telefono IS NULL OR p.Telefono LIKE '%' + @Telefono + '%')
        AND (@Correo IS NULL OR p.Correo_electronico LIKE '%' + @Correo + '%');
END;
GO

-- =============================================
-- SP_ObtenerProveedorPorId: Obtener proveedor por ID con estadísticas
-- =============================================
IF OBJECT_ID('SP_ObtenerProveedorPorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProveedorPorId;
GO

CREATE PROCEDURE SP_ObtenerProveedorPorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Datos del proveedor con estadísticas completas
    SELECT 
        p.Id_proveedor,
        p.Nombre,
        p.Telefono,
        p.Direccion,
        p.Correo_electronico,
        COUNT(DISTINCT c.Id_compra) as TotalCompras,
        ISNULL(SUM(c.TotalCompra), 0) as MontoTotalComprado,
        MAX(c.FechaCompra) as UltimaCompra,
        MIN(c.FechaCompra) as PrimeraCompra
    FROM Proveedor p
    LEFT JOIN Compra c ON p.Id_proveedor = c.Id_proveedor
    WHERE p.Id_proveedor = @Id
    GROUP BY p.Id_proveedor, p.Nombre, p.Telefono, p.Direccion, p.Correo_electronico;
END;
GO

-- =============================================
-- SP_CrearProveedor: Crear nuevo proveedor
-- =============================================
IF OBJECT_ID('SP_CrearProveedor', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearProveedor;
GO

CREATE PROCEDURE SP_CrearProveedor
    @Nombre VARCHAR(20),
    @Telefono VARCHAR(20) = NULL,
    @Direccion VARCHAR(255) = NULL,
    @Correo_electronico VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validaciones
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            RAISERROR('El nombre del proveedor es requerido', 16, 1);
            RETURN;
        END

        -- Verificar que no exista otro proveedor con el mismo nombre
        IF EXISTS (SELECT 1 FROM Proveedor WHERE Nombre = @Nombre)
        BEGIN
            RAISERROR('Ya existe un proveedor con ese nombre', 16, 1);
            RETURN;
        END

        -- Insertar proveedor
        INSERT INTO Proveedor (Nombre, Telefono, Direccion, Correo_electronico)
        VALUES (@Nombre, @Telefono, @Direccion, @Correo_electronico);

        DECLARE @Id INT = SCOPE_IDENTITY();

        -- Retornar proveedor creado
        SELECT 
            Id_proveedor,
            Nombre,
            Telefono,
            Direccion,
            Correo_electronico
        FROM Proveedor
        WHERE Id_proveedor = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ActualizarProveedor: Actualizar proveedor existente
-- =============================================
IF OBJECT_ID('SP_ActualizarProveedor', 'P') IS NOT NULL
    DROP PROCEDURE SP_ActualizarProveedor;
GO

CREATE PROCEDURE SP_ActualizarProveedor
    @Id INT,
    @Nombre VARCHAR(20) = NULL,
    @Telefono VARCHAR(20) = NULL,
    @Direccion VARCHAR(255) = NULL,
    @Correo_electronico VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el proveedor existe
        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE Id_proveedor = @Id)
        BEGIN
            RAISERROR('Proveedor no encontrado', 16, 1);
            RETURN;
        END

        -- Si se actualiza el nombre, verificar que no exista otro con ese nombre
        IF @Nombre IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM Proveedor WHERE Nombre = @Nombre AND Id_proveedor != @Id)
            BEGIN
                RAISERROR('Ya existe otro proveedor con ese nombre', 16, 1);
                RETURN;
            END
        END

        -- Actualizar solo los campos proporcionados
        UPDATE Proveedor
        SET 
            Nombre = ISNULL(@Nombre, Nombre),
            Telefono = CASE WHEN @Telefono IS NOT NULL THEN @Telefono ELSE Telefono END,
            Direccion = CASE WHEN @Direccion IS NOT NULL THEN @Direccion ELSE Direccion END,
            Correo_electronico = CASE WHEN @Correo_electronico IS NOT NULL THEN @Correo_electronico ELSE Correo_electronico END
        WHERE Id_proveedor = @Id;

        -- Retornar proveedor actualizado
        SELECT 
            Id_proveedor,
            Nombre,
            Telefono,
            Direccion,
            Correo_electronico
        FROM Proveedor
        WHERE Id_proveedor = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_EliminarProveedor: Eliminar proveedor (con validaciones)
-- =============================================
IF OBJECT_ID('SP_EliminarProveedor', 'P') IS NOT NULL
    DROP PROCEDURE SP_EliminarProveedor;
GO

CREATE PROCEDURE SP_EliminarProveedor
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el proveedor existe
        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE Id_proveedor = @Id)
        BEGIN
            RAISERROR('Proveedor no encontrado', 16, 1);
            RETURN;
        END

        DECLARE @NombreProveedor VARCHAR(20);
        SELECT @NombreProveedor = Nombre FROM Proveedor WHERE Id_proveedor = @Id;

        -- Verificar si tiene compras asociadas
        DECLARE @TotalCompras INT;
        DECLARE @MontoTotal DECIMAL(12,2);
        
        SELECT 
            @TotalCompras = COUNT(*),
            @MontoTotal = ISNULL(SUM(TotalCompra), 0)
        FROM Compra 
        WHERE Id_proveedor = @Id;

        IF @TotalCompras > 0
        BEGIN
            DECLARE @MensajeCompras VARCHAR(500) = 
                'No se puede eliminar el proveedor "' + @NombreProveedor + 
                '" porque tiene ' + CAST(@TotalCompras AS VARCHAR) + 
                ' compra(s) registrada(s) por un monto total de ₡' + 
                CAST(@MontoTotal AS VARCHAR);
            RAISERROR(@MensajeCompras, 16, 1);
            RETURN;
        END

        -- Guardar datos antes de eliminar
        DECLARE @ProveedorEliminado TABLE (
            Id_proveedor INT,
            Nombre VARCHAR(20),
            Telefono VARCHAR(20),
            Direccion VARCHAR(255),
            Correo_electronico VARCHAR(100)
        );

        -- Eliminar proveedor
        DELETE FROM Proveedor
        OUTPUT DELETED.Id_proveedor, DELETED.Nombre, DELETED.Telefono, 
               DELETED.Direccion, DELETED.Correo_electronico
        INTO @ProveedorEliminado
        WHERE Id_proveedor = @Id;

        -- Retornar proveedor eliminado
        SELECT * FROM @ProveedorEliminado;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ObtenerHistorialComprasProveedor: Historial de compras del proveedor
-- =============================================
IF OBJECT_ID('SP_ObtenerHistorialComprasProveedor', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerHistorialComprasProveedor;
GO

CREATE PROCEDURE SP_ObtenerHistorialComprasProveedor
    @Id_proveedor INT,
    @Limit INT = 50,
    @Offset INT = 0,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener historial de compras
    SELECT 
        c.Id_compra,
        c.FechaCompra,
        c.TotalCompra,
        c.NumeroFactura,
        COUNT(dc.Id_detalleCompra) as TotalProductos,
        SUM(dc.CantidadCompra) as CantidadTotal
    FROM Compra c
    LEFT JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    WHERE c.Id_proveedor = @Id_proveedor
        AND (@FechaInicio IS NULL OR c.FechaCompra >= @FechaInicio)
        AND (@FechaFin IS NULL OR c.FechaCompra <= @FechaFin)
    GROUP BY c.Id_compra, c.FechaCompra, c.TotalCompra, c.NumeroFactura
    ORDER BY c.FechaCompra DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Compra c
    WHERE c.Id_proveedor = @Id_proveedor
        AND (@FechaInicio IS NULL OR c.FechaCompra >= @FechaInicio)
        AND (@FechaFin IS NULL OR c.FechaCompra <= @FechaFin);
END;
GO

-- =============================================
-- SP_ObtenerProductosProveedor: Productos suministrados por el proveedor
-- =============================================
IF OBJECT_ID('SP_ObtenerProductosProveedor', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductosProveedor;
GO

CREATE PROCEDURE SP_ObtenerProductosProveedor
    @Id_proveedor INT,
    @Limit INT = 50,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener productos con estadísticas
    SELECT 
        p.Id_Producto,
        p.Nombre,
        p.Descripcion,
        p.PrecioCompra,
        p.PrecioVenta,
        p.CantidadActual,
        cat.Nombre as Categoria,
        COUNT(DISTINCT dc.Id_compra) as VecesComprado,
        SUM(dc.CantidadCompra) as TotalComprado,
        MAX(c.FechaCompra) as UltimaCompra,
        AVG(dc.PrecioUnitario) as PrecioPromedio
    FROM Producto p
    INNER JOIN DetalleCompra dc ON p.Id_Producto = dc.Id_producto
    INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
    LEFT JOIN Categoria cat ON p.Id_categoria = cat.Id_categoria
    WHERE c.Id_proveedor = @Id_proveedor
    GROUP BY p.Id_Producto, p.Nombre, p.Descripcion, p.PrecioCompra, 
             p.PrecioVenta, p.CantidadActual, cat.Nombre
    ORDER BY TotalComprado DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de productos distintos
    SELECT COUNT(DISTINCT p.Id_Producto) as Total
    FROM Producto p
    INNER JOIN DetalleCompra dc ON p.Id_Producto = dc.Id_producto
    INNER JOIN Compra c ON dc.Id_compra = c.Id_compra
    WHERE c.Id_proveedor = @Id_proveedor;
END;
GO

-- =============================================
-- SP_ObtenerEstadisticasProveedor: Estadísticas detalladas del proveedor
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasProveedor', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasProveedor;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasProveedor
    @Id_proveedor INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(DISTINCT c.Id_compra) as TotalCompras,
        ISNULL(SUM(c.TotalCompra), 0) as MontoTotal,
        ISNULL(AVG(c.TotalCompra), 0) as PromedioCompra,
        ISNULL(MAX(c.TotalCompra), 0) as CompraMayor,
        ISNULL(MIN(c.TotalCompra), 0) as CompraMenor,
        COUNT(DISTINCT dc.Id_producto) as ProductosDistintos,
        ISNULL(SUM(dc.CantidadCompra), 0) as CantidadTotalComprada,
        MAX(c.FechaCompra) as UltimaCompra,
        MIN(c.FechaCompra) as PrimeraCompra
    FROM Compra c
    LEFT JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    WHERE c.Id_proveedor = @Id_proveedor;
END;
GO

PRINT '✅ Todos los Stored Procedures de Proveedores creados exitosamente';
--------------------------------------

SELECT * FROM Proveedor;

--SP realacionados con Clientes

-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE CLIENTES
-- =============================================
USE FerreteriaCentral;
GO

-- =============================================
-- SP_ObtenerClientes: Lista clientes con paginación y filtros
-- =============================================
IF OBJECT_ID('SP_ObtenerClientes', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerClientes;
GO

CREATE PROCEDURE SP_ObtenerClientes
    @Limit INT = 50,
    @Offset INT = 0,
    @Nombre VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Consulta principal con estadísticas
    SELECT 
        c.Id_cliente,
        c.Nombre,
        c.Apellido1,
        c.Apellido2,
        c.Telefono,
        c.Correo,
        c.Direccion,
        COUNT(DISTINCT v.Id_venta) as TotalVentas,
        COUNT(DISTINCT a.Id_alquiler) as TotalAlquileres,
        ISNULL(SUM(v.TotalVenta), 0) as MontoTotalGastado
    FROM Cliente c
    LEFT JOIN Venta v ON c.Id_cliente = v.Id_cliente
    LEFT JOIN Alquiler a ON c.Id_cliente = a.Id_cliente
    WHERE 
        (@Nombre IS NULL OR c.Nombre LIKE '%' + @Nombre + '%')
    GROUP BY c.Id_cliente, c.Nombre, c.Apellido1, c.Apellido2, 
             c.Telefono, c.Correo, c.Direccion
    ORDER BY c.Nombre ASC, c.Apellido1 ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Cliente c
    WHERE 
        (@Nombre IS NULL OR c.Nombre LIKE '%' + @Nombre + '%');
END;
GO

-- =============================================
-- SP_ObtenerClientePorId: Obtener cliente por ID con estadísticas
-- =============================================
IF OBJECT_ID('SP_ObtenerClientePorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerClientePorId;
GO

CREATE PROCEDURE SP_ObtenerClientePorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Datos del cliente con estadísticas
    SELECT 
        c.Id_cliente,
        c.Nombre,
        c.Apellido1,
        c.Apellido2,
        c.Telefono,
        c.Correo,
        c.Direccion,
        COUNT(DISTINCT v.Id_venta) as TotalVentas,
        COUNT(DISTINCT a.Id_alquiler) as TotalAlquileres,
        ISNULL(SUM(v.TotalVenta), 0) as MontoTotalGastado,
        MAX(v.Fecha) as UltimaVenta,
        MIN(v.Fecha) as PrimeraVenta
    FROM Cliente c
    LEFT JOIN Venta v ON c.Id_cliente = v.Id_cliente
    LEFT JOIN Alquiler a ON c.Id_cliente = a.Id_cliente
    WHERE c.Id_cliente = @Id
    GROUP BY c.Id_cliente, c.Nombre, c.Apellido1, c.Apellido2,
             c.Telefono, c.Correo, c.Direccion;
END;
GO

-- =============================================
-- SP_CrearCliente: Crear nuevo cliente
-- =============================================
IF OBJECT_ID('SP_CrearCliente', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearCliente;
GO

CREATE PROCEDURE SP_CrearCliente
    @Nombre VARCHAR(50),
    @Apellido1 VARCHAR(50),
    @Apellido2 VARCHAR(50) = NULL,
    @Telefono VARCHAR(20) = NULL,
    @Correo VARCHAR(100) = NULL,
    @Direccion VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validaciones
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            RAISERROR('El nombre del cliente es requerido', 16, 1);
            RETURN;
        END

        IF @Apellido1 IS NULL OR LTRIM(RTRIM(@Apellido1)) = ''
        BEGIN
            RAISERROR('El primer apellido es requerido', 16, 1);
            RETURN;
        END

        -- Insertar cliente
        INSERT INTO Cliente (Nombre, Apellido1, Apellido2, Telefono, Correo, Direccion)
        VALUES (@Nombre, @Apellido1, @Apellido2, @Telefono, @Correo, @Direccion);

        DECLARE @Id INT = SCOPE_IDENTITY();

        -- Retornar cliente creado
        SELECT * FROM Cliente WHERE Id_cliente = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ActualizarCliente: Actualizar cliente existente
-- =============================================
IF OBJECT_ID('SP_ActualizarCliente', 'P') IS NOT NULL
    DROP PROCEDURE SP_ActualizarCliente;
GO

CREATE PROCEDURE SP_ActualizarCliente
    @Id INT,
    @Nombre VARCHAR(50) = NULL,
    @Apellido1 VARCHAR(50) = NULL,
    @Apellido2 VARCHAR(50) = NULL,
    @Telefono VARCHAR(20) = NULL,
    @Correo VARCHAR(100) = NULL,
    @Direccion VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_cliente = @Id)
        BEGIN
            RAISERROR('Cliente no encontrado', 16, 1);
            RETURN;
        END

        -- Actualizar solo los campos proporcionados (la cédula NO se actualiza)
        UPDATE Cliente
        SET 
            Nombre = ISNULL(@Nombre, Nombre),
            Apellido1 = ISNULL(@Apellido1, Apellido1),
            Apellido2 = CASE WHEN @Apellido2 IS NOT NULL THEN @Apellido2 ELSE Apellido2 END,
            Telefono = CASE WHEN @Telefono IS NOT NULL THEN @Telefono ELSE Telefono END,
            Correo = CASE WHEN @Correo IS NOT NULL THEN @Correo ELSE Correo END,
            Direccion = CASE WHEN @Direccion IS NOT NULL THEN @Direccion ELSE Direccion END
        WHERE Id_cliente = @Id;

        -- Retornar cliente actualizado
        SELECT * FROM Cliente WHERE Id_cliente = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_EliminarCliente: Eliminar cliente (lógica o física)
-- =============================================
IF OBJECT_ID('SP_EliminarCliente', 'P') IS NOT NULL
    DROP PROCEDURE SP_EliminarCliente;
GO

CREATE PROCEDURE SP_EliminarCliente
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_cliente = @Id)
        BEGIN
            RAISERROR('Cliente no encontrado', 16, 1);
            RETURN;
        END

        DECLARE @NombreCliente VARCHAR(150);
        SELECT @NombreCliente = Nombre + ' ' + Apellido1 + ISNULL(' ' + Apellido2, '') 
        FROM Cliente WHERE Id_cliente = @Id;

        -- Verificar referencias
        DECLARE @TotalAlquileres INT;
        DECLARE @TotalVentas INT;
        
        SELECT @TotalAlquileres = COUNT(*) FROM Alquiler WHERE Id_cliente = @Id;
        SELECT @TotalVentas = COUNT(*) FROM Venta WHERE Id_cliente = @Id;

        DECLARE @TotalReferencias INT = @TotalAlquileres + @TotalVentas;

        IF @TotalReferencias > 0
        BEGIN
            -- No se puede eliminar: tiene referencias
            SELECT 
                @Id as Id_cliente,
                @NombreCliente as Nombre,
                'ERROR' as Estado,
                0 as EliminacionLogica,
                @TotalAlquileres as TotalAlquileres,
                @TotalVentas as TotalVentas,
                'No se puede eliminar el cliente porque tiene ' + 
                CAST(@TotalAlquileres AS VARCHAR) + ' alquiler(es) y ' + 
                CAST(@TotalVentas AS VARCHAR) + ' venta(s) registradas' as Mensaje;
            
            RAISERROR('No se puede eliminar el cliente porque tiene registros asociados', 16, 1);
            RETURN;
        END
        ELSE
        BEGIN
            -- Eliminación física: sin referencias
            DECLARE @ClienteEliminado TABLE (
                Id_cliente INT,
                Nombre VARCHAR(50),
                Apellido1 VARCHAR(50),
                Apellido2 VARCHAR(50)
            );

            DELETE FROM Cliente
            OUTPUT DELETED.Id_cliente, DELETED.Nombre, DELETED.Apellido1, 
                   DELETED.Apellido2
            INTO @ClienteEliminado
            WHERE Id_cliente = @Id;

            -- Retornar información de eliminación física
            SELECT 
                *,
                'ELIMINADO' as Estado,
                0 as EliminacionLogica,
                'Cliente eliminado físicamente' as Mensaje
            FROM @ClienteEliminado;
        END

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ObtenerHistorialVentasCliente: Historial de ventas del cliente
-- =============================================
IF OBJECT_ID('SP_ObtenerHistorialVentasCliente', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerHistorialVentasCliente;
GO

CREATE PROCEDURE SP_ObtenerHistorialVentasCliente
    @Id_cliente INT,
    @Limit INT = 50,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener historial de ventas
    SELECT 
        v.Id_venta,
        v.Fecha,
        v.TotalVenta,
        v.MetodoPago,
        v.Estado,
        col.Nombre + ' ' + col.Apellido1 + ISNULL(' ' + col.Apellido2, '') as ColaboradorNombre,
        COUNT(dv.Id_detalleVenta) as TotalProductos,
        SUM(dv.CantidadVenta) as CantidadTotal
    FROM Venta v
    INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
    LEFT JOIN DetalleVenta dv ON v.Id_venta = dv.Id_venta
    WHERE v.Id_cliente = @Id_cliente
    GROUP BY v.Id_venta, v.Fecha, v.TotalVenta, v.MetodoPago, v.Estado,
             col.Nombre, col.Apellido1, col.Apellido2
    ORDER BY v.Fecha DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Venta
    WHERE Id_cliente = @Id_cliente;
END;
GO

-- =============================================
-- SP_ObtenerEstadisticasCliente: Estadísticas del cliente
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasCliente', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasCliente;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasCliente
    @Id_cliente INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(DISTINCT v.Id_venta) as TotalCompras,
        ISNULL(SUM(v.TotalVenta), 0) as TotalGastado,
        ISNULL(AVG(v.TotalVenta), 0) as PromedioCompra,
        MAX(v.Fecha) as UltimaCompra,
        MIN(v.Fecha) as PrimeraCompra,
        (SELECT COUNT(*) FROM Alquiler WHERE Id_cliente = @Id_cliente) as TotalAlquileres,
        (SELECT COUNT(*) FROM Alquiler WHERE Id_cliente = @Id_cliente AND Estado = 'ACTIVO') as AlquileresActivos
    FROM Venta v
    WHERE v.Id_cliente = @Id_cliente
    AND v.Estado = 'Completada';
END;
GO

PRINT '✅ Todos los Stored Procedures de Clientes creados exitosamente';
-------------------------

SELECT * FROM Cliente;

--SP relacionados con CATEGORIA

-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE CATEGORÍAS
-- =============================================
USE FerreteriaCentral;
GO

-- =============================================
-- SP_ObtenerCategorias: Lista categorías con paginación y filtros
-- =============================================
IF OBJECT_ID('SP_ObtenerCategorias', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerCategorias;
GO

CREATE PROCEDURE SP_ObtenerCategorias
    @Limit INT = 50,
    @Offset INT = 0,
    @Nombre VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Consulta principal con estadísticas de productos
    SELECT 
        c.Id_categoria,
        c.Nombre,
        c.Descripcion,
        COUNT(p.Id_Producto) as TotalProductos,
        ISNULL(SUM(p.CantidadActual), 0) as StockTotal,
        MIN(p.PrecioVenta) as PrecioMinimo,
        MAX(p.PrecioVenta) as PrecioMaximo
    FROM Categoria c
    LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
    WHERE 
        (@Nombre IS NULL OR c.Nombre LIKE '%' + @Nombre + '%')
    GROUP BY c.Id_categoria, c.Nombre, c.Descripcion
    ORDER BY c.Nombre ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Categoria c
    WHERE 
        (@Nombre IS NULL OR c.Nombre LIKE '%' + @Nombre + '%');
END;
GO

-- =============================================
-- SP_ObtenerCategoriaPorId: Obtener categoría por ID con estadísticas
-- =============================================
IF OBJECT_ID('SP_ObtenerCategoriaPorId', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerCategoriaPorId;
GO

CREATE PROCEDURE SP_ObtenerCategoriaPorId
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Datos de la categoría con estadísticas de productos
    SELECT 
        c.Id_categoria,
        c.Nombre,
        c.Descripcion,
        COUNT(p.Id_Producto) as TotalProductos,
        ISNULL(SUM(p.CantidadActual), 0) as StockTotal,
        MIN(p.PrecioVenta) as PrecioMinimo,
        MAX(p.PrecioVenta) as PrecioMaximo,
        AVG(p.PrecioVenta) as PrecioPromedio
    FROM Categoria c
    LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
    WHERE c.Id_categoria = @Id
    GROUP BY c.Id_categoria, c.Nombre, c.Descripcion;
END;
GO

-- =============================================
-- SP_CrearCategoria: Crear nueva categoría
-- =============================================
IF OBJECT_ID('SP_CrearCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearCategoria;
GO

CREATE PROCEDURE SP_CrearCategoria
    @Nombre VARCHAR(50),
    @Descripcion VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validaciones
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            RAISERROR('El nombre de la categoría es requerido', 16, 1);
            RETURN;
        END

        IF @Descripcion IS NULL OR LTRIM(RTRIM(@Descripcion)) = ''
        BEGIN
            RAISERROR('La descripción de la categoría es requerida', 16, 1);
            RETURN;
        END

        -- Verificar que no exista otra categoría con el mismo nombre
        IF EXISTS (SELECT 1 FROM Categoria WHERE Nombre = @Nombre)
        BEGIN
            RAISERROR('Ya existe una categoría con ese nombre', 16, 1);
            RETURN;
        END

        -- Insertar categoría
        INSERT INTO Categoria (Nombre, Descripcion)
        VALUES (@Nombre, @Descripcion);

        DECLARE @Id INT = SCOPE_IDENTITY();

        -- Retornar categoría creada
        SELECT * FROM Categoria WHERE Id_categoria = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ActualizarCategoria: Actualizar categoría existente
-- =============================================
IF OBJECT_ID('SP_ActualizarCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_ActualizarCategoria;
GO

CREATE PROCEDURE SP_ActualizarCategoria
    @Id INT,
    @Nombre VARCHAR(50) = NULL,
    @Descripcion VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que la categoría existe
        IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Id_categoria = @Id)
        BEGIN
            RAISERROR('Categoría no encontrada', 16, 1);
            RETURN;
        END

        -- Si se proporciona un nombre, verificar que no esté en uso por otra categoría
        IF @Nombre IS NOT NULL AND @Nombre != ''
        BEGIN
            IF EXISTS (SELECT 1 FROM Categoria WHERE Nombre = @Nombre AND Id_categoria != @Id)
            BEGIN
                RAISERROR('Ya existe otra categoría con ese nombre', 16, 1);
                RETURN;
            END
        END

        -- Actualizar solo los campos proporcionados
        UPDATE Categoria
        SET 
            Nombre = ISNULL(@Nombre, Nombre),
            Descripcion = ISNULL(@Descripcion, Descripcion)
        WHERE Id_categoria = @Id;

        -- Retornar categoría actualizada
        SELECT * FROM Categoria WHERE Id_categoria = @Id;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_EliminarCategoria: Eliminar categoría (solo si no tiene productos)
-- =============================================
IF OBJECT_ID('SP_EliminarCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_EliminarCategoria;
GO

CREATE PROCEDURE SP_EliminarCategoria
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que la categoría existe
        IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Id_categoria = @Id)
        BEGIN
            RAISERROR('Categoría no encontrada', 16, 1);
            RETURN;
        END

        DECLARE @NombreCategoria VARCHAR(50);
        SELECT @NombreCategoria = Nombre FROM Categoria WHERE Id_categoria = @Id;

        -- Verificar si tiene productos asociados
        DECLARE @TotalProductos INT;
        SELECT @TotalProductos = COUNT(*) FROM Producto WHERE Id_categoria = @Id;

        IF @TotalProductos > 0
        BEGIN
            DECLARE @MensajeError NVARCHAR(200);
            SET @MensajeError = 'No se puede eliminar la categoría "' + @NombreCategoria + 
                                '" porque tiene ' + CAST(@TotalProductos AS VARCHAR) + ' producto(s) asociado(s).';
            RAISERROR(@MensajeError, 16, 1);
            RETURN;
        END

        -- Eliminación física
        DECLARE @CategoriaEliminada TABLE (
            Id_categoria INT,
            Nombre VARCHAR(50),
            Descripcion VARCHAR(100)
        );

        DELETE FROM Categoria
        OUTPUT DELETED.Id_categoria, DELETED.Nombre, DELETED.Descripcion
        INTO @CategoriaEliminada
        WHERE Id_categoria = @Id;

        -- Retornar información de categoría eliminada
        SELECT 
            *,
            'ELIMINADO' as Estado,
            'Categoría eliminada exitosamente' as Mensaje
        FROM @CategoriaEliminada;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP_ObtenerProductosCategoria: Obtener productos de una categoría
-- =============================================
IF OBJECT_ID('SP_ObtenerProductosCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerProductosCategoria;
GO

CREATE PROCEDURE SP_ObtenerProductosCategoria
    @Id_categoria INT,
    @Limit INT = 50,
    @Offset INT = 0,
    @Nombre VARCHAR(60) = NULL,
    @StockBajo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Obtener productos de la categoría
    SELECT 
        p.Id_Producto,
        p.Nombre,
        p.Descripcion,
        p.PrecioCompra,
        p.PrecioVenta,
        p.CantidadActual,
        p.CantidadMinima,
        p.CodigoBarra,
        CASE 
            WHEN p.CantidadActual <= 0 THEN 'Sin Stock'
            WHEN p.CantidadActual <= p.CantidadMinima THEN 'Stock Bajo'
            ELSE 'Stock Normal'
        END as EstadoStock
    FROM Producto p
    WHERE 
        p.Id_categoria = @Id_categoria
        AND (@Nombre IS NULL OR p.Nombre LIKE '%' + @Nombre + '%')
        AND (@StockBajo IS NULL OR (@StockBajo = 1 AND p.CantidadActual <= p.CantidadMinima))
    ORDER BY p.Nombre ASC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    -- Total de registros
    SELECT COUNT(*) as Total
    FROM Producto p
    WHERE 
        p.Id_categoria = @Id_categoria
        AND (@Nombre IS NULL OR p.Nombre LIKE '%' + @Nombre + '%')
        AND (@StockBajo IS NULL OR (@StockBajo = 1 AND p.CantidadActual <= p.CantidadMinima));
END;
GO

-- =============================================
-- SP_ObtenerEstadisticasCategoria: Estadísticas de una categoría
-- =============================================
IF OBJECT_ID('SP_ObtenerEstadisticasCategoria', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerEstadisticasCategoria;
GO

CREATE PROCEDURE SP_ObtenerEstadisticasCategoria
    @Id_categoria INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.Id_categoria,
        c.Nombre as CategoriaNombre,
        c.Descripcion,
        COUNT(p.Id_Producto) as TotalProductos,
        ISNULL(SUM(p.CantidadActual), 0) as StockTotal,
        SUM(CASE WHEN p.CantidadActual <= p.CantidadMinima THEN 1 ELSE 0 END) as ProductosStockBajo,
        SUM(CASE WHEN p.CantidadActual <= 0 THEN 1 ELSE 0 END) as ProductosSinStock,
        MIN(p.PrecioVenta) as PrecioMinimo,
        MAX(p.PrecioVenta) as PrecioMaximo,
        AVG(p.PrecioVenta) as PrecioPromedio,
        ISNULL(SUM(p.CantidadActual * p.PrecioCompra), 0) as ValorInventarioCompra,
        ISNULL(SUM(p.CantidadActual * p.PrecioVenta), 0) as ValorInventarioVenta
    FROM Categoria c
    LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
    WHERE c.Id_categoria = @Id_categoria
    GROUP BY c.Id_categoria, c.Nombre, c.Descripcion;
END;
GO

PRINT '✅ Todos los Stored Procedures de Categorías creados exitosamente';
------------------------------------------------------


SELECT 
    c.Id_categoria,
    c.Nombre,
    c.Descripcion,
    COUNT(p.Id_Producto) as TotalProductos
FROM Categoria c
LEFT JOIN Producto p ON c.Id_categoria = p.Id_categoria
GROUP BY c.Id_categoria, c.Nombre, c.Descripcion
ORDER BY c.Nombre;

--SP relacionados con DASHBOARD

-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE DASHBOARD
-- =============================================
USE FerreteriaCentral;
GO

-- =============================================
-- SP_ObtenerResumenDashboard: Resumen general del dashboard
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
-- SP_ObtenerTopProductos: Top productos más vendidos
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
-- SP_ObtenerVentasRecientes: Ventas recientes
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
-- SP_ObtenerVentasPorDia: Ventas por día (últimos N días)
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
-- SP_ObtenerVentasPorCategoria: Ventas por categoría
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
-- SP_ObtenerVentasPorMetodoPago: Ventas por método de pago
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
-- SP_ObtenerTopClientes: Top clientes por compras
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
-- SP_ObtenerRendimientoColaboradores: Rendimiento de colaboradores
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
-- SP_ObtenerAnalisisInventario: Análisis completo de inventario
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
-- SP_ObtenerMovimientosRecientes: Movimientos recientes de inventario
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
-- SP_ObtenerResumenFinanciero: Resumen financiero completo
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
-- SP_ObtenerAlertas: Alertas del sistema
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

PRINT '✅ Todos los Stored Procedures de Dashboard creados exitosamente';
PRINT '📊 Total: 12 Stored Procedures';
-----------------------------------
USE FerreteriaCentral;
GO

-- =============================================
-- CONSULTAS ESENCIALES PARA DASHBOARD
-- =============================================

-- 📊 RESUMEN GENERAL
SELECT 
    COUNT(*) as TotalVentas,
    SUM(TotalVenta) as VentasTotal,
    AVG(TotalVenta) as VentaPromedio
FROM Venta
WHERE Estado = 'Completada';

-- 📅 VENTAS DE HOY
SELECT 
    Id_venta,
    Fecha,
    TotalVenta,
    Estado,
    MetodoPago
FROM Venta
WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY Fecha DESC;

-- 📅 VENTAS DEL MES
SELECT 
    Id_venta,
    Fecha,
    TotalVenta,
    Estado,
    MetodoPago
FROM Venta
WHERE YEAR(Fecha) = YEAR(GETDATE())
AND MONTH(Fecha) = MONTH(GETDATE())
ORDER BY Fecha DESC;

-- 📦 PRODUCTOS CON STOCK BAJO
SELECT 
    Id_producto,
    Nombre,
    CantidadActual,
    CantidadMinima,
    (CantidadMinima - CantidadActual) as Faltante
FROM Producto
WHERE CantidadActual <= CantidadMinima
ORDER BY CantidadActual ASC;

-- 👥 TODOS LOS CLIENTES
SELECT 
    Id_cliente,
    Nombre,
    Apellido1,
    Apellido2,
    Telefono,
    Correo
FROM Cliente
ORDER BY Nombre, Apellido1;

-- 🏠 ALQUILERES ACTIVOS
SELECT 
    Id_alquiler,
    FechaInicio,
    FechaFin,
    TotalAlquiler,
    Estado,
    Id_cliente
FROM Alquiler
WHERE Estado = 'ACTIVO'
ORDER BY FechaFin;

-- ⚠️ ALQUILERES VENCIDOS
SELECT 
    Id_alquiler,
    FechaInicio,
    FechaFin,
    TotalAlquiler,
    Id_cliente,
    DATEDIFF(DAY, FechaFin, GETDATE()) as DiasVencidos
FROM Alquiler
WHERE Estado = 'ACTIVO'
AND FechaFin < GETDATE()
ORDER BY DiasVencidos DESC;

-- 📦 INVENTARIO COMPLETO
SELECT 
    Id_producto,
    Nombre,
    CantidadActual,
    PrecioVenta,
    PrecioCompra,
    Id_categoria
FROM Producto
ORDER BY Nombre;

-- 📊 VENTAS CON CLIENTE Y COLABORADOR
SELECT 
    v.Id_venta,
    v.Fecha,
    v.TotalVenta,
    v.Estado,
    c.Nombre + ' ' + c.Apellido1 as ClienteNombre,
    col.Nombre + ' ' + col.Apellido1 as ColaboradorNombre
FROM Venta v
INNER JOIN Cliente c ON v.Id_cliente = c.Id_cliente
INNER JOIN Colaborador col ON v.Id_colaborador = col.Id_colaborador
ORDER BY v.Fecha DESC;

-- 💳 VENTAS POR MÉTODO DE PAGO
SELECT 
    MetodoPago,
    COUNT(*) as CantidadVentas,
    SUM(TotalVenta) as TotalVentas
FROM Venta
WHERE Estado = 'Completada'
GROUP BY MetodoPago
ORDER BY TotalVentas DESC;

--SP relacionados con REPORTES

-- =============================================
-- Stored Procedures para Módulo de REPORTES
-- Descripción: 6 procedimientos para generación de reportes de negocio
-- Fecha: 2025-11-05
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP 1: Reporte de Ventas por Período
-- Retorna: 2 resultsets (ventas detalladas + resumen)
-- =============================================
IF OBJECT_ID('SP_ReporteVentas', 'P') IS NOT NULL
    DROP PROCEDURE SP_ReporteVentas;
GO

CREATE PROCEDURE SP_ReporteVentas
    @FechaInicio DATETIME,
    @FechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Resultset 1: Ventas detalladas
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
    WHERE v.Fecha BETWEEN @FechaInicio AND @FechaFin
    GROUP BY v.Id_venta, v.Fecha, v.TotalVenta, v.MetodoPago, v.Estado,
             c.Nombre, c.Apellido1, c.Apellido2, col.Nombre, col.Apellido1
    ORDER BY v.Fecha DESC;
    
    -- Resultset 2: Resumen del período
    SELECT 
        COUNT(*) as TotalVentas,
        SUM(TotalVenta) as TotalIngresos,
        AVG(TotalVenta) as PromedioVenta,
        MAX(TotalVenta) as VentaMaxima,
        MIN(TotalVenta) as VentaMinima
    FROM Venta
    WHERE Fecha BETWEEN @FechaInicio AND @FechaFin
    AND Estado = 'Completada';
END;
GO

-- =============================================
-- SP 2: Reporte de Inventario
-- Retorna: 2 resultsets (productos detallados + resumen)
-- =============================================
IF OBJECT_ID('SP_ReporteInventario', 'P') IS NOT NULL
    DROP PROCEDURE SP_ReporteInventario;
GO

CREATE PROCEDURE SP_ReporteInventario
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Resultset 1: Productos con estado
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
    ORDER BY c.Nombre, p.Nombre;
    
    -- Resultset 2: Resumen del inventario
    SELECT 
        COUNT(*) as TotalProductos,
        SUM(CantidadActual) as UnidadesTotales,
        SUM(CantidadActual * PrecioVenta) as ValorTotalInventario,
        COUNT(CASE WHEN CantidadActual = 0 THEN 1 END) as ProductosAgotados,
        COUNT(CASE WHEN CantidadActual <= CantidadMinima THEN 1 END) as ProductosStockBajo
    FROM Producto;
END;
GO

-- =============================================
-- SP 3: Reporte de Clientes
-- Retorna: 1 resultset (clientes con estadísticas de compra)
-- =============================================
IF OBJECT_ID('SP_ReporteClientes', 'P') IS NOT NULL
    DROP PROCEDURE SP_ReporteClientes;
GO

CREATE PROCEDURE SP_ReporteClientes
AS
BEGIN
    SET NOCOUNT ON;
    
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
    ORDER BY TotalGastado DESC;
END;
GO

-- =============================================
-- SP 4: Reporte de Productos Más Vendidos
-- Retorna: 1 resultset (top productos por unidades vendidas)
-- =============================================
IF OBJECT_ID('SP_ReporteProductosMasVendidos', 'P') IS NOT NULL
    DROP PROCEDURE SP_ReporteProductosMasVendidos;
GO

CREATE PROCEDURE SP_ReporteProductosMasVendidos
    @FechaInicio DATETIME,
    @FechaFin DATETIME,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
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
    WHERE v.Fecha BETWEEN @FechaInicio AND @FechaFin
    AND v.Estado = 'Completada'
    GROUP BY p.Id_Producto, p.Nombre, p.PrecioVenta, c.Nombre
    ORDER BY UnidadesVendidas DESC;
END;
GO

-- =============================================
-- SP 5: Reporte de Compras a Proveedores
-- Retorna: 2 resultsets (compras detalladas + resumen)
-- =============================================
IF OBJECT_ID('SP_ReporteCompras', 'P') IS NOT NULL
    DROP PROCEDURE SP_ReporteCompras;
GO

CREATE PROCEDURE SP_ReporteCompras
    @FechaInicio DATETIME,
    @FechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Resultset 1: Compras detalladas
    SELECT 
        c.Id_compra,
        c.FechaCompra as Fecha,
        c.TotalCompra as Total,
        dc.CantidadCompra as Cantidad,
        dc.PrecioUnitario,
        p.Nombre as Producto,
        prov.Nombre as Proveedor,
        c.NumeroFactura
    FROM Compra c
    INNER JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    INNER JOIN Producto p ON dc.Id_producto = p.Id_Producto
    INNER JOIN Proveedor prov ON c.Id_proveedor = prov.Id_proveedor
    WHERE c.FechaCompra BETWEEN @FechaInicio AND @FechaFin
    ORDER BY c.FechaCompra DESC;
    
    -- Resultset 2: Resumen del período
    SELECT 
        COUNT(DISTINCT c.Id_compra) as TotalCompras,
        SUM(c.TotalCompra) as TotalGastado,
        SUM(dc.CantidadCompra) as UnidadesCompradas,
        AVG(c.TotalCompra) as PromedioCompra
    FROM Compra c
    INNER JOIN DetalleCompra dc ON c.Id_compra = dc.Id_compra
    WHERE c.FechaCompra BETWEEN @FechaInicio AND @FechaFin;
END;
GO

-- =============================================
-- SP 6: Reporte de Alquileres
-- Retorna: 2 resultsets (alquileres detallados + resumen)
-- =============================================
IF OBJECT_ID('SP_ReporteAlquileres', 'P') IS NOT NULL
    DROP PROCEDURE SP_ReporteAlquileres;
GO

CREATE PROCEDURE SP_ReporteAlquileres
    @FechaInicio DATETIME,
    @FechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Resultset 1: Alquileres detallados
    SELECT 
        a.Id_alquiler,
        a.FechaInicio,
        a.FechaFin,
        a.TotalAlquiler,
        a.Estado,
        p.Nombre as Producto,
        da.CantidadDetalleAlquiler as Cantidad,
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
    WHERE a.FechaInicio BETWEEN @FechaInicio AND @FechaFin
    ORDER BY a.FechaInicio DESC;
    
    -- Resultset 2: Resumen del período
    SELECT 
        COUNT(*) as TotalAlquileres,
        SUM(TotalAlquiler) as TotalIngresos,
        AVG(TotalAlquiler) as PromedioAlquiler,
        SUM(CASE WHEN Estado = 'Activo' THEN 1 ELSE 0 END) as Activos,
        SUM(CASE WHEN Estado = 'Finalizado' THEN 1 ELSE 0 END) as Finalizados
    FROM Alquiler
    WHERE FechaInicio BETWEEN @FechaInicio AND @FechaFin;
END;
GO

-- =============================================
-- Verificación de creación de SPs
-- =============================================
PRINT '==========================================';
PRINT 'Stored Procedures de REPORTE creados:';
PRINT '==========================================';
SELECT 
    name AS 'Stored Procedure',
    create_date AS 'Fecha Creación'
FROM sys.procedures
WHERE name LIKE 'SP_Reporte%'
ORDER BY name;
PRINT '==========================================';
PRINT 'Total: 6 Stored Procedures';
PRINT '==========================================';
