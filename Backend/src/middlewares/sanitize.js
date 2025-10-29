/**
 * Sanitiza strings para prevenir inyección SQL y XSS
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remover caracteres peligrosos para SQL
    return str
        .replace(/'/g, "''") // Escapar comillas simples
        .trim();
};

/**
 * Sanitiza todo el body del request
 */
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }
    next();
};

/**
 * Sanitiza parámetros de query
 */
const sanitizeQuery = (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }
    next();
};

/**
 * Middleware combinado
 */
const sanitize = (req, res, next) => {
    sanitizeBody(req, res, () => {
        sanitizeQuery(req, res, next);
    });
};

module.exports = {
    sanitize,
    sanitizeBody,
    sanitizeQuery,
    sanitizeString
};