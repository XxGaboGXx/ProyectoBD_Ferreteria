const { constants } = require('../config');

/**
 * Middleware genérico para validar campos requeridos
 */
const validateRequired = (fields) => {
    return (req, res, next) => {
        const errors = [];
        
        fields.forEach(field => {
            if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
                errors.push(`El campo '${field}' es requerido`);
            }
        });

        if (errors.length > 0) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'Campos requeridos faltantes',
                    details: errors
                }
            });
        }

        next();
    };
};

/**
 * Valida formato de email
 */
const validateEmail = (field = 'email') => {
    return (req, res, next) => {
        const email = req.body[field];
        
        if (!email) {
            return next();
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'Formato de email inválido',
                    field: field
                }
            });
        }

        next();
    };
};

/**
 * Valida formato de teléfono
 */
const validatePhone = (field = 'telefono') => {
    return (req, res, next) => {
        const phone = req.body[field];
        
        if (!phone) {
            return next();
        }

        // Acepta formatos: 1234567890, 123-456-7890, (123) 456-7890, etc.
        const phoneRegex = /^[\d\s\-\(\)]+$/;
        
        if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'Formato de teléfono inválido',
                    field: field
                }
            });
        }

        next();
    };
};

/**
 * Valida que un valor esté dentro de un rango
 */
const validateRange = (field, min, max) => {
    return (req, res, next) => {
        const value = req.body[field];
        
        if (value === undefined || value === null) {
            return next();
        }

        if (value < min || value > max) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: `El campo '${field}' debe estar entre ${min} y ${max}`,
                    field: field,
                    value: value,
                    range: { min, max }
                }
            });
        }

        next();
    };
};

/**
 * Valida longitud de string
 */
const validateLength = (field, min, max) => {
    return (req, res, next) => {
        const value = req.body[field];
        
        if (!value) {
            return next();
        }

        if (typeof value !== 'string') {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: `El campo '${field}' debe ser texto`,
                    field: field
                }
            });
        }

        if (value.length < min || value.length > max) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: `El campo '${field}' debe tener entre ${min} y ${max} caracteres`,
                    field: field,
                    current: value.length,
                    range: { min, max }
                }
            });
        }

        next();
    };
};

/**
 * Valida que un valor sea numérico
 */
const validateNumeric = (fields) => {
    return (req, res, next) => {
        const errors = [];
        
        fields.forEach(field => {
            const value = req.body[field];
            if (value !== undefined && value !== null && typeof value !== 'number') {
                errors.push(`El campo '${field}' debe ser numérico`);
            }
        });

        if (errors.length > 0) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'Errores de validación',
                    details: errors
                }
            });
        }

        next();
    };
};

/**
 * Valida fecha
 */
const validateDate = (field) => {
    return (req, res, next) => {
        const value = req.body[field];
        
        if (!value) {
            return next();
        }

        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: `El campo '${field}' no es una fecha válida`,
                    field: field,
                    value: value
                }
            });
        }

        next();
    };
};

module.exports = {
    validateRequired,
    validateEmail,
    validatePhone,
    validateRange,
    validateLength,
    validateNumeric,
    validateDate
};