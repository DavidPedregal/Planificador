const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // disponible en todas las rutas protegidas
        next();
    } catch {
        res.status(401).json({ error: "Token inválido" });
    }
};

module.exports = authMiddleware;