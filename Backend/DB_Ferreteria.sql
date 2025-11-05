USE master;
GO


Drop database FerreteriaCentral;



CREATE DATABASE FerreteriaCentral
ON PRIMARY
(
    NAME = 'FerreteriaCentral_Data',ru
    SIZE = 4GB,
    MAXSIZE = 7GB,
    FILEGROWTH = 1GB
)
LOG ON
(
    NAME = 'FerreteriaCentral_Log',
    FILENAME = 'C:\SQLData\FerreteriaCentral_Log.ldf',
    SIZE = 800MB,
    MAXSIZE = 3GB,
    FILEGROWTH = 200MB
)
GO

USE FerreteriaCentral;




CREATE TABLE Categoria (
    Id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Proveedor (
    Id_proveedor INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Telefono VARCHAR(20) NULL, 
    Direccion VARCHAR(255) NULL, 
    Correo_electronico VARCHAR(100) NULL 
);

CREATE TABLE Cliente (
    Id_cliente INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Apellido1 VARCHAR(20) NOT NULL,
    Apellido2 VARCHAR(20) NULL,
    Telefono VARCHAR(20) NULL,
    Direccion VARCHAR(255) NULL,
    Correo VARCHAR(100) NULL
);

CREATE TABLE Colaborador (
    Id_colaborador INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Apellido1 VARCHAR(20) NOT NULL,
    Apellido2 VARCHAR(20) NULL,  
    Telefono VARCHAR(20) NULL,   
    Direccion VARCHAR(255) NULL, 
    CorreoElectronico VARCHAR(100) NULL 
);

CREATE TABLE TipoDetalleMovimiento (
    Id_tipoDetalleMovimiento INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL UNIQUE,           
    Nombre VARCHAR(100) NOT NULL,                 
    Descripcion VARCHAR(255) NULL,                      
    TipoOperacion VARCHAR(20) NOT NULL,           
    RequiereAprobacion BIT NOT NULL DEFAULT 0,    
    Activo BIT NOT NULL DEFAULT 1                 
);

CREATE TABLE TipoCliente (
    Id_tipoCliente INT IDENTITY(1,1) PRIMARY KEY,
    LineaCredito DECIMAL(12,2) NOT NULL,
    LimiteCredito DECIMAL(12,2) NOT NULL,
    DescuentoEspecial DECIMAL(5,2) NULL,  
    Id_cliente INT NOT NULL,
    
    CONSTRAINT FK_Contratista_Cliente FOREIGN KEY (Id_cliente)
        REFERENCES Cliente(Id_cliente)
);
---------------------------------------------
CREATE TABLE Producto (
    Id_Producto INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Descripcion VARCHAR(100) NOT NULL,
    PrecioCompra DECIMAL(12,2) NOT NULL,
    PrecioVenta DECIMAL(12,2) NOT NULL,
    CodigoBarra VARCHAR(50) NULL,
    CantidadActual INT NOT NULL,
    CantidadMinima INT NOT NULL,
    FechaEntrada DATETIME NOT NULL DEFAULT GETDATE(),
    FechaSalida DATETIME NULL,
    Id_categoria INT NOT NULL,

    CONSTRAINT FK_Producto_Categoria FOREIGN KEY (Id_categoria)
        REFERENCES Categoria(Id_categoria)
);

CREATE TABLE BitacoraProducto (
    Id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
    Fecha DATETIME NOT NULL DEFAULT GETDATE(),
    Hora DATETIME NOT NULL DEFAULT GETDATE(),
    TablaAfectada VARCHAR(50) NOT NULL,
    Accion VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(255) NULL,
    DatosAnteriores TEXT NULL,
    DatosNuevos TEXT NULL,
    Id_producto INT NOT NULL,

    CONSTRAINT FK_BitacoraProducto_Producto FOREIGN KEY (Id_producto)
        REFERENCES Producto(Id_producto)
);

CREATE TABLE Compra (
    Id_compra INT IDENTITY(1,1) PRIMARY KEY,
    FechaCompra DATETIME NOT NULL DEFAULT GETDATE(),
    TotalCompra DECIMAL(12,2) NOT NULL,
    NumeroFactura VARCHAR(50) NULL, 
    Id_proveedor INT NOT NULL,

    CONSTRAINT FK_Compra_Proveedor FOREIGN KEY (Id_proveedor)
        REFERENCES Proveedor(Id_proveedor)
);

CREATE TABLE DetalleCompra (
    Id_detalleCompra INT IDENTITY(1,1) PRIMARY KEY,
    CantidadCompra INT NOT NULL,
    NumeroLinea INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NULL, 
    Id_compra INT NOT NULL,
    Id_producto INT NOT NULL,

    CONSTRAINT FK_DetalleCompra_Compra FOREIGN KEY (Id_compra)
        REFERENCES Compra(Id_compra),

    CONSTRAINT FK_DetalleCompra_Producto FOREIGN KEY (Id_producto)
        REFERENCES Producto(Id_producto)
);

CREATE TABLE Movimiento (
    Id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    Fecha DATETIME NOT NULL,
    Responsable VARCHAR(100) NULL, 
    Id_colaborador INT NOT NULL,

    CONSTRAINT FK_Movimiento_Colaborador FOREIGN KEY (Id_colaborador)
        REFERENCES Colaborador(Id_colaborador)
);

CREATE TABLE DetalleMovimiento (
    Id_detalleMovimiento INT IDENTITY(1,1) PRIMARY KEY,
    Descripcion VARCHAR(255) NULL,
    Cantidad INT NOT NULL,
    Id_tipoDetalleMovimiento INT NOT NULL,
    Id_movimiento INT NOT NULL,
    Id_producto INT NOT NULL,

    CONSTRAINT FK_DetalleMovimiento_TipoDetalle 
        FOREIGN KEY (Id_tipoDetalleMovimiento)
        REFERENCES TipoDetalleMovimiento(Id_tipoDetalleMovimiento),

    CONSTRAINT FK_DetalleMovimiento_Movimiento 
        FOREIGN KEY (Id_movimiento)
        REFERENCES Movimiento(Id_movimiento),

    CONSTRAINT FK_DetalleMovimiento_Producto 
        FOREIGN KEY (Id_producto)
        REFERENCES Producto(Id_producto)
);

CREATE TABLE Alquiler (
    Id_alquiler INT IDENTITY(1,1) PRIMARY KEY,
    FechaInicio DATETIME NOT NULL,
    FechaFin DATETIME NULL, 
    Estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente', 
    TotalAlquiler DECIMAL(10,2) NOT NULL,
    Id_cliente INT NOT NULL,
    Id_colaborador INT NOT NULL,

    CONSTRAINT FK_Alquiler_Cliente FOREIGN KEY (Id_cliente)
        REFERENCES Cliente(Id_cliente),

    CONSTRAINT FK_Alquiler_Empleado FOREIGN KEY (Id_colaborador)
        REFERENCES Colaborador(Id_colaborador)
);

CREATE TABLE DetalleAlquiler (
    Id_detalleAlquiler INT IDENTITY(1,1) PRIMARY KEY,
    CantidadDetalleAlquiler INT NOT NULL,
    DiasAlquilados DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    TarifaDiaria DECIMAL(10,2) NOT NULL,
    Deposito DECIMAL(10,2) NULL, 
    Id_alquiler INT NOT NULL,
    Id_producto INT NOT NULL,

    CONSTRAINT FK_DetalleAlquiler_Alquiler FOREIGN KEY (Id_alquiler)
        REFERENCES Alquiler(Id_alquiler),

    CONSTRAINT FK_DetalleAlquiler_Producto FOREIGN KEY (Id_producto)
        REFERENCES Producto(Id_producto)
);

CREATE TABLE Venta (
    Id_venta INT IDENTITY(1,1) PRIMARY KEY,
    Fecha DATETIME NOT NULL DEFAULT GETDATE(),
    TotalVenta DECIMAL(12,2) NOT NULL,
    MetodoPago VARCHAR(20) NOT NULL,
    Estado VARCHAR(20) NOT NULL DEFAULT 'Completada',
    Id_cliente INT NOT NULL,
    Id_colaborador INT NOT NULL,

    CONSTRAINT FK_Venta_Cliente FOREIGN KEY (Id_cliente)
        REFERENCES Cliente(Id_cliente),

    CONSTRAINT FK_Venta_Colaborador FOREIGN KEY (Id_colaborador)
        REFERENCES Colaborador(Id_colaborador)
);

CREATE TABLE DetalleVenta (
    Id_detalleVenta INT IDENTITY(1,1) PRIMARY KEY,
    CantidadVenta INT NOT NULL,
    NumeroLinea INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    Id_venta INT NOT NULL,
    Id_producto INT NOT NULL,

    CONSTRAINT FK_DetalleVenta_Venta FOREIGN KEY (Id_venta)
        REFERENCES Venta(Id_venta),

    CONSTRAINT FK_DetalleVenta_Producto FOREIGN KEY (Id_producto)
        REFERENCES Producto(Id_producto)
);

