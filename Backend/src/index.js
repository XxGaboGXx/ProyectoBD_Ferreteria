const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { config, utils } = require('./config');
const { getConnection } = require('./config/database');

const {
    logger,
    errorLogger,
    errorHandler,
    rateLimiter,
    sanitize
} = require('./middlewares');

const backupService = require('./services/backupService');

// Importar todas las rutas
const backupRoutes = require('./routes/backupRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const compraRoutes = require('./routes/compraRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const colaboradorRoutes = require('./routes/colaboradorRoutes');
const alquilerRoutes = require('./routes/alquilerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

// Middlewares globales
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(sanitize);
app.use(rateLimiter);

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API FerreteriaCentral funcionando',
        timestamp: new Date(),
        environment: config.nodeEnv,
        database: config.database.database,
        version: '1.0.0'
    });
});

// Ruta de prueba de conexión
app.get('/api/test-connection', async (req, res, next) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database_name');
        
        res.json(utils.successResponse({
            database: result.recordset[0].database_name,
            version: result.recordset[0].version
        }, 'Conexión exitosa a SQL Server'));
    } catch (err) {
        next(err);
    }
});

// Obtener todas las tablas
app.get('/api/tables', async (req, res, next) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        res.json(utils.successResponse({
            count: result.recordset.length,
            tables: result.recordset
        }));
    } catch (err) {
        next(err);
    }
});

// Obtener datos de una tabla
app.get('/api/data/:tableName', async (req, res, next) => {
    try {
        const { tableName } = req.params;
        
        if (tableName === ':tableName' || !tableName || tableName.includes(':')) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Debe proporcionar un nombre de tabla válido',
                    example: '/api/data/Producto'
                }
            });
        }
        
        const limit = req.query.limit || config.pagination.defaultLimit;
        const pool = await getConnection();
        
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_NAME = '${tableName}'
        `);
        
        if (tableCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `La tabla '${tableName}' no existe`,
                    code: 'TABLE_NOT_FOUND'
                }
            });
        }
        
        const result = await pool.request()
            .query(`SELECT TOP ${limit} * FROM [${tableName}]`);
        
        res.json(utils.successResponse({
            table: tableName,
            count: result.recordset.length,
            limit: limit,
            data: result.recordset
        }));
    } catch (err) {
        next(err);
    }
});

// ========================================
// RUTAS DE LA API
// ========================================

// Backups
app.use('/api/backups', backupRoutes);

// Dashboard y Reportes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reporteRoutes);

// Operaciones principales
app.use('/api/ventas', ventaRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/alquileres', alquilerRoutes);

// Catálogos
app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/colaboradores', colaboradorRoutes);

// Middleware de logging de errores
app.use(errorLogger);

// Middleware de manejo de errores
app.use(errorHandler);

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Iniciar servidor
const PORT = config.port;

app.listen(PORT, async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR API FERRETERÍA CENTRAL');
    console.log('='.repeat(60));
    console.log(`\n📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Entorno: ${config.nodeEnv}`);
    console.log(`📁 Base de datos: ${config.database.database}`);
    console.log(`🔒 Servidor: ${config.database.server}`);
    
    try {
        utils.validateEnvVariables();
        console.log('✅ Variables de entorno validadas');
        
        await getConnection();
        console.log('✅ Conexión a base de datos establecida');
        
        if (config.backup.enabled) {
            backupService.startAutoBackup();
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 ENDPOINTS DISPONIBLES');
        console.log('='.repeat(60));
        
        console.log('\n🏥 SALUD Y CONEXIÓN:');
        console.log('  GET    /health');
        console.log('  GET    /api/test-connection');
        console.log('  GET    /api/tables');
        
        console.log('\n📊 DASHBOARD:');
        console.log('  GET    /api/dashboard/summary');
        console.log('  GET    /api/dashboard/ventas-por-dia?days=30');
        console.log('  GET    /api/dashboard/ventas-por-categoria');
        console.log('  GET    /api/dashboard/ventas-por-metodo-pago');
        console.log('  GET    /api/dashboard/top-clientes?limit=10');
        console.log('  GET    /api/dashboard/rendimiento-colaboradores');
        console.log('  GET    /api/dashboard/analisis-inventario');
        console.log('  GET    /api/dashboard/movimientos-recientes?limit=20');
        console.log('  GET    /api/dashboard/resumen-financiero');
        console.log('  GET    /api/dashboard/alertas');
        
        console.log('\n📈 REPORTES:');
        console.log('  GET    /api/reportes/ventas?fechaInicio=2025-01-01&fechaFin=2025-12-31');
        console.log('  GET    /api/reportes/inventario');
        console.log('  GET    /api/reportes/clientes');
        console.log('  GET    /api/reportes/productos-mas-vendidos?fechaInicio=...&fechaFin=...&limit=20');
        console.log('  GET    /api/reportes/compras?fechaInicio=...&fechaFin=...');
        console.log('  GET    /api/reportes/alquileres?fechaInicio=...&fechaFin=...');
        
        console.log('\n📦 PRODUCTOS:');
        console.log('  GET    /api/productos');
        console.log('  GET    /api/productos/low-stock');
        console.log('  GET    /api/productos/:id');
        console.log('  POST   /api/productos');
        console.log('  PUT    /api/productos/:id');
        console.log('  DELETE /api/productos/:id');
        console.log('  POST   /api/productos/:id/adjust-stock');
        console.log('  GET    /api/productos/:id/movimientos');
        
        console.log('\n👥 CLIENTES:');
        console.log('  GET    /api/clientes');
        console.log('  GET    /api/clientes/:id');
        console.log('  GET    /api/clientes/cedula/:cedula');
        console.log('  POST   /api/clientes');
        console.log('  PUT    /api/clientes/:id');
        console.log('  DELETE /api/clientes/:id');
        console.log('  GET    /api/clientes/:id/historial');
        console.log('  GET    /api/clientes/:id/estadisticas');
        
        console.log('\n💰 VENTAS:');
        console.log('  POST   /api/ventas');
        console.log('  GET    /api/ventas/:id');
        console.log('  POST   /api/ventas/:id/cancel');
        
        console.log('\n🛒 COMPRAS:');
        console.log('  POST   /api/compras');
        console.log('  GET    /api/compras/:id');
        
        console.log('\n🏪 PROVEEDORES:');
        console.log('  GET    /api/proveedores');
        console.log('  GET    /api/proveedores/:id');
        console.log('  POST   /api/proveedores');
        console.log('  PUT    /api/proveedores/:id');
        console.log('  DELETE /api/proveedores/:id');
        console.log('  GET    /api/proveedores/:id/historial');
        console.log('  GET    /api/proveedores/:id/productos');
        
        console.log('\n🔧 ALQUILERES:');
        console.log('  POST   /api/alquileres');
        console.log('  GET    /api/alquileres/activos');
        console.log('  GET    /api/alquileres/vencidos');
        console.log('  POST   /api/alquileres/:id/finalizar');
        
        console.log('\n📂 CATEGORÍAS:');
        console.log('  GET    /api/categorias');
        console.log('  GET    /api/categorias/:id');
        console.log('  POST   /api/categorias');
        console.log('  PUT    /api/categorias/:id');
        console.log('  DELETE /api/categorias/:id');
        
        console.log('\n👷 COLABORADORES:');
        console.log('  GET    /api/colaboradores');
        console.log('  GET    /api/colaboradores/:id');
        console.log('  POST   /api/colaboradores');
        console.log('  PUT    /api/colaboradores/:id');
        console.log('  DELETE /api/colaboradores/:id');
        
        console.log('\n💾 BACKUPS:');
        console.log('  POST   /api/backups/create');
        console.log('  GET    /api/backups/list');
        console.log('  GET    /api/backups/info');
        console.log('  POST   /api/backups/restore');
        console.log('  DELETE /api/backups/cleanup?days=30');
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Servidor iniciado correctamente');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('\n❌ Error durante la inicialización:', error.message);
        console.error('Stack:', error.stack);
    }
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Cerrando servidor gracefully...');
    
    backupService.stopAutoBackup();
    
    const { closeConnection } = require('./config/database');
    await closeConnection();
    
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});