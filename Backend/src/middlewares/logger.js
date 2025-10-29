const fs = require('fs');
const path = require('path');
const { config } = require('../config');

// Crear directorio de logs si no existe
const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

/**
 * Formatea un mensaje de log
 */
const formatLogMessage = (req, res, duration) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'Unknown';

    return {
        timestamp,
        method,
        url,
        status,
        duration: `${duration}ms`,
        ip,
        userAgent
    };
};

/**
 * Escribe en archivo de log
 */
const writeToLogFile = (logData) => {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDirectory, `${date}.log`);
    
    const logLine = JSON.stringify(logData) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
        if (err) {
            console.error('Error al escribir en archivo de log:', err);
        }
    });
};

/**
 * Escribe logs de error en archivo separado
 */
const writeErrorLog = (error, req) => {
    const date = new Date().toISOString().split('T')[0];
    const errorLogFile = path.join(logDirectory, `error-${date}.log`);
    
    const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        body: req.body
    };
    
    const errorLine = JSON.stringify(errorLog, null, 2) + '\n---\n';
    
    fs.appendFile(errorLogFile, errorLine, (err) => {
        if (err) {
            console.error('Error al escribir log de error:', err);
        }
    });
};

/**
 * Middleware principal de logging
 */
const logger = (req, res, next) => {
    if (!config.logging.enabled) {
        return next();
    }

    const start = Date.now();
    
    // Interceptar el método res.json para capturar la respuesta
    const originalJson = res.json;
    res.json = function(data) {
        res.locals.responseData = data;
        return originalJson.call(this, data);
    };

    // Cuando la respuesta termina
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = formatLogMessage(req, res, duration);

        // Log en consola con colores
        if (config.logging.console) {
            let colorCode = '\x1b[32m'; // Verde por defecto
            if (res.statusCode >= 500) colorCode = '\x1b[31m'; // Rojo
            else if (res.statusCode >= 400) colorCode = '\x1b[33m'; // Amarillo
            else if (res.statusCode >= 300) colorCode = '\x1b[36m'; // Cyan

            console.log(
                `${colorCode}[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.status} - ${logData.duration}\x1b[0m`
            );
        }

        // Escribir en archivo según el nivel de log
        if (shouldLog(res.statusCode)) {
            writeToLogFile(logData);
        }

        // Log de errores en archivo separado
        if (res.statusCode >= 500 && res.locals.error) {
            writeErrorLog(res.locals.error, req);
        }
    });

    next();
};

/**
 * Determina si debe loggear según el nivel configurado
 */
const shouldLog = (statusCode) => {
    const level = config.logging.level;
    
    switch (level) {
        case 'error':
            return statusCode >= 500;
        case 'warn':
            return statusCode >= 400;
        case 'info':
            return statusCode >= 200;
        case 'debug':
            return true;
        default:
            return statusCode >= 400;
    }
};

/**
 * Middleware para logging de errores específicamente
 */
const errorLogger = (err, req, res, next) => {
    res.locals.error = err;
    writeErrorLog(err, req);
    next(err);
};

module.exports = { logger, errorLogger, writeToLogFile, writeErrorLog };