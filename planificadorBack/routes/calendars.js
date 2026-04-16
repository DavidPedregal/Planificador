var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");
const Calendar = require("./models/CalendarModel");
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const calendars = await Calendar.find({ userId });
        res.json(calendars);
    } catch (error) {
        res.status(500).json({ error: "Error obtaining calendars" });
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        if (!req.body.name || !req.body.color) {
            return res.status(400).json({ error: "Name and color are required" });
        }

        const newCalendar = new Calendar({ userId, ...req.body });
        const saved = await newCalendar.save();
        res.status(201).json(saved);        
    } catch (error) {
        res.status(500).json({ error: "Error saving calendars" });
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const calendarId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res.status(400).json({ error: "Invalid calendar ID" });
    }

    try {
        const calendar = await Calendar.findOne({ _id: calendarId, userId });
        if (!calendar) {
            return res.status(404).json({ error: "Calendar not found" });
        }
        await Calendar.deleteOne({ _id: calendarId });
        const calendarIdForRequest = encodeURIComponent(calendar._id.toString());
        await fetch(`${process.env.BACKEND_URL}/events/calendar/${calendarIdForRequest}`, {
            headers: { Authorization: `Bearer ${req.headers.authorization?.split(" ")[1]}` },
            method: 'DELETE'
        });
        res.json({ message: "Calendar deleted" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting calendar" });
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const calendarId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res.status(400).json({ error: "Invalid calendar ID" });
    }

    try {
        const calendar = await Calendar.findOne({ _id: calendarId, userId });
        if (!calendar) {
            return res.status(404).json({ error: "Calendar not found" });
        }
        const updatedData = req.body;
        const updatedCalendar = await Calendar.findByIdAndUpdate(calendarId, updatedData, { new: true });
        res.json(updatedCalendar);
    } catch (error) {
        res.status(500).json({ error: "Error updating calendar" });
    }
});

module.exports = router;
