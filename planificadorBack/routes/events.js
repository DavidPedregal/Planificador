const express = require('express');
const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEventModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");

router.get('/', authMiddleware, async function(req, res) {
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ error: "User not found" });
    }

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

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(req.body.calendarId)) {
            return res.status(400).json({ error: "Invalid calendarId" });
        }

        if (!req.body.name || !req.body.start || !req.body.end || !req.body.calendarId) {
            return res.status(400).json({ error: "Name, start, end and calendarId are required" });
        }

        const newCalendar = new CalendarEvent({ userId, ...req.body });
        const saved = await newCalendar.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
