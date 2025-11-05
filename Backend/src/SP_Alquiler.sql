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