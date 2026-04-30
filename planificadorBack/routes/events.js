const express = require('express');
const router = express.Router();
const EventService = require('../services/eventService');
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const events = await EventService.getAllEvents(req.userId);
        res.json(events);
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const saved = await EventService.createEvent(req.userId, req.body);
        res.status(201).json(saved);
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await EventService.updateEvent(req.userId, req.params.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
});

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.updateforwardEvent(req.userId, req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.updateAllEventsInGroup(req.userId, req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteEvent(req.userId, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }  
});

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteForwardEvents(req.userId, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    } 
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteAllEventsInGroup(req.userId, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }   
});

module.exports = router;
