const { getConnection, sql } = require('../config/database');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

class DatabaseSeeder {
    constructor() {
        this.pool = null;
    }

    async connect() {
        this.pool = await getConnection();
        console.log(`${colors.green}✅ Conectado a la base de datos${colors.reset}\n`);
    }

    async clearDatabase() {
        console.log(`${colors.yellow}🗑️  Limpiando base de datos...${colors.reset}`);
        
        try {
            // Orden correcto para eliminar por dependencias
            await this.pool.request().query('DELETE FROM DetalleAlquiler');
            await this.pool.request().query('DELETE FROM Alquiler');
            await this.pool.request().query('DELETE FROM DetalleVenta');
            await this.pool.request().query('DELETE FROM Venta');
            await this.pool.request().query('DELETE FROM DetalleCompra');
            await this.pool.request().query('DELETE FROM Compra');
            await this.pool.request().query('DELETE FROM DetalleMovimiento');
            await this.pool.request().query('DELETE FROM Movimiento');
            await this.pool.request().query('DELETE FROM BitacoraProducto');
            await this.pool.request().query('DELETE FROM Producto');
            await this.pool.request().query('DELETE FROM TipoCliente');
            await this.pool.request().query('DELETE FROM Categoria');
            await this.pool.request().query('DELETE FROM Cliente');
            await this.pool.request().query('DELETE FROM Proveedor');
            await this.pool.request().query('DELETE FROM Colaborador');
            await this.pool.request().query('DELETE FROM TipoDetalleMovimiento');
            
            // Resetear IDs
            await this.pool.request().query('DBCC CHECKIDENT (DetalleAlquiler, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Alquiler, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (DetalleVenta, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Venta, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (DetalleCompra, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Compra, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (DetalleMovimiento, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Movimiento, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (BitacoraProducto, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Producto, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (TipoCliente, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Categoria, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Cliente, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Proveedor, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (Colaborador, RESEED, 0)');
            await this.pool.request().query('DBCC CHECKIDENT (TipoDetalleMovimiento, RESEED, 0)');
            
            console.log(`${colors.green}✅ Base de datos limpiada${colors.reset}\n`);
        } catch (error) {
            console.error(`${colors.red}❌ Error limpiando BD:${colors.reset}`, error.message);
        }
    }

    async seedTipoMovimientos() {
        console.log(`${colors.cyan}📦 Insertando Tipos de Movimiento...${colors.reset}`);
        
        const tipos = [
            { 
                Codigo: 'ENTRADA', 
                Nombre: 'Entrada de Inventario',
                Descripcion: 'Ingreso de productos al inventario',
                TipoOperacion: 'Ingreso',
                RequiereAprobacion: 0,
                Activo: 1
            },
            { 
                Codigo: 'SALIDA', 
                Nombre: 'Salida de Inventario',
                Descripcion: 'Salida de productos del inventario',
                TipoOperacion: 'Egreso',
                RequiereAprobacion: 0,
                Activo: 1
            },
            { 
                Codigo: 'AJUSTE', 
                Nombre: 'Ajuste de Inventario',
                Descripcion: 'Ajuste manual de inventario',
                TipoOperacion: 'Ajuste',
                RequiereAprobacion: 1,
                Activo: 1
            },
            { 
                Codigo: 'DEVOLUCION', 
                Nombre: 'Devolución',
                Descripcion: 'Devolución de productos',
                TipoOperacion: 'Ingreso',
                RequiereAprobacion: 0,
                Activo: 1
            },
            { 
                Codigo: 'MERMA', 
                Nombre: 'Merma o Pérdida',
                Descripcion: 'Pérdida o daño de productos',
                TipoOperacion: 'Egreso',
                RequiereAprobacion: 1,
                Activo: 1
            }
        ];

        for (const tipo of tipos) {
            await this.pool.request()
                .input('codigo', sql.VarChar, tipo.Codigo)
                .input('nombre', sql.VarChar, tipo.Nombre)
                .input('descripcion', sql.VarChar, tipo.Descripcion)
                .input('tipoOp', sql.VarChar, tipo.TipoOperacion)
                .input('requiere', sql.Bit, tipo.RequiereAprobacion)
                .input('activo', sql.Bit, tipo.Activo)
                .query(`
                    INSERT INTO TipoDetalleMovimiento 
                    (Codigo, Nombre, Descripcion, TipoOperacion, RequiereAprobacion, Activo)
                    VALUES (@codigo, @nombre, @descripcion, @tipoOp, @requiere, @activo)
                `);
        }

        console.log(`${colors.green}   ✅ ${tipos.length} tipos insertados${colors.reset}`);
    }

         async seedCategorias() {
        console.log(`${colors.cyan}📂 Insertando Categorías...${colors.reset}`);
        
        const categorias = [
            { Nombre: 'Herramientas', Descripcion: 'Herramientas Manuales - Martillos, destornilladores, alicates' },
            { Nombre: 'Eléctricas', Descripcion: 'Herramientas Eléctricas - Taladros, sierras, lijadoras' },
            { Nombre: 'Pinturas', Descripcion: 'Pinturas y Acabados - Pinturas, brochas, rodillos' },
            { Nombre: 'Electricidad', Descripcion: 'Electricidad - Cables, enchufes, interruptores' },
            { Nombre: 'Plomería', Descripcion: 'Plomería - Tubos, llaves, conexiones' },
            { Nombre: 'Construcción', Descripcion: 'Construcción - Cemento, arena, ladrillos' },
            { Nombre: 'Ferretería', Descripcion: 'Ferretería General - Tornillos, clavos, tuercas' },
            { Nombre: 'Seguridad', Descripcion: 'Seguridad - Candados, cerraduras, alarmas' }
        ];

        for (const cat of categorias) {
            await this.pool.request()
                .input('nombre', sql.VarChar, cat.Nombre)
                .input('descripcion', sql.VarChar, cat.Descripcion)
                .query('INSERT INTO Categoria (Nombre, Descripcion) VALUES (@nombre, @descripcion)');
        }

        console.log(`${colors.green}   ✅ ${categorias.length} categorías insertadas${colors.reset}`);
    }
    async seedProveedores() {
        console.log(`${colors.cyan}🏪 Insertando Proveedores...${colors.reset}`);
        
        const proveedores = [
            { Nombre: 'Ferretería Maestro', Telefono: '2234-5678', Direccion: 'San José, Centro', Correo: 'ventas@maestro.cr' },
            { Nombre: 'Distri Central', Telefono: '2245-8901', Direccion: 'Alajuela, Centro', Correo: 'pedidos@distcentral.com' },
            { Nombre: 'Importadora Tools', Telefono: '2256-1234', Direccion: 'Heredia, Centro', Correo: 'info@toolscr.com' },
            { Nombre: 'Pinturas Pro', Telefono: '2267-4567', Direccion: 'Cartago, Centro', Correo: 'contacto@pintprof.cr' },
            { Nombre: 'Eléctricos Norte', Telefono: '2278-7890', Direccion: 'San José, Escazú', Correo: 'ventas@elecnorte.com' }
        ];

        for (const prov of proveedores) {
            await this.pool.request()
                .input('nombre', sql.VarChar, prov.Nombre)
                .input('telefono', sql.VarChar, prov.Telefono)
                .input('direccion', sql.VarChar, prov.Direccion)
                .input('correo', sql.VarChar, prov.Correo)
                .query('INSERT INTO Proveedor (Nombre, Telefono, Direccion, Correo_electronico) VALUES (@nombre, @telefono, @direccion, @correo)');
        }

        console.log(`${colors.green}   ✅ ${proveedores.length} proveedores insertados${colors.reset}`);
    }

    async seedColaboradores() {
        console.log(`${colors.cyan}👷 Insertando Colaboradores...${colors.reset}`);
        
        const colaboradores = [
            { Nombre: 'Carlos', Apellido1: 'Ramírez', Apellido2: 'Soto', Telefono: '8765-4321', Direccion: 'San José, Curridabat', Correo: 'carlos.ramirez@ferreteria.cr' },
            { Nombre: 'María', Apellido1: 'González', Apellido2: 'López', Telefono: '8876-5432', Direccion: 'Alajuela, Grecia', Correo: 'maria.gonzalez@ferreteria.cr' },
            { Nombre: 'José', Apellido1: 'Hernández', Apellido2: 'Mora', Telefono: '8987-6543', Direccion: 'Heredia, Barva', Correo: 'jose.hernandez@ferreteria.cr' },
            { Nombre: 'Ana', Apellido1: 'Vargas', Apellido2: 'Castro', Telefono: '8098-7654', Direccion: 'Cartago, Paraíso', Correo: 'ana.vargas@ferreteria.cr' }
        ];

        for (const col of colaboradores) {
            await this.pool.request()
                .input('nombre', sql.VarChar, col.Nombre)
                .input('ap1', sql.VarChar, col.Apellido1)
                .input('ap2', sql.VarChar, col.Apellido2)
                .input('tel', sql.VarChar, col.Telefono)
                .input('dir', sql.VarChar, col.Direccion)
                .input('correo', sql.VarChar, col.Correo)
                .query('INSERT INTO Colaborador (Nombre, Apellido1, Apellido2, Telefono, Direccion, CorreoElectronico) VALUES (@nombre, @ap1, @ap2, @tel, @dir, @correo)');
        }

        console.log(`${colors.green}   ✅ ${colaboradores.length} colaboradores insertados${colors.reset}`);
    }

    async seedClientes() {
        console.log(`${colors.cyan}👥 Insertando Clientes...${colors.reset}`);
        
        const clientes = [
            { Nombre: 'Juan', Apellido1: 'Pérez', Apellido2: 'García', Telefono: '8888-1111', Correo: 'juan.perez@email.com', Direccion: 'San José, Centro' },
            { Nombre: 'Laura', Apellido1: 'Martínez', Apellido2: 'Rojas', Telefono: '8888-2222', Correo: 'laura.martinez@email.com', Direccion: 'Alajuela, Centro' },
            { Nombre: 'Pedro', Apellido1: 'Sánchez', Apellido2: 'Vega', Telefono: '8888-3333', Correo: 'pedro.sanchez@email.com', Direccion: 'Cartago, Oriental' },
            { Nombre: 'Carmen', Apellido1: 'Jiménez', Apellido2: 'Mora', Telefono: '8888-4444', Correo: 'carmen.jimenez@email.com', Direccion: 'Heredia, Centro' },
            { Nombre: 'Roberto', Apellido1: 'Castro', Apellido2: 'Luna', Telefono: '8888-5555', Correo: 'roberto.castro@email.com', Direccion: 'San José, Escazú' },
            { Nombre: 'Sofía', Apellido1: 'Vargas', Apellido2: 'Solís', Telefono: '8888-6666', Correo: 'sofia.vargas@email.com', Direccion: 'Alajuela, Grecia' },
            { Nombre: 'Diego', Apellido1: 'Morales', Apellido2: 'Cruz', Telefono: '8888-7777', Correo: 'diego.morales@email.com', Direccion: 'Cartago, Paraíso' },
            { Nombre: 'Valeria', Apellido1: 'Rojas', Apellido2: 'Salas', Telefono: '8888-8888', Correo: 'valeria.rojas@email.com', Direccion: 'Heredia, San Pablo' }
        ];

        for (const cli of clientes) {
            await this.pool.request()
                .input('nombre', sql.VarChar, cli.Nombre)
                .input('ap1', sql.VarChar, cli.Apellido1)
                .input('ap2', sql.VarChar, cli.Apellido2)
                .input('tel', sql.VarChar, cli.Telefono)
                .input('correo', sql.VarChar, cli.Correo)
                .input('dir', sql.VarChar, cli.Direccion)
                .query('INSERT INTO Cliente (Nombre, Apellido1, Apellido2, Telefono, Correo, Direccion) VALUES (@nombre, @ap1, @ap2, @tel, @correo, @dir)');
        }

        console.log(`${colors.green}   ✅ ${clientes.length} clientes insertados${colors.reset}`);
    }

    async seedProductos() {
        console.log(`${colors.cyan}📦 Insertando Productos...${colors.reset}`);
        
        const productos = [
            // Herramientas Manuales (Cat 1)
            { Nombre: 'Martillo 16oz', Descripcion: 'Martillo profesional mango fibra', PrecioCompra: 8000, PrecioVenta: 12000, Stock: 45, Min: 10, Cat: 1, Fecha: '2025-01-15' },
            { Nombre: 'Destornillador #2', Descripcion: 'Destornillador magnético phillips', PrecioCompra: 2500, PrecioVenta: 4000, Stock: 80, Min: 20, Cat: 1, Fecha: '2025-01-20' },
            { Nombre: 'Alicate 8"', Descripcion: 'Alicate universal cromado', PrecioCompra: 5000, PrecioVenta: 7500, Stock: 35, Min: 10, Cat: 1, Fecha: '2025-02-01' },
            { Nombre: 'Llave Inglesa 12"', Descripcion: 'Llave ajustable cromada', PrecioCompra: 6500, PrecioVenta: 9500, Stock: 25, Min: 8, Cat: 1, Fecha: '2025-02-10' },
            
            // Herramientas Eléctricas (Cat 2)
            { Nombre: 'Taladro 1/2"', Descripcion: 'Taladro percutor 850W', PrecioCompra: 45000, PrecioVenta: 65000, Stock: 12, Min: 3, Cat: 2, Fecha: '2025-01-25' },
            { Nombre: 'Sierra Circular', Descripcion: 'Sierra circular 1400W', PrecioCompra: 55000, PrecioVenta: 78000, Stock: 8, Min: 2, Cat: 2, Fecha: '2025-02-05' },
            { Nombre: 'Lijadora Orbital', Descripcion: 'Lijadora orbital 300W', PrecioCompra: 35000, PrecioVenta: 52000, Stock: 10, Min: 3, Cat: 2, Fecha: '2025-02-15' },
            
            // Pinturas (Cat 3)
            { Nombre: 'Pintura Latex 1Gal', Descripcion: 'Pintura latex interior/exterior', PrecioCompra: 12000, PrecioVenta: 18000, Stock: 60, Min: 15, Cat: 3, Fecha: '2025-01-10' },
            { Nombre: 'Brocha 3"', Descripcion: 'Brocha profesional cerdas naturales', PrecioCompra: 3000, PrecioVenta: 5000, Stock: 100, Min: 25, Cat: 3, Fecha: '2025-01-18' },
            { Nombre: 'Rodillo 9"', Descripcion: 'Kit rodillo antiadherente', PrecioCompra: 4500, PrecioVenta: 7000, Stock: 55, Min: 15, Cat: 3, Fecha: '2025-02-08' },
            
            // Electricidad (Cat 4)
            { Nombre: 'Cable #12 AWG', Descripcion: 'Cable sólido calibre 12 (metro)', PrecioCompra: 800, PrecioVenta: 1200, Stock: 500, Min: 100, Cat: 4, Fecha: '2025-01-05' },
            { Nombre: 'Tomacorriente', Descripcion: 'Tomacorriente 15A blanco', PrecioCompra: 1500, PrecioVenta: 2500, Stock: 150, Min: 30, Cat: 4, Fecha: '2025-01-22' },
            { Nombre: 'Interruptor', Descripcion: 'Interruptor 15A blanco', PrecioCompra: 1200, PrecioVenta: 2000, Stock: 200, Min: 40, Cat: 4, Fecha: '2025-02-03' },
            
            // Plomería (Cat 5)
            { Nombre: 'Tubo PVC 1/2"', Descripcion: 'Tubo PVC presión SDR-13.5', PrecioCompra: 2500, PrecioVenta: 4000, Stock: 80, Min: 20, Cat: 5, Fecha: '2025-01-12' },
            { Nombre: 'Llave Paso 1/2"', Descripcion: 'Llave de bola cromada', PrecioCompra: 3500, PrecioVenta: 5500, Stock: 40, Min: 10, Cat: 5, Fecha: '2025-01-28' },
            { Nombre: 'Codo PVC 90°', Descripcion: 'Codo presión 90 grados', PrecioCompra: 300, PrecioVenta: 600, Stock: 300, Min: 50, Cat: 5, Fecha: '2025-02-12' },
            
            // Construcción (Cat 6)
            { Nombre: 'Cemento 50kg', Descripcion: 'Cemento uso general', PrecioCompra: 5500, PrecioVenta: 8000, Stock: 120, Min: 30, Cat: 6, Fecha: '2025-01-08' },
            { Nombre: 'Arena de Río m³', Descripcion: 'Arena lavada construcción', PrecioCompra: 15000, PrecioVenta: 22000, Stock: 15, Min: 5, Cat: 6, Fecha: '2025-01-30' },
            { Nombre: 'Bloque 15cm', Descripcion: 'Bloque estándar construcción', PrecioCompra: 350, PrecioVenta: 600, Stock: 500, Min: 100, Cat: 6, Fecha: '2025-02-14' },
            
            // Ferretería General (Cat 7)
            { Nombre: 'Tornillos 2"', Descripcion: 'Tornillos phillips galvanizados', PrecioCompra: 2000, PrecioVenta: 3500, Stock: 75, Min: 20, Cat: 7, Fecha: '2025-01-16' },
            { Nombre: 'Clavos 3" Libra', Descripcion: 'Clavos acero construcción', PrecioCompra: 1500, PrecioVenta: 2500, Stock: 90, Min: 25, Cat: 7, Fecha: '2025-02-02' },
            { Nombre: 'Tuercas 1/2"', Descripcion: 'Tuercas acero (paquete 50u)', PrecioCompra: 2500, PrecioVenta: 4000, Stock: 60, Min: 15, Cat: 7, Fecha: '2025-02-18' },
            
            // Seguridad (Cat 8)
            { Nombre: 'Candado 50mm', Descripcion: 'Candado alta seguridad', PrecioCompra: 8000, PrecioVenta: 12000, Stock: 30, Min: 8, Cat: 8, Fecha: '2025-01-24' },
            { Nombre: 'Cerradura Pomo', Descripcion: 'Cerradura interior cromada', PrecioCompra: 15000, PrecioVenta: 22000, Stock: 18, Min: 5, Cat: 8, Fecha: '2025-02-06' },
            { Nombre: 'Chapa Sobreponer', Descripcion: 'Chapa seguridad doble', PrecioCompra: 12000, PrecioVenta: 18000, Stock: 22, Min: 6, Cat: 8, Fecha: '2025-02-16' }
        ];

        for (const prod of productos) {
            await this.pool.request()
                .input('nombre', sql.VarChar, prod.Nombre)
                .input('desc', sql.VarChar, prod.Descripcion)
                .input('pcompra', sql.Decimal(12, 2), prod.PrecioCompra)
                .input('pventa', sql.Decimal(12, 2), prod.PrecioVenta)
                .input('stock', sql.Int, prod.Stock)
                .input('min', sql.Int, prod.Min)
                .input('cat', sql.Int, prod.Cat)
                .input('fecha', sql.DateTime, prod.Fecha)
                .query(`
                    INSERT INTO Producto 
                    (Nombre, Descripcion, PrecioCompra, PrecioVenta, CantidadActual, CantidadMinima, Id_categoria, FechaEntrada)
                    VALUES (@nombre, @desc, @pcompra, @pventa, @stock, @min, @cat, @fecha)
                `);
        }

        console.log(`${colors.green}   ✅ ${productos.length} productos insertados${colors.reset}`);
    }

    async seedCompras() {
        console.log(`${colors.cyan}🛒 Insertando Compras...${colors.reset}`);
        
        const compras = [
            { Fecha: '2025-10-01', Proveedor: 1, Productos: [{ Id: 1, Cantidad: 50, Precio: 8000 }, { Id: 2, Cantidad: 100, Precio: 2500 }] },
            { Fecha: '2025-10-05', Proveedor: 2, Productos: [{ Id: 5, Cantidad: 15, Precio: 45000 }] },
            { Fecha: '2025-10-08', Proveedor: 3, Productos: [{ Id: 8, Cantidad: 80, Precio: 12000 }] },
            { Fecha: '2025-10-12', Proveedor: 4, Productos: [{ Id: 11, Cantidad: 600, Precio: 800 }] },
            { Fecha: '2025-10-15', Proveedor: 1, Productos: [{ Id: 17, Cantidad: 150, Precio: 5500 }] }
        ];

        for (const compra of compras) {
            let total = 0;
            compra.Productos.forEach(p => total += p.Cantidad * p.Precio);
            
            // Insertar compra
            const result = await this.pool.request()
                .input('fecha', sql.DateTime, compra.Fecha)
                .input('total', sql.Decimal(12, 2), total)
                .input('prov', sql.Int, compra.Proveedor)
                .query(`
                    INSERT INTO Compra (FechaCompra, TotalCompra, Id_proveedor)
                    OUTPUT INSERTED.Id_compra
                    VALUES (@fecha, @total, @prov)
                `);
            
            const compraId = result.recordset[0].Id_compra;
            
            // Insertar detalles
            let lineaNum = 1;
            for (const prod of compra.Productos) {
                const subtotal = prod.Cantidad * prod.Precio;
                
                await this.pool.request()
                    .input('cantidad', sql.Int, prod.Cantidad)
                    .input('linea', sql.Int, lineaNum++)
                    .input('precio', sql.Decimal(12, 2), prod.Precio)
                    .input('subtotal', sql.Decimal(12, 2), subtotal)
                    .input('compraId', sql.Int, compraId)
                    .input('prodId', sql.Int, prod.Id)
                    .query(`
                        INSERT INTO DetalleCompra (CantidadCompra, NumeroLinea, PrecioUnitario, Subtotal, Id_compra, Id_producto)
                        VALUES (@cantidad, @linea, @precio, @subtotal, @compraId, @prodId)
                    `);
            }
        }

        console.log(`${colors.green}   ✅ ${compras.length} compras insertadas${colors.reset}`);
    }

    async seedVentas() {
        console.log(`${colors.cyan}💰 Insertando Ventas...${colors.reset}`);
        
        const ventas = [
            // Venta 1
            {
                Fecha: '2025-10-20 10:30:00',
                Cliente: 1,
                Colaborador: 1,
                MetodoPago: 'Efectivo',
                Items: [
                    { Producto: 1, Cantidad: 2, Precio: 12000 },
                    { Producto: 2, Cantidad: 3, Precio: 4000 }
                ]
            },
            // Venta 2
            {
                Fecha: '2025-10-21 14:15:00',
                Cliente: 2,
                Colaborador: 2,
                MetodoPago: 'Tarjeta',
                Items: [
                    { Producto: 5, Cantidad: 1, Precio: 65000 },
                    { Producto: 3, Cantidad: 2, Precio: 7500 }
                ]
            },
            // Venta 3
            {
                Fecha: '2025-10-22 09:00:00',
                Cliente: 3,
                Colaborador: 1,
                MetodoPago: 'Transferencia',
                Items: [
                    { Producto: 8, Cantidad: 5, Precio: 18000 },
                    { Producto: 9, Cantidad: 4, Precio: 5000 }
                ]
            },
            // Venta 4
            {
                Fecha: '2025-10-23 16:45:00',
                Cliente: 4,
                Colaborador: 3,
                MetodoPago: 'Efectivo',
                Items: [
                    { Producto: 17, Cantidad: 10, Precio: 8000 },
                    { Producto: 20, Cantidad: 100, Precio: 3500 }
                ]
            },
            // Venta 5 - HOY
            {
                Fecha: new Date(),
                Cliente: 5,
                Colaborador: 2,
                MetodoPago: 'Tarjeta',
                Items: [
                    { Producto: 11, Cantidad: 50, Precio: 1200 },
                    { Producto: 12, Cantidad: 20, Precio: 2500 }
                ]
            },
            // Venta 6 - HOY
            {
                Fecha: new Date(),
                Cliente: 6,
                Colaborador: 1,
                MetodoPago: 'Efectivo',
                Items: [
                    { Producto: 1, Cantidad: 3, Precio: 12000 },
                    { Producto: 4, Cantidad: 1, Precio: 9500 }
                ]
            }
        ];

        for (const venta of ventas) {
            let total = 0;
            venta.Items.forEach(item => {
                total += item.Precio * item.Cantidad;
            });

            // Insertar venta
            const result = await this.pool.request()
                .input('fecha', sql.DateTime, venta.Fecha)
                .input('total', sql.Decimal(12, 2), total)
                .input('metodo', sql.VarChar, venta.MetodoPago)
                .input('estado', sql.VarChar, 'Completada')
                .input('cliente', sql.Int, venta.Cliente)
                .input('col', sql.Int, venta.Colaborador)
                .query(`
                    INSERT INTO Venta (Fecha, TotalVenta, MetodoPago, Estado, Id_cliente, Id_colaborador)
                    OUTPUT INSERTED.Id_venta
                    VALUES (@fecha, @total, @metodo, @estado, @cliente, @col)
                `);
            
            const ventaId = result.recordset[0].Id_venta;

            // Insertar detalles
            let lineaNum = 1;
            for (const item of venta.Items) {
                const subtotal = item.Precio * item.Cantidad;
                
                await this.pool.request()
                    .input('cantidad', sql.Int, item.Cantidad)
                    .input('linea', sql.Int, lineaNum++)
                    .input('precio', sql.Decimal(10, 2), item.Precio)
                    .input('subtotal', sql.Decimal(10, 2), subtotal)
                    .input('ventaId', sql.Int, ventaId)
                    .input('prodId', sql.Int, item.Producto)
                    .query(`
                        INSERT INTO DetalleVenta (CantidadVenta, NumeroLinea, PrecioUnitario, Subtotal, Id_venta, Id_producto)
                        VALUES (@cantidad, @linea, @precio, @subtotal, @ventaId, @prodId)
                    `);
                
                // Actualizar stock
                await this.pool.request()
                    .input('cantidad', sql.Int, item.Cantidad)
                    .input('prodId', sql.Int, item.Producto)
                    .query('UPDATE Producto SET CantidadActual = CantidadActual - @cantidad WHERE Id_Producto = @prodId');
            }
        }

        console.log(`${colors.green}   ✅ ${ventas.length} ventas insertadas${colors.reset}`);
    }

    async seedAlquileres() {
        console.log(`${colors.cyan}🔧 Insertando Alquileres...${colors.reset}`);
        
        const alquileres = [
            {
                Cliente: 1,
                Colaborador: 1,
                FechaInicio: '2025-10-15',
                FechaFin: '2025-10-22',
                Estado: 'Finalizado',
                Producto: 5,
                Cantidad: 1,
                TarifaDia: 5000,
                Dias: 7,
                Deposito: 10000
            },
            {
                Cliente: 3,
                Colaborador: 2,
                FechaInicio: '2025-10-25',
                FechaFin: '2025-11-01',
                Estado: 'Activo',
                Producto: 6,
                Cantidad: 1,
                TarifaDia: 6000,
                Dias: 7,
                Deposito: 15000
            },
            {
                Cliente: 5,
                Colaborador: 1,
                FechaInicio: '2025-10-28',
                FechaFin: '2025-11-04',
                Estado: 'Activo',
                Producto: 7,
                Cantidad: 1,
                TarifaDia: 4500,
                Dias: 7,
                Deposito: 12000
            }
        ];

        for (const alq of alquileres) {
            const total = alq.TarifaDia * alq.Dias * alq.Cantidad;
            
            // Insertar alquiler
            const result = await this.pool.request()
                .input('inicio', sql.DateTime, alq.FechaInicio)
                .input('fin', sql.DateTime, alq.FechaFin)
                .input('estado', sql.VarChar, alq.Estado)
                .input('total', sql.Decimal(10, 2), total)
                .input('cliente', sql.Int, alq.Cliente)
                .input('col', sql.Int, alq.Colaborador)
                .query(`
                    INSERT INTO Alquiler (FechaInicio, FechaFin, Estado, TotalAlquiler, Id_cliente, Id_colaborador)
                    OUTPUT INSERTED.Id_alquiler
                    VALUES (@inicio, @fin, @estado, @total, @cliente, @col)
                `);
            
            const alqId = result.recordset[0].Id_alquiler;
            
            // Insertar detalle
            const subtotal = alq.TarifaDia * alq.Dias;
            
            await this.pool.request()
                .input('cantidad', sql.Int, alq.Cantidad)
                .input('dias', sql.Decimal(10, 2), alq.Dias)
                .input('subtotal', sql.Decimal(10, 2), subtotal)
                .input('tarifa', sql.Decimal(10, 2), alq.TarifaDia)
                .input('deposito', sql.Decimal(10, 2), alq.Deposito)
                .input('alqId', sql.Int, alqId)
                .input('prodId', sql.Int, alq.Producto)
                .query(`
                    INSERT INTO DetalleAlquiler 
                    (CantidadDetalleAlquiler, DiasAlquilados, Subtotal, TarifaDiaria, Deposito, Id_alquiler, Id_producto)
                    VALUES (@cantidad, @dias, @subtotal, @tarifa, @deposito, @alqId, @prodId)
                `);
        }

        console.log(`${colors.green}   ✅ ${alquileres.length} alquileres insertados${colors.reset}`);
    }

    async run(clear = false) {
        console.log(`\n${colors.magenta}${'='.repeat(60)}`);
        console.log('🌱 POBLANDO BASE DE DATOS - FERRETERÍA CENTRAL');
        console.log(`${'='.repeat(60)}${colors.reset}\n`);

        try {
            await this.connect();

            if (clear) {
                await this.clearDatabase();
            }

            await this.seedTipoMovimientos();
            await this.seedCategorias();
            await this.seedProveedores();
            await this.seedColaboradores();
            await this.seedClientes();
            await this.seedProductos();
            await this.seedCompras();
            await this.seedVentas();
            await this.seedAlquileres();

            console.log(`\n${colors.green}${'='.repeat(60)}`);
            console.log('✅ BASE DE DATOS POBLADA EXITOSAMENTE');
            console.log(`${'='.repeat(60)}${colors.reset}\n`);

            console.log(`${colors.blue}📊 RESUMEN:${colors.reset}`);
            console.log('  ✅ 5 Tipos de Movimiento');
            console.log('  ✅ 8 Categorías');
            console.log('  ✅ 5 Proveedores');
            console.log('  ✅ 4 Colaboradores');
            console.log('  ✅ 8 Clientes');
            console.log('  ✅ 25 Productos');
            console.log('  ✅ 5 Compras');
            console.log('  ✅ 6 Ventas (2 hoy)');
            console.log('  ✅ 3 Alquileres (2 activos)\n');

            process.exit(0);

        } catch (error) {
            console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }
}

// Ejecutar
const seeder = new DatabaseSeeder();
const clearFirst = process.argv.includes('--clear');
seeder.run(clearFirst);