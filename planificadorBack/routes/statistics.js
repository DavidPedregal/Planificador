const express = require('express');
const router = express.Router();
const StatisticService = require('../services/statisticService');
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/subject-time', dbLimiter, authMiddleware, async (req, res, next) => {
    try {
        const data = await StatisticService.getSubjectTimeStatistics(req.userId, req.query.from, req.query.to);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
});

router.get('/comparison-time', dbLimiter, authMiddleware, async (req, res, next) => {
    try {
        const data = await StatisticService.getComparisonTimeStatistics(req.userId, req.query.from, req.query.to);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
