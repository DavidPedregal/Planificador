var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");
const Calendar = require("./models/CalendarModel");
const authMiddleware = require("../middlewares/authmiddleware");

router.get('/', authMiddleware, async function(req, res) {
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ error: "User not found" });
    }

    try {
        const calendars = await Calendar.find({ userId });
        res.json(calendars);
    } catch (error) {
        res.status(500).json({ error: "Error obtaining calendars" });
    }
});

router.post('/', authMiddleware, async function(req, res) {
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ error: "User not found" });
    }

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

router.delete('/:id', authMiddleware, async function(req, res) {
    const userId = req.userId;
    const calendarId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ error: "User not found" });
    }

    try {
        const calendar = await Calendar.findOne({ _id: calendarId, userId });
        if (!calendar) {
            return res.status(404).json({ error: "Calendar not found" });
        }
        await Calendar.deleteOne({ _id: calendarId });
        fetch(`${process.env.BACKEND_URL}/events/calendar/${calendarId}`, {
            headers: { Authorization: `Bearer ${req.headers.authorization?.split(" ")[1]}` },
            method: 'DELETE'
        })
        res.json({ message: "Calendar deleted" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting calendar" });
    }
});

module.exports = router;
