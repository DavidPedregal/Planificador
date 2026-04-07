const express = require('express');
const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEventModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const events = await CalendarEvent.find({ userId });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo eventos" });
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res) {
    try {
        const userId = req.userId;
        console.log("Data received for new event:", req.body);

        if (!mongoose.Types.ObjectId.isValid(req.body.calendarId)) {
            return res.status(400).json({ error: "Invalid calendarId" });
        }

        if (!req.body.title || !req.body.start || !req.body.end || !req.body.calendarId) {
            return res.status(400).json({ error: "Title, start, end and calendarId are required" });
        }

        const newCalendar = new CalendarEvent({ userId, ...req.body });
        const saved = await newCalendar.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    try {
        const deleted = await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
        if (!deleted) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting event" });
    }   
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    const allowedFields = ['title', 'start', 'end', 'calendarId', 'description', 'color', 
        'useCalendarColor', 'label', 'frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 
        'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updateData[field] = req.body[field];
        }
    }

    // If calendarId is being updated, validate it
    if (Object.prototype.hasOwnProperty.call(updateData, 'calendarId')) {
        if (!mongoose.Types.ObjectId.isValid(updateData.calendarId)) {
            return res.status(400).json({ error: "Invalid calendarId" });
        }
    }
	
    // Disallow empty updates
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
    }

    try {
        const updatedEvent = await CalendarEvent.findOneAndUpdate(
            { _id: eventId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        if (!updatedEvent) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/calendar/:calendarId', dbLimiter, authMiddleware, async function(req, res) {

    const userId = req.userId;
    const calendarId = req.params.calendarId;

    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res.status(400).json({ error: "Invalid calendar ID" });
    }

    try {
        const deleted = await CalendarEvent.deleteMany({ calendarId, userId });
        res.json({ message: `${deleted.deletedCount} events deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: "Error deleting events" });
    }
});

module.exports = router;
