const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // disponible en todas las rutas protegidas
        if (!mongoose.Types.ObjectId.isValid(req.userId)) {
            return res.status(404).json({ error: "User not found" });
        }
        next();
    } catch {
        res.status(401).json({ error: "Token inválido" });
    }
};

module.exports = authMiddleware;