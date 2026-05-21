const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "api.auth.unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        if (!mongoose.Types.ObjectId.isValid(req.userId)) {
            return res.status(404).json({ message: "api.auth.userNotFound" });
        }
        next();
    } catch {
        res.status(401).json({ message: "api.auth.invalidToken" });
    }
};

module.exports = authMiddleware;