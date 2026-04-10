const express = require('express');
const mongoose = require("mongoose");
const TaskModel = require("./models/TaskModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const tasks = await TaskModel.find({ userId });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo tareas" });
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const allowedFields = ['title', 'description', 'estimatedTime', 'finishDate', 'givenDate', 'frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
        const updateData = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updateData[field] = req.body[field];
            }
        }

        if (req.body.subjectId) {
            if (!mongoose.Types.ObjectId.isValid(req.body.subjectId)) {
                return res.status(400).json({ error: "Invalid subjectId" });
            }
        }

        const newTask = new TaskModel({ userId, subjectId: req.body.subjectId, ...updateData });
        const saved = await newTask.save();
        res.status(201).json(saved);        
    } catch (error) {
        res.status(500).json({ error: "Error saving tasks" });
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    try {
        const task = await TaskModel.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        await TaskModel.deleteOne({ _id: taskId, userId });
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    try {
        const task = await TaskModel.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        if (!req.body.name) {
            return res.status(400).json({ error: "Name is required" });
        }

        task.name = req.body.name;
        const updated = await task.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

module.exports = router;