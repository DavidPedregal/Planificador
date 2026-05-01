const express = require('express');
const mongoose = require("mongoose");
const PlanService = require('../services/planService.js');
const EventService = require('../services/eventService.js');
const TaskService = require('../services/taskService.js');
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

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

        const response = await fetch(`${process.env.PLANNER_URL}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: tasks, plannableSlots: plannableSlots, previousPlan: previousPlan })
        });
        if (!response.ok) {
            throw new Error('Planner service failed');
        }
        const planData = await response.json();
        await PlanService.addPlan(req.userId, planData.scheduled);
        res.status(201).json({ message: 'Plan created successfully', response });
    } catch (error){
        next(error);
    }
});

router.post('/reset', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await PlanService.deletePlan(req.userId);
        const plannableSlots = await EventService.getPlannableEventsForUser(req.userId);
        const tasks = await TaskService.getTasksToPlan(req.userId);

        const response = await fetch(`${process.env.PLANNER_URL}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: tasks, plannableSlots: plannableSlots, previousPlan: {} })
        });
        const planData = await response.json();
        await PlanService.addPlan(req.userId, planData.scheduled);
        res.status(201).json({ message: 'Plan created successfully', response });
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

/*
POST /plan          → planifica encima de lo existente (respeta lo anterior)
POST /plan/reset    → borra todo y planifica desde cero
DELETE /plan        → borra toda la planificación
PATCH /plan/:id     → marca como completed/uncompleted, guarda userTime
DELETE /plan/:id    → borra un evento de planificación concreto
GET /plan           → devuelve la planificación actual (para mostrar en calendario)
*/

/*
El POST:
1. Obtener eventos planificables (calendarId = "Plannable")
2. Obtener planificación existente (status = pending)
3. Obtener tareas pendientes
    Tareas elegibles para planificación:
    - completed = false
    - plannable = true
    - finishDate >= hoy (inclusive si hay huecos disponibles hoy)
4. Llamar al microservicio Python con todo eso
5. Guardar los bloques que devuelve Python en BD
6. Devolver la planificación al frontend
*/