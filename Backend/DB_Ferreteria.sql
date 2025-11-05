USE master;
GO

DROP DATABASE IF EXISTS FerreteriaCentral;
GO

CREATE DATABASE FerreteriaCentral
ON PRIMARY
(
    NAME = 'FerreteriaCentral_Data',
    FILENAME = 'C:\SQLData\FerreteriaCentral_Data.mdf',
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
);
GO

USE [FerreteriaCentral];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE [dbo].[Alquiler](
	[Id_alquiler] [int] IDENTITY(1,1) NOT NULL,
	[FechaInicio] [datetime] NOT NULL,
	[FechaFin] [datetime] NULL,
	[Estado] [varchar](50) NOT NULL,
	[TotalAlquiler] [decimal](10, 2) NOT NULL,
	[Id_cliente] [int] NOT NULL,
	[Id_colaborador] [int] NOT NULL,
	[Multa] [decimal](10, 2) NULL,
	[MotivoCancelacion] [varchar](255) NULL,
	[FechaCancelacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_alquiler] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[BitacoraProducto](
	[Id_bitacora] [int] IDENTITY(1,1) NOT NULL,
	[Fecha] [datetime] NOT NULL,
	[Hora] [datetime] NOT NULL,
	[TablaAfectada] [varchar](50) NOT NULL,
	[Accion] [varchar](50) NOT NULL,
	[Descripcion] [varchar](255) NULL,
	[Id_producto] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_bitacora] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Categoria](
	[Id_categoria] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [varchar](50) NOT NULL,
	[Descripcion] [varchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_categoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Cliente](
	[Id_cliente] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [varchar](20) NOT NULL,
	[Apellido1] [varchar](20) NOT NULL,
	[Apellido2] [varchar](20) NULL,
	[Telefono] [varchar](20) NULL,
	[Direccion] [varchar](255) NULL,
	[Correo] [varchar](100) NULL,
	[Activo] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_cliente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Colaborador](
	[Id_colaborador] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [varchar](20) NOT NULL,
	[Apellido1] [varchar](20) NOT NULL,
	[Apellido2] [varchar](20) NULL,
	[Telefono] [varchar](20) NULL,
	[Direccion] [varchar](255) NULL,
	[CorreoElectronico] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_colaborador] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Compra](
	[Id_compra] [int] IDENTITY(1,1) NOT NULL,
	[FechaCompra] [datetime] NOT NULL,
	[TotalCompra] [decimal](12, 2) NOT NULL,
	[NumeroFactura] [varchar](50) NULL,
	[Id_proveedor] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_compra] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[DetalleAlquiler](
	[Id_detalleAlquiler] [int] IDENTITY(1,1) NOT NULL,
	[CantidadDetalleAlquiler] [int] NOT NULL,
	[DiasAlquilados] [decimal](10, 2) NOT NULL,
	[Subtotal] [decimal](10, 2) NOT NULL,
	[TarifaDiaria] [decimal](10, 2) NOT NULL,
	[Deposito] [decimal](10, 2) NULL,
	[Id_alquiler] [int] NOT NULL,
	[Id_producto] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_detalleAlquiler] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[DetalleCompra](
	[Id_detalleCompra] [int] IDENTITY(1,1) NOT NULL,
	[CantidadCompra] [int] NOT NULL,
	[NumeroLinea] [int] NOT NULL,
	[PrecioUnitario] [decimal](12, 2) NOT NULL,
	[Subtotal] [decimal](12, 2) NULL,
	[Id_compra] [int] NOT NULL,
	[Id_producto] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_detalleCompra] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[DetalleMovimiento](
	[Id_detalleMovimiento] [int] IDENTITY(1,1) NOT NULL,
	[Descripcion] [varchar](255) NULL,
	[Cantidad] [int] NOT NULL,
	[Id_tipoDetalleMovimiento] [int] NOT NULL,
	[Id_movimiento] [int] NOT NULL,
	[Id_producto] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_detalleMovimiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[DetalleVenta](
	[Id_detalleVenta] [int] IDENTITY(1,1) NOT NULL,
	[CantidadVenta] [int] NOT NULL,
	[NumeroLinea] [int] NOT NULL,
	[PrecioUnitario] [decimal](10, 2) NOT NULL,
	[Subtotal] [decimal](10, 2) NOT NULL,
	[Id_venta] [int] NOT NULL,
	[Id_producto] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_detalleVenta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Movimiento](
	[Id_movimiento] [int] IDENTITY(1,1) NOT NULL,
	[Fecha] [datetime] NOT NULL,
	[Responsable] [varchar](100) NULL,
	[Id_colaborador] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_movimiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Producto](
	[Id_Producto] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [varchar](20) NOT NULL,
	[Descripcion] [varchar](100) NOT NULL,
	[PrecioCompra] [decimal](12, 2) NOT NULL,
	[PrecioVenta] [decimal](12, 2) NOT NULL,
	[CodigoBarra] [varchar](50) NULL,
	[CantidadActual] [int] NOT NULL,
	[CantidadMinima] [int] NOT NULL,
	[FechaEntrada] [datetime] NOT NULL,
	[FechaSalida] [datetime] NULL,
	[Id_categoria] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_Producto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Proveedor](
	[Id_proveedor] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [varchar](20) NOT NULL,
	[Telefono] [varchar](20) NULL,
	[Direccion] [varchar](255) NULL,
	[Correo_electronico] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_proveedor] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[TipoCliente](
	[Id_tipoCliente] [int] IDENTITY(1,1) NOT NULL,
	[LineaCredito] [decimal](12, 2) NOT NULL,
	[LimiteCredito] [decimal](12, 2) NOT NULL,
	[DescuentoEspecial] [decimal](5, 2) NULL,
	[Id_cliente] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_tipoCliente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[TipoDetalleMovimiento](
	[Id_tipoDetalleMovimiento] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [varchar](20) NOT NULL,
	[Nombre] [varchar](100) NOT NULL,
	[Descripcion] [varchar](255) NULL,
	[TipoOperacion] [varchar](20) NOT NULL,
	[RequiereAprobacion] [bit] NOT NULL,
	[Activo] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_tipoDetalleMovimiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Codigo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Venta](
	[Id_venta] [int] IDENTITY(1,1) NOT NULL,
	[Fecha] [datetime] NOT NULL,
	[TotalVenta] [decimal](12, 2) NOT NULL,
	[MetodoPago] [varchar](20) NOT NULL,
	[Estado] [varchar](20) NOT NULL,
	[Id_cliente] [int] NOT NULL,
	[Id_colaborador] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_venta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY];
GO

-- DEFAULTS
ALTER TABLE [dbo].[Alquiler] ADD DEFAULT ('Pendiente') FOR [Estado];
GO
ALTER TABLE [dbo].[BitacoraProducto] ADD DEFAULT (getdate()) FOR [Fecha];
GO
ALTER TABLE [dbo].[BitacoraProducto] ADD DEFAULT (getdate()) FOR [Hora];
GO
ALTER TABLE [dbo].[Cliente] ADD DEFAULT ((1)) FOR [Activo];
GO
ALTER TABLE [dbo].[Compra] ADD DEFAULT (getdate()) FOR [FechaCompra];
GO
ALTER TABLE [dbo].[Producto] ADD DEFAULT (getdate()) FOR [FechaEntrada];
GO
ALTER TABLE [dbo].[TipoDetalleMovimiento] ADD DEFAULT ((0)) FOR [RequiereAprobacion];
GO
ALTER TABLE [dbo].[TipoDetalleMovimiento] ADD DEFAULT ((1)) FOR [Activo];
GO
ALTER TABLE [dbo].[Venta] ADD DEFAULT (getdate()) FOR [Fecha];
GO
ALTER TABLE [dbo].[Venta] ADD DEFAULT ('Completada') FOR [Estado];
GO

-- FOREIGN KEYS
ALTER TABLE [dbo].[Alquiler] WITH CHECK ADD CONSTRAINT [FK_Alquiler_Cliente] FOREIGN KEY([Id_cliente]) REFERENCES [dbo].[Cliente] ([Id_cliente]);
ALTER TABLE [dbo].[Alquiler] CHECK CONSTRAINT [FK_Alquiler_Cliente];
GO
ALTER TABLE [dbo].[Alquiler] WITH CHECK ADD CONSTRAINT [FK_Alquiler_Empleado] FOREIGN KEY([Id_colaborador]) REFERENCES [dbo].[Colaborador] ([Id_colaborador]);
ALTER TABLE [dbo].[Alquiler] CHECK CONSTRAINT [FK_Alquiler_Empleado];
GO
ALTER TABLE [dbo].[BitacoraProducto] WITH CHECK ADD CONSTRAINT [FK_Bitacora_Producto] FOREIGN KEY([Id_producto]) REFERENCES [dbo].[Producto] ([Id_Producto]);
ALTER TABLE [dbo].[BitacoraProducto] CHECK CONSTRAINT [FK_Bitacora_Producto];
GO
ALTER TABLE [dbo].[Compra] WITH CHECK ADD CONSTRAINT [FK_Compra_Proveedor] FOREIGN KEY([Id_proveedor]) REFERENCES [dbo].[Proveedor] ([Id_proveedor]);
ALTER TABLE [dbo].[Compra] CHECK CONSTRAINT [FK_Compra_Proveedor];
GO
ALTER TABLE [dbo].[DetalleAlquiler] WITH CHECK ADD CONSTRAINT [FK_DetalleAlquiler_Alquiler] FOREIGN KEY([Id_alquiler]) REFERENCES [dbo].[Alquiler] ([Id_alquiler]);
ALTER TABLE [dbo].[DetalleAlquiler] CHECK CONSTRAINT [FK_DetalleAlquiler_Alquiler];
GO
ALTER TABLE [dbo].[DetalleAlquiler] WITH CHECK ADD CONSTRAINT [FK_DetalleAlquiler_Producto] FOREIGN KEY([Id_producto]) REFERENCES [dbo].[Producto] ([Id_Producto]);
ALTER TABLE [dbo].[DetalleAlquiler] CHECK CONSTRAINT [FK_DetalleAlquiler_Producto];
GO
ALTER TABLE [dbo].[DetalleCompra] WITH CHECK ADD CONSTRAINT [FK_DetalleCompra_Compra] FOREIGN KEY([Id_compra]) REFERENCES [dbo].[Compra] ([Id_compra]);
ALTER TABLE [dbo].[DetalleCompra] CHECK CONSTRAINT [FK_DetalleCompra_Compra];
GO
ALTER TABLE [dbo].[DetalleCompra] WITH CHECK ADD CONSTRAINT [FK_DetalleCompra_Producto] FOREIGN KEY([Id_producto]) REFERENCES [dbo].[Producto] ([Id_Producto]);
ALTER TABLE [dbo].[DetalleCompra] CHECK CONSTRAINT [FK_DetalleCompra_Producto];
GO
ALTER TABLE [dbo].[DetalleMovimiento] WITH CHECK ADD CONSTRAINT [FK_DetalleMovimiento_Movimiento] FOREIGN KEY([Id_movimiento]) REFERENCES [dbo].[Movimiento] ([Id_movimiento]);
ALTER TABLE [dbo].[DetalleMovimiento] CHECK CONSTRAINT [FK_DetalleMovimiento_Movimiento];
GO
ALTER TABLE [dbo].[DetalleMovimiento] WITH CHECK ADD CONSTRAINT [FK_DetalleMovimiento_Producto] FOREIGN KEY([Id_producto]) REFERENCES [dbo].[Producto] ([Id_Producto]);
ALTER TABLE [dbo].[DetalleMovimiento] CHECK CONSTRAINT [FK_DetalleMovimiento_Producto];
GO
ALTER TABLE [dbo].[DetalleMovimiento] WITH CHECK ADD CONSTRAINT [FK_DetalleMovimiento_TipoDetalle] FOREIGN KEY([Id_tipoDetalleMovimiento]) REFERENCES [dbo].[TipoDetalleMovimiento] ([Id_tipoDetalleMovimiento]);
ALTER TABLE [dbo].[DetalleMovimiento] CHECK CONSTRAINT [FK_DetalleMovimiento_TipoDetalle];
GO
ALTER TABLE [dbo].[DetalleVenta] WITH CHECK ADD CONSTRAINT [FK_DetalleVenta_Producto] FOREIGN KEY([Id_producto]) REFERENCES [dbo].[Producto] ([Id_Producto]);
ALTER TABLE [dbo].[DetalleVenta] CHECK CONSTRAINT [FK_DetalleVenta_Producto];
GO
ALTER TABLE [dbo].[DetalleVenta] WITH CHECK ADD CONSTRAINT [FK_DetalleVenta_Venta] FOREIGN KEY([Id_venta]) REFERENCES [dbo].[Venta] ([Id_venta]);
ALTER TABLE [dbo].[DetalleVenta] CHECK CONSTRAINT [FK_DetalleVenta_Venta];
GO
ALTER TABLE [dbo].[Movimiento] WITH CHECK ADD CONSTRAINT [FK_Movimiento_Colaborador] FOREIGN KEY([Id_colaborador]) REFERENCES [dbo].[Colaborador] ([Id_colaborador]);
ALTER TABLE [dbo].[Movimiento] CHECK CONSTRAINT [FK_Movimiento_Colaborador];
GO
ALTER TABLE [dbo].[Producto] WITH CHECK ADD CONSTRAINT [FK_Producto_Categoria] FOREIGN KEY([Id_categoria]) REFERENCES [dbo].[Categoria] ([Id_categoria]);
ALTER TABLE [dbo].[Producto] CHECK CONSTRAINT [FK_Producto_Categoria];
GO
ALTER TABLE [dbo].[TipoCliente] WITH CHECK ADD CONSTRAINT [FK_Contratista_Cliente] FOREIGN KEY([Id_cliente]) REFERENCES [dbo].[Cliente] ([Id_cliente]);
ALTER TABLE [dbo].[TipoCliente] CHECK CONSTRAINT [FK_Contratista_Cliente];
GO
ALTER TABLE [dbo].[Venta] WITH CHECK ADD CONSTRAINT [FK_Venta_Cliente] FOREIGN KEY([Id_cliente]) REFERENCES [dbo].[Cliente] ([Id_cliente]);
ALTER TABLE [dbo].[Venta] CHECK CONSTRAINT [FK_Venta_Cliente];
GO
ALTER TABLE [dbo].[Venta] WITH CHECK ADD CONSTRAINT [FK_Venta_Colaborador] FOREIGN KEY([Id_colaborador]) REFERENCES [dbo].[Colaborador] ([Id_colaborador]);
ALTER TABLE [dbo].[Venta] CHECK CONSTRAINT [FK_Venta_Colaborador];
GO