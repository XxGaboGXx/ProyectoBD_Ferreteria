-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE COMPRAS
-- Base de Datos: FerreteriaCentral
-- Fecha: 2025-11-05
-- Total SPs: 6
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP 1: Crear Compra
-- Descripción: Crea un nuevo registro de compra a proveedor
-- Parámetros: 
--   @Id_proveedor: ID del proveedor
--   @FechaCompra: Fecha de la compra
--   @TotalCompra: Monto total de la compra
--   @NumeroFactura: Número de factura (opcional)
-- Retorna: Registro completo de la compra creada
-- Notas: Valida existencia del proveedor antes de insertar
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
-- SP 2: Crear Detalle Compra
-- Descripción: Crea detalle de compra y aumenta stock del producto
-- Parámetros: 
--   @Id_compra: ID de la compra padre
--   @Id_producto: ID del producto comprado
--   @CantidadCompra: Cantidad de unidades compradas
--   @NumeroLinea: Número de línea en la factura
--   @PrecioUnitario: Precio unitario de compra
--   @Subtotal: Subtotal de la línea (precio * cantidad)
-- Retorna: Registro completo del detalle creado
-- Notas: 
--   - Aumenta automáticamente el stock del producto
--   - Actualiza precio de compra y fecha de entrada
--   - Registra movimiento en bitácora
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
-- SP 3: Obtener Todas las Compras
-- Descripción: Obtiene compras con paginación y filtros
-- Parámetros: 
--   @Limit: Número máximo de registros a retornar (default: 50)
--   @Offset: Número de registros a saltar para paginación (default: 0)
--   @Id_proveedor: Filtro por proveedor específico (opcional)
--   @FechaInicio: Filtro desde fecha (opcional)
--   @FechaFin: Filtro hasta fecha (opcional)
-- Retorna: 2 resultsets (datos paginados + total de registros)
-- Notas: Incluye información del proveedor y conteo de productos
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
-- SP 4: Obtener Compra por ID
-- Descripción: Obtiene una compra específica con sus detalles
-- Parámetros: @Id (ID de la compra)
-- Retorna: 2 resultsets (maestro + detalles con productos)
-- Notas: Incluye información completa del proveedor y categorías
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
-- SP 5: Obtener Estadísticas de Compras
-- Descripción: Obtiene estadísticas generales de compras
-- Parámetros: 
--   @FechaInicio: Fecha inicial del rango (opcional)
--   @FechaFin: Fecha final del rango (opcional)
-- Retorna: 1 resultset con estadísticas agregadas
-- Notas: 
--   - Calcula totales, promedios, máximos y mínimos
--   - Cuenta proveedores únicos con los que se ha trabajado
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
-- SP 6: Obtener Productos Más Comprados
-- Descripción: Obtiene ranking de productos más comprados
-- Parámetros: 
--   @Limit: Número de productos a retornar (default: 10)
--   @FechaInicio: Fecha inicial del rango (opcional)
--   @FechaFin: Fecha final del rango (opcional)
-- Retorna: 1 resultset con productos ordenados por total comprado
-- Notas: 
--   - Incluye total comprado, número de compras y monto invertido
--   - Calcula precio promedio de compra
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
-- Verificación de creación de SPs
-- =============================================
PRINT '==========================================';
PRINT 'Stored Procedures de COMPRAS creados:';
PRINT '==========================================';
SELECT 
    name AS 'Stored Procedure',
    create_date AS 'Fecha Creación'
FROM sys.procedures
WHERE name LIKE 'SP_%Compra%' OR name LIKE 'SP_Crear%Compra%' OR name LIKE 'SP_Obtener%Compra%'
ORDER BY name;
PRINT '==========================================';
PRINT 'Total: 6 Stored Procedures';
PRINT '==========================================';
