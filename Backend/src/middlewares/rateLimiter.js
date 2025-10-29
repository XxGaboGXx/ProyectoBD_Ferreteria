const { config, constants } = require('../config');

// Almacenar intentos de peticiones por IP
const requestCounts = new Map();

/**
 * Limpia contadores antiguos cada minuto
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.resetTime > config.security.rateLimit.windowMs) {
            requestCounts.delete(key);
        }
    }
}, 60000);

/**
 * Middleware de rate limiting
 */
const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    let requestData = requestCounts.get(ip);
    
    // Si no existe o el tiempo expiró, crear nuevo
    if (!requestData || now - requestData.resetTime > config.security.rateLimit.windowMs) {
        requestData = {
            count: 0,
            resetTime: now
        };
        requestCounts.set(ip, requestData);
    }
    
    requestData.count++;
    
    // Verificar si excede el límite
    if (requestData.count > config.security.rateLimit.max) {
        return res.status(429).json({
            success: false,
            error: {
                message: 'Demasiadas peticiones. Por favor intente más tarde.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((config.security.rateLimit.windowMs - (now - requestData.resetTime)) / 1000)
            }
        });
    }
    
    // Agregar headers informativos
    res.setHeader('X-RateLimit-Limit', config.security.rateLimit.max);
    res.setHeader('X-RateLimit-Remaining', config.security.rateLimit.max - requestData.count);
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + config.security.rateLimit.windowMs).toISOString());
    
    next();
};

module.exports = rateLimiter;