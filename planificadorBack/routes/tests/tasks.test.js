const request = require('supertest');
const express = require('express');

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../middlewares/authmiddleware', () =>
    (req, _res, next) => {
        req.userId = '507f1f77bcf86cd799439011';
        next();
    }
);

jest.mock('../../middlewares/rateLimiterMiddleware', () => ({
    dbLimiter: (_req, _res, next) => next(),
}));

jest.mock('../models/TaskModel');
const TaskModel = require('../models/TaskModel');

// ── App setup ──────────────────────────────────────────────────────────────────

const tasksRouter = require('../tasks'); // ajusta el nombre si es distinto

const app = express();
app.use(express.json());
app.use('/tasks', tasksRouter);

// ── Helpers ────────────────────────────────────────────────────────────────────

const validTaskId    = '507f1f77bcf86cd799439022';
const validSubjectId = '507f1f77bcf86cd799439033';

function makeTask(overrides = {}) {
    return {
        _id:           validTaskId,
        userId:        '507f1f77bcf86cd799439011',
        title:         'Entregar práctica',
        estimatedTime: 120,
        finishDate:    new Date('2025-06-10T23:59:00Z'),
        givenDate:     new Date('2025-06-01T09:00:00Z'),
        completed:     false,
        save:          jest.fn(),
        ...overrides,
    };
}

const validBody = {
    title:         'Entregar práctica',
    estimatedTime: 120,
    finishDate:    '2025-06-10T23:59:00Z',
    givenDate:     '2025-06-01T09:00:00Z',
};

// ── GET / ──────────────────────────────────────────────────────────────────────

describe('GET /tasks', () => {
    it('devuelve 200 y un array con las tareas del usuario', async () => {
        TaskModel.find.mockResolvedValue([makeTask(), makeTask({ _id: '507f1f77bcf86cd799439044' })]);

        const res = await request(app).get('/tasks');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
    });

    it('devuelve 200 y array vacío si el usuario no tiene tareas', async () => {
        TaskModel.find.mockResolvedValue([]);

        const res = await request(app).get('/tasks');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        TaskModel.find.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/tasks');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});

// ── POST / ────────────────────────────────────────────────────────────────────

describe('POST /tasks', () => {
    it('crea una tarea y devuelve 201', async () => {
        const saved = makeTask();
        TaskModel.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(saved) }));

        const res = await request(app).post('/tasks').send(validBody);

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Entregar práctica');
    });

    it('crea una tarea con subjectId válido y devuelve 201', async () => {
        const saved = makeTask({ subjectId: validSubjectId });
        TaskModel.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(saved) }));

        const res = await request(app)
            .post('/tasks')
            .send({ ...validBody, subjectId: validSubjectId });

        expect(res.statusCode).toBe(201);
    });

    it('devuelve 400 si subjectId no es un ObjectId válido', async () => {
        const res = await request(app)
            .post('/tasks')
            .send({ ...validBody, subjectId: 'no-valido' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/subjectId/i);
    });

    it('solo guarda los campos permitidos (ignora campos extra)', async () => {
        const saved = makeTask();
        TaskModel.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(saved) }));

        await request(app)
            .post('/tasks')
            .send({ ...validBody, campoInventado: 'x' });

        // El constructor recibe un objeto; comprobamos que se llamó
        expect(TaskModel).toHaveBeenCalledWith(
            expect.not.objectContaining({ campoInventado: 'x' })
        );
    });

    it('devuelve 500 si falla el guardado', async () => {
        TaskModel.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(new Error('DB error')),
        }));

        const res = await request(app).post('/tasks').send(validBody);

        expect(res.statusCode).toBe(500);
    });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────

describe('DELETE /tasks/:id', () => {
    it('elimina la tarea y devuelve 200', async () => {
        TaskModel.findOne.mockResolvedValue(makeTask());
        TaskModel.deleteOne.mockResolvedValue({});

        const res = await request(app).delete(`/tasks/${validTaskId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted successfully/i);
        expect(TaskModel.deleteOne).toHaveBeenCalled();
    });

    it('devuelve 404 si la tarea no existe', async () => {
        TaskModel.findOne.mockResolvedValue(null);

        const res = await request(app).delete(`/tasks/${validTaskId}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('devuelve 400 si el id no es un ObjectId válido', async () => {
        const res = await request(app).delete('/tasks/no-valido');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        TaskModel.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app).delete(`/tasks/${validTaskId}`);

        expect(res.statusCode).toBe(500);
    });
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────
// NOTA: el router comprueba req.body.title pero el modelo usa el campo "title".
// Los tests reflejan el comportamiento actual del código; considera corregirlo.

describe('PUT /tasks/:id', () => {
    it('actualiza la tarea cuando se envía title y devuelve 200', async () => {
        const task = makeTask();
        task.save.mockResolvedValue({ ...task, title: 'Nueva tarea' });
        TaskModel.findOne.mockResolvedValue(task);

        const res = await request(app)
            .put(`/tasks/${validTaskId}`)
            .send({ title: 'Nueva tarea' });

        expect(res.statusCode).toBe(200);
        expect(task.save).toHaveBeenCalled();
    });

    it('devuelve 400 si no se envía title', async () => {
        TaskModel.findOne.mockResolvedValue(makeTask());

        const res = await request(app)
            .put(`/tasks/${validTaskId}`)
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    it('devuelve 404 si la tarea no existe', async () => {
        TaskModel.findOne.mockResolvedValue(null);

        const res = await request(app)
            .put(`/tasks/${validTaskId}`)
            .send({ title: 'Nueva tarea' });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('devuelve 400 si el id no es un ObjectId válido', async () => {
        const res = await request(app)
            .put('/tasks/no-valido')
            .send({ title: 'Nueva tarea' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        TaskModel.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
            .put(`/tasks/${validTaskId}`)
            .send({ title: 'Nueva tarea' });

        expect(res.statusCode).toBe(500);
    });
});