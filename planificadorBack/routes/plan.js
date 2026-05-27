const express = require('express');
const PlanService = require('../services/planService.js');
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try{
        const plan = await PlanService.getPlanForUser(req.userId);
        res.status(200).json({ data: plan });
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const { mappedPreviousPlan, mappedPlannableSlots, mappedTasks } = await PlanService.getDataToPlan(req.userId);
        const taskIsReviewMap = Object.fromEntries(mappedTasks.map(t => [t.taskId, t.isReview ?? false]));
        const response = await fetch(`${process.env.PLANNER_URL}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: mappedTasks, plannableSlots: mappedPlannableSlots, previousPlan: mappedPreviousPlan })
        });
        if (!response.ok) {
            throw new Error('Planner service failed');
        }
        const planData = await response.json();
        await PlanService.addPlan(planData.scheduled, req.userId, taskIsReviewMap);
        res.status(201).json({ message: 'api.plan.created', data: planData.warnings });
    } catch (error){
        next(error);
    }
});

router.post('/reset', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await PlanService.deletePlan(req.userId);
        const { mappedPreviousPlan, mappedPlannableSlots, mappedTasks } = await PlanService.getDataToPlan(req.userId);
        const taskIsReviewMap = Object.fromEntries(mappedTasks.map(t => [t.taskId, t.isReview ?? false]));

        const response = await fetch(`${process.env.PLANNER_URL}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: mappedTasks, plannableSlots: mappedPlannableSlots, previousPlan: mappedPreviousPlan })
        });
        if (!response.ok) {
            throw new Error('Planner service failed');
        }
        const planData = await response.json();

        await PlanService.addPlan(planData.scheduled, req.userId, taskIsReviewMap);

        res.status(201).json({ message: 'api.plan.created', data: planData.warnings });
    } catch (error){
        next(error);
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await PlanService.updatePlanEvent(req.userId, req.params.id, req.body)
        res.status(200).json({ message: 'api.plan.eventUpdated' });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await PlanService.deletePlanEvent(req.userId, req.params.id);
        res.status(200).json({ message: 'api.plan.eventDeleted' });
    } catch (error) {
        next(error);
    }
});

router.delete('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await PlanService.deletePlan(req.userId);
        res.status(200).json({ message: 'api.plan.deleted' });
    } catch(error) {
        next(error);
    }
});

module.exports = router;