const express = require('express');
const router = express.Router();
const TaskService = require('../services/taskService');
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
    try {
        const task = await TaskService.getTaskById(req.userId, req.params.id);
        res.status(200).json(task);
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const tasksToCreate = await TaskService.createTasks(req.userId, req.body);
        res.status(201).json({ message: 'Tasks created successfully', data: tasksToCreate });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const task = await TaskService.updateTask(req.userId, req.params.id, req.body);
        res.status(200).json({ message: 'Task updated successfully', data: task });
    } catch (error) {
        next(error);
    }
});

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.updateForwardTask(req.userId, req.params.id, req.body);
        res.status(200).json({ message: 'Task(s) forwarded successfully', data: result });
    } catch (error) {
        next(error);
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.updateAllTasksInGroup(req.userId, req.params.id, req.body);
        res.status(200).json({ message: 'Tasks updated successfully', data: result });
    } catch (error) {
        next(error);
    }
});

router.put('/toggle/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await TaskService.toggleTaskCompletion(req.userId, req.params.id);
        res.status(200).json({ message: 'Task completion toggled successfully', data: updated });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await TaskService.deleteTask(req.userId, req.params.id);
        res.status(200).json({ message: 'Task deleted successfully', data: updated });
    } catch (error) {
        next(error);
    }
});

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.deleteForwardTasks(req.userId, req.params.id);
        res.status(200).json({ message: 'Task(s) deleted successfully', data: result });
    } catch (error) {
        next(error);
    }
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const result = await TaskService.deleteAllTasksInGroup(req.userId, req.params.id);
        res.status(200).json({ message: 'Tasks deleted successfully', data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;