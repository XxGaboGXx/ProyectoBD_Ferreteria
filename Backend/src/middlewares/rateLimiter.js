const rateLimit = require('express-rate-limit');

// ============================================
// CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
// ============================================
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

// ============================================
// RATE LIMITER GENERAL - MUY PERMISIVO
// ============================================
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 300, // 300 peticiones por minuto
    message: {
        error: 'Demasiadas peticiones',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Desactivar en desarrollo o cuando RATE_LIMIT_ENABLED=false
    skip: (req) => {
        const isLocalIP = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip?.startsWith('192.168.');
        const skipInDev = !isProduction && isLocalIP;
        const skipByConfig = !rateLimitEnabled;
        
        if (skipInDev || skipByConfig) {
            return true;
        }
        return false;
    },
    handler: (req, res) => {
        console.warn(`⚠️ Rate limit excedido: ${req.ip} - ${req.method} ${req.path}`);
        res.status(429).json({
            error: 'Demasiadas peticiones',
            message: 'Por favor espera un momento antes de reintentar',
            retryAfter: 60
        });
    }
});

// ============================================
// RATE LIMITER PARA ESCRITURA
// ============================================
const writeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    skip: (req) => !rateLimitEnabled || (!isProduction && (req.ip === '::1' || req.ip === '127.0.0.1'))
});

// ============================================
// RATE LIMITER PARA AUTENTICACIÓN
// ============================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    skip: (req) => !rateLimitEnabled
});

// ============================================
// RATE LIMITER PARA OPERACIONES PESADAS
// ============================================
const heavyLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    skip: (req) => !rateLimitEnabled || (!isProduction && (req.ip === '::1' || req.ip === '127.0.0.1'))
});

module.exports = {
    generalLimiter,
    writeLimiter,
    authLimiter,
    heavyLimiter
};