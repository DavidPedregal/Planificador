// middleware/rateLimiters.js
const RateLimit = require('express-rate-limit');

const authLimiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Demasiados intentos de autenticación, intenta más tarde." },
});

const dbLimiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Demasiadas peticiones, intenta más tarde." },
});

module.exports = { authLimiter, dbLimiter };