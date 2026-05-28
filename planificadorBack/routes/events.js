const express = require('express');
const router = express.Router();
const multer = require('multer');
const EventService = require('../services/eventService');
const CalendarRepo = require('../repository/calendarRepository');
const { parseUniversityCsv } = require('../services/importParsers/universityCsvParser');
const { parseGoogleCalendar } = require('../services/importParsers/googleCalendarParser');
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');
const { ValidationError } = require('../errors/AppError');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

router.post('/import', dbLimiter, authMiddleware, upload.single('file'), async function(req, res, next) {
    try {
        const { calendarId, label } = req.body;
        if (!calendarId) throw new ValidationError('calendarId is required');
        if (!req.file)   throw new ValidationError('No file uploaded');

        const calendar = await CalendarRepo.findCalendarForUser(req.userId, calendarId);
        if (!calendar) throw new ValidationError('Calendar not found');

        const text = req.file.buffer.toString('utf-8');
        const ext  = (req.file.originalname.split('.').pop() || '').toLowerCase();

        let parsed;
        if (ext === 'ics') {
            parsed = parseGoogleCalendar(text);
        } else if (ext === 'csv') {
            parsed = parseUniversityCsv(text);
        } else {
            throw new ValidationError('Unsupported file format. Use .csv or .ics');
        }

        if (parsed.length === 0) throw new ValidationError('No valid events found in file');

        const result = await EventService.bulkImportEvents(req.userId, parsed, calendarId, label || null);
        res.status(201).json({ message: 'api.event.imported', data: { count: result.length } });
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const saved = await EventService.createEvent(req.userId, req.body);
        res.status(201).json({ message: "api.event.created", data: saved });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await EventService.updateEvent(req.userId, req.params.id, req.body);
        res.status(200).json({ message: "api.event.updated", data: updated });
    } catch (error) {
        next(error);
    }
});

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.updateforwardEvent(req.userId, req.params.id, req.body);
        res.status(200).json({ message: "api.event.forwardUpdated", data: result });
    } catch (error) {
        next(error);
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.updateAllEventsInGroup(req.userId, req.params.id, req.body);
        res.status(200).json({ message: "api.event.allUpdated", data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/label/:label', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteEventsByLabel(req.userId, req.params.label);
        res.status(200).json({ message: "api.event.labelDeleted", data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteEvent(req.userId, req.params.id);
        res.status(200).json({ message: "api.event.deleted", data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteForwardEvents(req.userId, req.params.id);
        res.status(200).json({ message: "api.event.forwardDeleted", data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await EventService.deleteAllEventsInGroup(req.userId, req.params.id);
        res.status(200).json({ message: "api.event.allDeleted", data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;