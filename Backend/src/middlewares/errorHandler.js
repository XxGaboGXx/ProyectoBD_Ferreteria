const { utils, constants } = require('../config');

/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
    // Log del error
    console.error('❌ Error capturado:', {
        message: err.message,
        code: err.code,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Determinar código de estado HTTP
    let statusCode = err.statusCode || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;

    // Errores específicos de SQL Server
    if (err.number) {
        switch (err.number) {
            case 2627: // Violación de clave única
            case 2601:
                statusCode = constants.HTTP_STATUS.CONFLICT;
                err.message = 'El registro ya existe en la base de datos';
                break;
            case 547: // Violación de constraint de clave foránea
                statusCode = constants.HTTP_STATUS.BAD_REQUEST;
                err.message = 'No se puede completar la operación debido a referencias existentes';
                break;
            case 8152: // String truncado
                statusCode = constants.HTTP_STATUS.BAD_REQUEST;
                err.message = 'Uno o más campos exceden la longitud máxima permitida';
                break;
            case 245: // Error de conversión
                statusCode = constants.HTTP_STATUS.BAD_REQUEST;
                err.message = 'Error en el formato de los datos proporcionados';
                break;
            case 515: // Campo NULL no permitido
                statusCode = constants.HTTP_STATUS.BAD_REQUEST;
                err.message = 'Faltan campos obligatorios';
                break;
            default:
                statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
        }
    }

    // Errores de validación
    if (err.name === 'ValidationError') {
        statusCode = constants.HTTP_STATUS.UNPROCESSABLE_ENTITY;
    }

    // Errores de autenticación
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
    }

    // Crear respuesta de error
    const errorResponse = {
        success: false,
        error: {
            message: err.message || constants.ERROR_MESSAGES.SERVER_ERROR,
            code: err.code || 'INTERNAL_ERROR',
            statusCode: statusCode
        },
        timestamp: new Date()
    };

    // En desarrollo, incluir más detalles
    if (utils.isDevelopment()) {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = {
            sqlNumber: err.number,
            sqlState: err.state,
            sqlLineNumber: err.lineNumber,
            sqlProcedure: err.procName
        };
        errorResponse.path = req.path;
        errorResponse.method = req.method;
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;