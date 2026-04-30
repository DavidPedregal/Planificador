const express = require('express');
const router = express.Router();
const SubjectService = require('../services/subjectService');
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const subjects = await SubjectService.getSubjectsForUser(req.userId);
        res.status(200).json(subjects);
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const saved = await SubjectService.createSubject(req.userId, req.body);
        res.status(201).json(saved);        
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await SubjectService.deleteSubject(req.userId, req.params.id);
        res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await SubjectService.updateSubject(req.userId, req.params.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
});

module.exports = router;