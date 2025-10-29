const config = require('./config');

/**
 * Valida que todas las variables de entorno necesarias estén configuradas
 */
const validateEnvVariables = () => {
    const required = ['DB_SERVER', 'DB_DATABASE'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    }
};

/**
 * Obtiene la configuración de conexión formateada
 */
const getConnectionInfo = () => {
    return {
        server: config.database.server,
        database: config.database.database,
        environment: config.nodeEnv,
        backupsEnabled: config.backup.enabled,
        loggingEnabled: config.logging.enabled
    };
};

/**
 * Verifica si el entorno es de desarrollo
 */
const isDevelopment = () => {
    return config.nodeEnv === 'development';
};

/**
 * Verifica si el entorno es de producción
 */
const isProduction = () => {
    return config.nodeEnv === 'production';
};

/**
 * Formatea un mensaje de error para el entorno actual
 */
const formatError = (error) => {
    if (isDevelopment()) {
        return {
            message: error.message,
            code: error.code,
            stack: error.stack,
            details: error.details || null
        };
    }
    
    return {
        message: error.message || 'Error interno del servidor',
        code: error.code || 'INTERNAL_ERROR'
    };
};

/**
 * Crea una respuesta estandarizada exitosa
 */
const successResponse = (data, message = 'Operación exitosa') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date()
    };
};

/**
 * Crea una respuesta estandarizada de error
 */
const errorResponse = (error, statusCode = 500) => {
    return {
        success: false,
        error: formatError(error),
        timestamp: new Date()
    };
};

/**
 * Obtiene el path completo para backups
 */
const getBackupPath = () => {
    return config.backup.path;
};

/**
 * Obtiene el path completo para logs
 */
const getLogsPath = () => {
    return config.logging.path;
};

module.exports = {
    validateEnvVariables,
    getConnectionInfo,
    isDevelopment,
    isProduction,
    formatError,
    successResponse,
    errorResponse,
    getBackupPath,
    getLogsPath
};