const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { config, utils } = require('./config');
const { getConnection } = require('./config/database');

const {
    logger,
    errorLogger,
    errorHandler,
    sanitize
} = require('./middlewares');

const { generalLimiter } = require('./middlewares/rateLimiter');

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
const movimientoRoutes = require('./routes/movimientoRoutes');
const dataMartRoutes = require('./routes/dataMartRoutes');

const app = express();

// Middlewares globales
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(sanitize);
app.use(generalLimiter);

// Ruta de salud básica
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

// ✅ NUEVO: Estado completo del sistema
app.get('/api/status', async (req, res, next) => {
    try {
        const pool = await getConnection();
        const dbResult = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database_name');
        
        let backupInfo = { count: 0, totalSizeFormatted: 'N/A', newest: null };
        try {
            backupInfo = await backupService.getBackupInfo();
        } catch (e) {
            console.warn('⚠️  No se pudo obtener info de backups:', e.message);
        }
        
        res.json(utils.successResponse({
            server: {
                status: 'running',
                uptime: Math.floor(process.uptime()),
                uptimeFormatted: formatUptime(process.uptime()),
                memory: {
                    used: `${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                    total: `${Math.floor(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
                },
                version: '1.0.0',
                nodeVersion: process.version
            },
            database: {
                status: 'connected',
                name: dbResult.recordset[0].database_name,
                server: config.database.server
            },
            backups: {
                enabled: config.backup?.enabled || false,
                count: backupInfo.count,
                totalSize: backupInfo.totalSizeFormatted,
                latest: backupInfo.newest?.fileName || 'N/A',
                latestDate: backupInfo.newest?.created || 'N/A'
            }
        }, 'Sistema operativo correctamente'));
    } catch (err) {
        next(err);
    }
});

// Helper para formatear uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
}

// ✅ NUEVO: Configuración (solo desarrollo)
if (config.nodeEnv === 'development') {
    app.get('/api/config', (req, res) => {
        res.json(utils.successResponse({
            environment: config.nodeEnv,
            database: {
                server: config.database.server,
                database: config.database.database,
                port: config.database.port
            },
            server: {
                port: config.port
            },
            backup: {
                enabled: config.backup?.enabled || false,
                path: config.backup?.path || 'N/A',
                retention: config.backup?.retention || 'N/A',
                interval: config.backup?.autoBackupInterval 
                    ? `${config.backup.autoBackupInterval / (60 * 60 * 1000)} horas` 
                    : 'N/A'
            },
            pagination: config.pagination,
            cors: {
                origin: config.cors.origin
            }
        }, 'Configuración actual del sistema'));
    });
}

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
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/datamart', dataMartRoutes);

// Middleware de logging de errores
app.use(errorLogger);

// Middleware de manejo de errores
app.use(errorHandler);

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl,
        availableEndpoints: {
            health: '/health',
            status: '/api/status',
            tables: '/api/tables',
            config: config.nodeEnv === 'development' ? '/api/config' : 'N/A (solo en desarrollo)'
        }
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
        
        if (config.backup && config.backup.enabled) {
            try {
                backupService.startAutoBackup();
                console.log(`✅ Sistema de backups automáticos activado`);
                console.log(`   📁 Ruta: ${config.backup.path}`);
                console.log(`   ⏰ Intervalo: ${config.backup.autoBackupInterval / (60 * 60 * 1000)} horas`);
                console.log(`   📅 Retención: ${config.backup.retention} días`);
            } catch (backupError) {
                console.warn('⚠️  No se pudo iniciar backups automáticos:', backupError.message);
                console.warn('   El sistema continuará sin backups automáticos');
            }
        } else {
            console.log('⚠️  Sistema de backups automáticos deshabilitado');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Servidor iniciado correctamente');
        console.log('📌 Documentación completa en /api/status');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('\n❌ Error durante la inicialización:', error.message);
        console.error('📋 Stack:', error.stack);
        console.error('\n⚠️  El servidor se cerrará...');
        process.exit(1);
    }
});

// Manejo de señales y errores...
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Señal de cierre recibida (SIGINT)');
    console.log('🔄 Cerrando servidor gracefully...');
    
    try {
        if (backupService && typeof backupService.stopAutoBackup === 'function') {
            try {
                backupService.stopAutoBackup();
                console.log('✅ Sistema de backups detenido');
            } catch (e) {
                console.warn('⚠️  Error al detener backups:', e.message);
            }
        }
        
        try {
            const { closeConnection } = require('./config/database');
            await closeConnection();
            console.log('✅ Conexión a base de datos cerrada');
        } catch (e) {
            console.warn('⚠️  Error al cerrar BD:', e.message);
        }
        
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante el cierre:', error.message);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Señal de cierre recibida (SIGTERM)');
    console.log('🔄 Cerrando servidor gracefully...');
    
    try {
        if (backupService && typeof backupService.stopAutoBackup === 'function') {
            backupService.stopAutoBackup();
        }
        
        const { closeConnection } = require('./config/database');
        await closeConnection();
        
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante el cierre:', error.message);
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ Unhandled Rejection detectado:');
    console.error('📍 Promise:', promise);
    console.error('📋 Razón:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught Exception detectado:');
    console.error('📋 Error:', error.message);
    console.error('📋 Stack:', error.stack);
    
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});