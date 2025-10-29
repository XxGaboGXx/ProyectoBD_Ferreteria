require('dotenv').config();

module.exports = {
    // Configuración del servidor
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Configuración de la base de datos
    database: {
        server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
        database: process.env.DB_DATABASE || 'FerreteriaCentral',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || ''
    },
    
    // Configuración de backups
    backup: {
        enabled: true,
        path: process.env.BACKUP_PATH || 'C:\\Backups\\FerreteriaCentral',
        autoBackupInterval: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
        retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30, // días para mantener backups
        scheduleTime: '02:00' // Hora del día para backup automático (2:00 AM)
    },
    
    // Configuración de logs
    logging: {
        enabled: true,
        level: process.env.LOG_LEVEL || 'info', // 'error', 'warn', 'info', 'debug'
        path: './logs',
        maxSize: '10m', // Tamaño máximo de cada archivo de log
        maxFiles: 30, // Número máximo de archivos de log a mantener
        console: true // Si mostrar logs en consola
    },
    
    // Configuración de CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    
    // Configuración de paginación por defecto
    pagination: {
        defaultLimit: 50,
        maxLimit: 1000
    },
    
    // Configuración de transacciones
    transactions: {
        timeout: 30000, // 30 segundos
        isolationLevel: 'READ_COMMITTED' // Nivel de aislamiento por defecto
    },
    
    // Alertas de inventario
    inventory: {
        lowStockThreshold: 10, // Umbral de stock bajo
        criticalStockThreshold: 5, // Umbral de stock crítico
        enableAlerts: true
    },
    
    // Configuración de seguridad
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100 // Límite de peticiones por IP
        },
        helmet: {
            enabled: true
        }
    },
    
    // Configuración de reportes
    reports: {
        path: './reports',
        formats: ['pdf', 'excel', 'csv'],
        retention: 90 // días para mantener reportes
    }
};