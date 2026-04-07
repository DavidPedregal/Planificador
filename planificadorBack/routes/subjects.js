const express = require('express');
const mongoose = require("mongoose");
const SubjectModel = require("./models/SubjectModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const subjects = await SubjectModel.find({ userId });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo materias" });
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        if (!req.body.name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const newSubject = new SubjectModel({ userId, name: req.body.name });
        const saved = await newSubject.save();
        res.status(201).json(saved);        
    } catch (error) {
        res.status(500).json({ error: "Error saving subjects" });
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const subjectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ error: "Invalid subject ID" });
    }

    try {
        const subject = await SubjectModel.findOne({ _id: subjectId, userId });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        await SubjectModel.deleteOne({ _id: subjectId, userId });
        res.json({ message: "Subject deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting subject" });
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const subjectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ error: "Invalid subject ID" });
    }

    try {
        const subject = await SubjectModel.findOne({ _id: subjectId, userId });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        if (!req.body.name) {
            return res.status(400).json({ error: "Name is required" });
        }

        subject.name = req.body.name;
        const updated = await subject.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating subject" });
    }
});

module.exports = router;