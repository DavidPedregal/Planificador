const express = require('express');
const mongoose = require("mongoose");
const TaskModel = require("./models/TaskModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

function calculateNextDates(task) {
    if (!task.frequencyType || task.frequencyType === 'none') {
        return null;
    }

    const currentFinishDate = new Date(task.finishDate);
    const currentGivenDate = new Date(task.givenDate);
    let newFinishDate = new Date(currentFinishDate);
    let newGivenDate = new Date(currentGivenDate);
    const interval = task.frequencyInterval || 1;

    switch (task.frequencyType) {
        case 'day':
            newFinishDate.setDate(newFinishDate.getDate() + interval);
            newGivenDate.setDate(newGivenDate.getDate() + interval);
            break;

        case 'week':
            newFinishDate.setDate(newFinishDate.getDate() + 7 * interval);
            newGivenDate.setDate(newGivenDate.getDate() + 7 * interval);
            break;

        case 'month':
            newFinishDate.setMonth(newFinishDate.getMonth() + interval);
            newGivenDate.setMonth(newGivenDate.getMonth() + interval);
            break;

        case 'year':
            newFinishDate.setFullYear(newFinishDate.getFullYear() + interval);
            newGivenDate.setFullYear(newGivenDate.getFullYear() + interval);
            break;

        default:
            return null;
    }

    // Check if we've exceeded the end date
    if (task.frequencyEndType === 'on' && task.frequencyEndDate) {
        if (newFinishDate > new Date(task.frequencyEndDate)) {
            return null;
        }
    }
    // Check if we've exceeded the occurrences limit
    else if (task.frequencyEndType === 'after' && task.frequencyOccurrencesLeft) {
        if (task.frequencyOccurrencesLeft <= 1) {
            return null;
        }
    }

    return { newFinishDate, newGivenDate };
}

async function generateNextTask(task) {
    const nextDates = calculateNextDates(task);
    if (!nextDates) {
        return null;
    }

    const newTaskData = {
        userId: task.userId,
        subjectId: task.subjectId,
        title: task.title,
        description: task.description,
        estimatedTime: task.estimatedTime,
        finishDate: nextDates.newFinishDate,
        givenDate: nextDates.newGivenDate,
        frequencyType: task.frequencyType,
        frequencyEndDate: task.frequencyEndDate,
        frequencyOccurrencesLeft: task.frequencyOccurrencesLeft ? task.frequencyOccurrencesLeft - 1 : undefined,
        frequencyInterval: task.frequencyInterval,
        frequencyDaysOfWeek: task.frequencyDaysOfWeek,
        frequencyEndType: task.frequencyEndType,
        completed: false,
        generatedFromTaskId: task._id
    };

    const newTask = new TaskModel(newTaskData);
    return await newTask.save();
}

async function findAndDeleteGeneratedTask(task) {
    try {
        const generatedTask = await TaskModel.findOne({
            generatedFromTaskId: task._id,
            userId: task.userId,
            completed: false
        });

        if (generatedTask) {
            await TaskModel.deleteOne({ _id: generatedTask._id });
        }
    } catch (error) {
        // If the task doesn't exist, that's fine - user may have already deleted it
    }
}

function validateData(data) {
    const allowedFields = ['title', 'description', 'estimatedTime', 'finishDate', 'givenDate', 'frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = data[field];
        }
    }

    if (data.subjectId) {
        if (!mongoose.Types.ObjectId.isValid(data.subjectId)) {
            return res.status(400).json({ error: "Invalid subjectId" });
        }
    }

    return updateData;
}

router.get('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const tasks = await TaskModel.find({ userId });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo tareas" });
    }
});

router.get('/:id', dbLimiter, authMiddleware, async function(req, res) {
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
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo tareas" });
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const validatedData = validateData(req.body);

        validatedData.userId = userId;
        validatedData.subjectId = req.body.subjectId || null;

        const newTask = new TaskModel(validatedData);
        const saved = await newTask.save();
        res.status(201).json(saved);        
    } catch (error) {
        console.error("Error saving task:", error);
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

        const updateData = validateData(req.body);

        updateData.userId = userId;
        updateData.subjectId = req.body.subjectId || null;

        task.set(updateData);
        const updated = await task.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

router.put('/toggle/:id', dbLimiter, authMiddleware, async function(req, res) {
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

        const isMarkingAsCompleted = !task.completed;

        // If marking as completed and task has recurrence, generate the next task
        if (isMarkingAsCompleted && task.frequencyType && task.frequencyType !== 'none') {
            await generateNextTask(task);
        }
        // If marking as uncompleted, find and delete the generated task
        else if (!isMarkingAsCompleted) {
            await findAndDeleteGeneratedTask(task);
        }

        task.completed = !task.completed;
        const updated = await task.save();
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

module.exports = router;