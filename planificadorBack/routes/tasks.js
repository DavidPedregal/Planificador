const express = require('express');
const mongoose = require("mongoose");
const TaskModel = require("./models/TaskModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');
const { FREQUENCY_TYPE } = require("./models/enums/enums");

/**
 * Generate recurring tasks based on the recurrence rule
 * @param {Object} baseTask - The base task to generate recurrences from
 * @returns {Array} Array of task objects to be created
 */
function generateRecurringTasks(baseTask) {
    const tasks = [baseTask];
    
    // If no frequency type or it's "none", return just the base task
    if (!baseTask.frequencyType || baseTask.frequencyType === FREQUENCY_TYPE.NONE) {
        return tasks;
    }

    let currentFinishDate = new Date(baseTask.finishDate);
    let currentGivenDate = new Date(baseTask.givenDate);
    let occurrencesLeft = baseTask.frequencyOccurrencesLeft;
    const endDate = baseTask.frequencyEndDate ? new Date(baseTask.frequencyEndDate) : null;
    const interval = baseTask.frequencyInterval || 1;
    const frequencyType = baseTask.frequencyType;
    const endType = baseTask.frequencyEndType;
    const daysOfWeek = baseTask.frequencyDaysOfWeek || [];

    // Helper function to create next task
    function createNextTask(finishDate, givenDate, occurrencesLeftValue) {
        const task = {
            ...baseTask,
            finishDate: new Date(finishDate),
            givenDate: new Date(givenDate),
            _id: undefined // Let MongoDB generate new IDs
        };
        
        // Update frequencyOccurrencesLeft if provided
        if (occurrencesLeftValue !== undefined) {
            task.frequencyOccurrencesLeft = occurrencesLeftValue;
        }
        
        delete task.__v; // Remove version field if exists
        return task;
    }

    // Generate recurrences based on frequency type
    while (true) {
        let nextFinishDate = new Date(currentFinishDate);
        let nextGivenDate = new Date(currentGivenDate);
        
        // Calculate next occurrence based on frequency type
        if (frequencyType === FREQUENCY_TYPE.DAYS) {
            nextFinishDate.setDate(nextFinishDate.getDate() + interval);
            nextGivenDate.setDate(nextGivenDate.getDate() + interval);
        } else if (frequencyType === FREQUENCY_TYPE.WEEKS) {
            if (daysOfWeek.length > 0) {
                // For weekly with specific days
                let found = false;
                
                // Find next occurrence on the specified days
                for (let i = 1; i <= 7; i++) {
                    const checkDate = new Date(nextFinishDate);
                    checkDate.setDate(checkDate.getDate() + i);
                    const checkDay = checkDate.getDay();
                    
                    if (daysOfWeek.includes(checkDay)) {
                        nextFinishDate = checkDate;
                        nextGivenDate = new Date(checkDate);
                        const timeDiff = new Date(baseTask.finishDate) - new Date(baseTask.givenDate);
                        nextGivenDate.setTime(nextGivenDate.getTime() - timeDiff);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    break; // This shouldn't happen with valid input
                }
            } else {
                nextFinishDate.setDate(nextFinishDate.getDate() + (interval * 7));
                nextGivenDate.setDate(nextGivenDate.getDate() + (interval * 7));
            }
        } else if (frequencyType === FREQUENCY_TYPE.MONTHS) {
            nextFinishDate.setMonth(nextFinishDate.getMonth() + interval);
            nextGivenDate.setMonth(nextGivenDate.getMonth() + interval);
        } else if (frequencyType === FREQUENCY_TYPE.YEARS) {
            nextFinishDate.setFullYear(nextFinishDate.getFullYear() + interval);
            nextGivenDate.setFullYear(nextGivenDate.getFullYear() + interval);
        }

        // Check if we should continue generating
        let shouldContinue = true;

        if (endType === "after" && occurrencesLeft !== undefined) {
            occurrencesLeft--;
            if (occurrencesLeft <= 0) {
                shouldContinue = false;
            }
        } else if (endType === "on" && endDate) {
            if (nextFinishDate > endDate) {
                shouldContinue = false;
            }
        }

        if (!shouldContinue) {
            break;
        }

        tasks.push(createNextTask(nextFinishDate, nextGivenDate, occurrencesLeft));
        currentFinishDate = nextFinishDate;
        currentGivenDate = nextGivenDate;
    }

    return tasks;
}

function validateData(data, checkRecurrence = false) {
    const allowedFields = ['title', 'description', 'estimatedTime', 'finishDate', 'givenDate'];
    const recurrenceFields = ['frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = data[field];
        }
    }

    if (checkRecurrence) {
        for (const field of recurrenceFields) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                updateData[field] = data[field];
            }
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
        const validatedData = validateData(req.body, true);

        validatedData.userId = userId;
        validatedData.subjectId = req.body.subjectId || null;

        // Create base task
        const baseTask = validatedData;

        // Generate all recurring tasks if applicable
        const tasksToCreate = generateRecurringTasks(baseTask);

        const groupId = new mongoose.Types.ObjectId().toString();

        // If multiple tasks are generated, assign them a common groupId
        if (tasksToCreate.length > 1) {
            tasksToCreate.forEach(task => {
                task.groupId = groupId;
            });
        }

        // Save all tasks
        const saved = await TaskModel.insertMany(tasksToCreate);
        res.status(201).json(tasksToCreate.length === 1 ? saved[0] : saved);
    } catch (error) {
        res.status(500).json({ error: "Error saving tasks" });
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

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    const validation = validatetaskData(req.body, { isCreation: false });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const originaltask = await Calendartask.findOne({ _id: taskId, userId });
        if (!originaltask) {
            return res.status(404).json({ error: "task not found" });
        }

        const changedFields = getChangedFields(validation.data, originaltask);

        if (Object.keys(changedFields).length === 0) {
            return res.status(200).json({ message: "No changes detected", modifiedCount: 0 });
        }

        const updateQuery = originaltask.groupId
            ? { groupId: originaltask.groupId, userId, start: { $gte: originaltask.start } }
            : { _id: taskId, userId };

        const result = await Calendartask.updateMany(updateQuery, { $set: changedFields });

        res.json({
            message: `${result.modifiedCount} task(s) updated successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    const validation = validatetaskData(req.body, { isCreation: false });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const originaltask = await Calendartask.findOne({ _id: taskId, userId });
        if (!originaltask) {
            return res.status(404).json({ error: "task not found" });
        }

        const changedFields = getChangedFields(validation.data, originaltask);

        if (Object.keys(changedFields).length === 0) {
            return res.status(200).json({ message: "No changes detected", modifiedCount: 0 });
        }

        const updateQuery = originaltask.groupId
            ? { groupId: originaltask.groupId, userId }
            : { _id: taskId, userId };

        const result = await Calendartask.updateMany(updateQuery, { $set: changedFields });

        res.json({
            message: `${result.modifiedCount} task(s) updated successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: error.message });
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
        task.completed = !task.completed;
        const updated = await task.save();
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
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

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    try {
        const task = await TaskModel.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: "task not found" });
        }

        const deleteQuery = task.groupId
            ? { groupId: task.groupId, userId, finishDate: { $gte: task.finishDate } }
            : { _id: taskId, userId };

        const result = await TaskModel.deleteMany(deleteQuery);

        res.json({
            message: `${result.deletedCount} task(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }

    try {
        const deleted = await TaskModel.findOneAndDelete({ _id: taskId, userId });
        if (!deleted) {
            return res.status(404).json({ error: "task not found" });
        }

        await TaskModel.deleteMany({ groupId: deleted.groupId, userId });

        res.status(200).json({ message: "tasks deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }   
});

module.exports = router;