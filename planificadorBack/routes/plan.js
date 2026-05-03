const express = require('express');
const mongoose = require("mongoose");
const PlanService = require('../services/planService.js');
const EventService = require('../services/eventService.js');
const TaskService = require('../services/taskService.js');
const CalendarService = require('../services/calendarService.js');
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');
const { mapPreviousPlan, mapSlots, mapTasks, mapPlanData } = require('./helper/planHelper.js');

router.get('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try{
        const plan = await PlanService.getPlanForUser(req.userId);
        res.status(200).json(plan);
    } catch (error) {
        next(error);
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const previousPlan = await PlanService.getPlanForUser(req.userId);
        const plannableSlots = await EventService.getPlannableEventsForUser(req.userId);
        const tasks = await TaskService.getTasksToPlan(req.userId);

        const mappedPreviousPlan = mapPreviousPlan(previousPlan);
        const mappedPlannableSlots = mapSlots(plannableSlots);
        const mappedTasks = mapTasks(tasks);

        const response = await fetch(`${process.env.PLANNER_URL}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: mappedTasks, plannableSlots: mappedPlannableSlots, previousPlan: mappedPreviousPlan })
        });
        if (!response.ok) {
            throw new Error('Planner service failed');
        }
        const planData = await response.json(); 

        const systemCalendars = await CalendarService.getSystemCalendarsForUser(req.userId);
        const plannedCalendar = systemCalendars.find(cal => cal.name === "Planned");

        const mappedPlanData = mapPlanData(planData.scheduled, plannedCalendar._id, req.userId);
        await PlanService.addPlan(mappedPlanData);

        res.status(201).json({ message: 'Plan created successfully', warnings: planData.warnings });
    } catch (error){
        next(error);
    }
});

router.post('/reset', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await PlanService.deletePlan(req.userId);
        const plannableSlots = await EventService.getPlannableEventsForUser(req.userId);
        const tasks = await TaskService.getTasksToPlan(req.userId);

        const mappedPlannableSlots = mapSlots(plannableSlots);
        const mappedTasks = mapTasks(tasks);

        const response = await fetch(`${process.env.PLANNER_URL}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: mappedTasks, plannableSlots: mappedPlannableSlots, previousPlan: {} })
        });
        if (!response.ok) {
            throw new Error('Planner service failed');
        }
        const planData = await response.json();

        const systemCalendars = await CalendarService.getSystemCalendarsForUser(req.userId);
        const plannedCalendar = systemCalendars.find(cal => cal.name === "Planned");

        const mappedPlanData = mapPlanData(planData.scheduled, plannedCalendar._id, req.userId);
        await PlanService.addPlan(mappedPlanData);

        res.status(201).json({ message: 'Plan created successfully', warnings: planData.warnings });
    } catch (error){
        next(error);
    }
});

router.patch('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const updated = await PlanService.updatePlanEvent(req.userId, req.params.id, req.body)
        res.status(200).json({ message: 'Plan event updated successfully' });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const deleted = await PlanService.deletePlanEvent(req.userId, req.params.id);
        res.status(200).json({ message: 'Plan event deleted successfully' });
    } catch (error) {
        next(error);
    }
});

router.delete('/', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        const deleted = await PlanService.deletePlan(req.userId);
        res.status(200).json({ message: 'Plan deleted successfully' });
    } catch(error) {
        next(error);
    }
});

module.exports = router;