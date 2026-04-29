const express = require('express');
const router = express.Router();
import * as TaskService from '../services/taskService';
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const tasks = await TaskService.getAllTasks(req.userId);
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    const userId = req.userId;
    const taskId = req.params.id;

    try {
        const task = await TaskService.getTaskById(userId, taskId);
        res.status(200).json(task);
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const tasksToCreate = await TaskService.createTasks(req.userId, req.body);
        res.status(201).json(tasksToCreate);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const task = await TaskService.getTaskById(req.userId, req.params.id);
        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
});

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.updateforwardTask(req.userId, req.params.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error updating task:", error);
        next(error);
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.updateAllTasksInGroup(req.userId, req.params.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error updating task:", error);
        next(error);
    }
});

router.put('/toggle/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await TaskService.toggleTaskCompletion(req.userId, req.params.id);
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await TaskService.deleteTask(req.userId, req.params.id);
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.deleteForwardTask(req.userId, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.deleteAllTasksInGroup(req.userId, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;