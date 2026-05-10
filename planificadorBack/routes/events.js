const express = require('express');
const router = express.Router();
const EventService = require('../services/eventService');
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const events = await EventService.getAllEvents(req.userId);
        res.status(200).json({ data: events });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const event = await EventService.getEventById(req.userId, req.params.id);
        res.status(200).json({ data: event });
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const saved = await EventService.createEvent(req.userId, req.body);
        res.status(201).json({ message: "Event created successfully", data: saved });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await EventService.updateEvent(req.userId, req.params.id, req.body);
        res.status(200).json({ message: "Event updated successfully", data: updated });
    } catch (error) {
        next(error);
    }
});

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.updateforwardEvent(req.userId, req.params.id, req.body);
        res.status(200).json({ message: "Forward event updated successfully", data: result });
    } catch (error) {
        next(error);
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.updateAllEventsInGroup(req.userId, req.params.id, req.body);
        res.status(200).json({ message: "All events in group updated successfully", data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/label/:label', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteEventsByLabel(req.userId, req.params.label);
        res.status(200).json({ message: "Events deleted successfully", data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteEvent(req.userId, req.params.id);
        res.status(200).json({ message: "Event deleted successfully", data: result });
    } catch (error) {
        next(error);
    }  
});

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteForwardEvents(req.userId, req.params.id);
        res.status(200).json({ message: "Forward events deleted successfully", data: result });
    } catch (error) {
        next(error);
    } 
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteAllEventsInGroup(req.userId, req.params.id);
        res.status(200).json({ message: "All events in group deleted successfully", data: result });
    } catch (error) {
        next(error);
    }   
});

module.exports = router;
