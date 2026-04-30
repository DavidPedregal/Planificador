const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.get('/', dbLimiter, authMiddleware, async function(req, res) {

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