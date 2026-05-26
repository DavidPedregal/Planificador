const express = require('express');
const SettingsService = require('../services/settingsService.js');
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try{
        const settings = await SettingsService.getSettingsForUser(req.userId);
        res.status(200).json({ data: settings });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await SettingsService.updateSettings(req.userId, req.body);
        res.status(200).json({ message: 'api.settings.updated' });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await SettingsService.deleteSettings(req.userId);
        res.status(200).json({ message: 'api.settings.deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;