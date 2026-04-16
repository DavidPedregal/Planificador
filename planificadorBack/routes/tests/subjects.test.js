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

jest.mock('../models/SubjectModel');
const SubjectModel = require('../models/SubjectModel');

// ── App setup ──────────────────────────────────────────────────────────────────

const subjectsRouter = require('../subjects'); // ajusta el nombre si es distinto

const app = express();
app.use(express.json());
app.use('/subjects', subjectsRouter);

// ── Helpers ────────────────────────────────────────────────────────────────────

const validSubjectId = '507f1f77bcf86cd799439022';

function makeSubject(overrides = {}) {
    return {
        _id:    validSubjectId,
        userId: '507f1f77bcf86cd799439011',
        name:   'Matematicas',
        save:   jest.fn(),
        ...overrides,
    };
}

// ── GET / ──────────────────────────────────────────────────────────────────────

describe('GET /subjects', () => {
    it('devuelve 200 y un array con las materias del usuario', async () => {
        SubjectModel.find.mockResolvedValue([makeSubject(), makeSubject({ _id: '507f1f77bcf86cd799439033', name: 'Historia' })]);

        const res = await request(app).get('/subjects');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
    });

    it('devuelve 200 y array vacio si el usuario no tiene materias', async () => {
        SubjectModel.find.mockResolvedValue([]);

        const res = await request(app).get('/subjects');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        SubjectModel.find.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/subjects');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});

// ── POST / ────────────────────────────────────────────────────────────────────

describe('POST /subjects', () => {
    it('crea una materia y devuelve 201', async () => {
        const saved = makeSubject({ name: 'Fisica' });
        SubjectModel.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(saved) }));

        const res = await request(app).post('/subjects').send({ name: 'Fisica' });

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Fisica');
    });

    it('devuelve 400 si falta el nombre', async () => {
        const res = await request(app).post('/subjects').send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/name/i);
    });

    it('devuelve 500 si falla el guardado', async () => {
        SubjectModel.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(new Error('DB error')),
        }));

        const res = await request(app).post('/subjects').send({ name: 'Quimica' });

        expect(res.statusCode).toBe(500);
    });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────

describe('DELETE /subjects/:id', () => {
    it('elimina la materia y devuelve 200', async () => {
        SubjectModel.findOne.mockResolvedValue(makeSubject());
        SubjectModel.deleteOne.mockResolvedValue({});

        const res = await request(app).delete(`/subjects/${validSubjectId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted successfully/i);
        expect(SubjectModel.deleteOne).toHaveBeenCalled();
    });

    it('devuelve 404 si la materia no existe', async () => {
        SubjectModel.findOne.mockResolvedValue(null);

        const res = await request(app).delete(`/subjects/${validSubjectId}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('devuelve 400 si el id no es un ObjectId valido', async () => {
        const res = await request(app).delete('/subjects/no-valido');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        SubjectModel.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app).delete(`/subjects/${validSubjectId}`);

        expect(res.statusCode).toBe(500);
    });
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────

describe('PUT /subjects/:id', () => {
    it('actualiza la materia y devuelve 200', async () => {
        const subject = makeSubject();
        subject.save.mockResolvedValue({ ...subject, name: 'Algebra' });
        SubjectModel.findOne.mockResolvedValue(subject);

        const res = await request(app)
            .put(`/subjects/${validSubjectId}`)
            .send({ name: 'Algebra' });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Algebra');
        expect(subject.save).toHaveBeenCalled();
    });

    it('devuelve 404 si la materia no existe', async () => {
        SubjectModel.findOne.mockResolvedValue(null);

        const res = await request(app)
            .put(`/subjects/${validSubjectId}`)
            .send({ name: 'Algebra' });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('devuelve 400 si falta el nombre', async () => {
        SubjectModel.findOne.mockResolvedValue(makeSubject());

        const res = await request(app)
            .put(`/subjects/${validSubjectId}`)
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/name/i);
    });

    it('devuelve 400 si el id no es un ObjectId valido', async () => {
        const res = await request(app)
            .put('/subjects/no-valido')
            .send({ name: 'Algebra' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        SubjectModel.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
            .put(`/subjects/${validSubjectId}`)
            .send({ name: 'Algebra' });

        expect(res.statusCode).toBe(500);
    });
});