var express = require('express');
var router = express.Router();
const CalendarService = require('../services/calendarService');
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const calendars = await CalendarService.getCustomCalendarsForUser(req.userId);
        res.status(200).json({ data: calendars });
    } catch (error) {
        next(error);
    }
});

router.get('/common', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const commonCalendars = await CalendarService.getSystemCalendarsForUser(req.userId);
        res.status(200).json({ data: commonCalendars });
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const saved = await CalendarService.createCalendarForUser(req.userId, req.body);
        res.status(201).json({ data: saved, message: "api.calendar.created" });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await CalendarService.deleteCalendarForUser(req.userId, req.params.id);
        res.status(200).json({ message: "api.calendar.deleted" });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updatedCalendar = await CalendarService.updateCalendarForUser(req.userId, req.params.id, req.body);
        res.status(200).json({ data: updatedCalendar, message: "api.calendar.updated" });
    } catch (error) {
        next(error);
    }
});

router.put('/toggleVisibility/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updatedCalendar = await CalendarService.toggleCalendarVisibilityForUser(req.userId, req.params.id);
        res.status(200).json({ data: updatedCalendar, message: "api.calendar.visibilityChanged" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;