const express = require('express');
const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEventModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");

router.get('/', authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const events = await CalendarEvent.find({ userId });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo eventos" });
    }
});

router.post('/', authMiddleware, async function(req, res) {
    try {
        const userId = req.userId;
        console.log("Body:", req.body);

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

router.delete('/:id', authMiddleware, async function(req, res) {
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

router.put('/:id', authMiddleware, async function(req, res) {
    const eventId = req.params.id;

    console.log(req.body);
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    try {
        const updatedEvent = await CalendarEvent.findOneAndUpdate(
            { _id: eventId },
            req.body,
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

router.delete('/calendar/:calendarId', authMiddleware, async function(req, res) {

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
