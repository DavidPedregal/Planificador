const express = require('express');
const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEvent");
const router = express.Router();

router.get('/:userId', async function(req, res) {
    const userId = req.params.userId;

    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //     return res.status(404).json({ error: "User not found" });
    // }

    try {
        const events = await CalendarEvent.find({ userId });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo eventos" });
    }
});

router.post('/', async function(req, res) {
    try {
        const newCalendar = new CalendarEvent(req.body);
        const saved = await newCalendar.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
