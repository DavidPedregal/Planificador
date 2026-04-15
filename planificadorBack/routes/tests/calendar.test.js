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

jest.mock('../models/CalendarModel');
const Calendar = require('../models/CalendarModel');

// ── App setup ──────────────────────────────────────────────────────────────────

const calendarsRouter = require('../calendars'); // ajusta el nombre si es distinto

const app = express();
app.use(express.json());
app.use('/calendars', calendarsRouter);

// ── Helpers ────────────────────────────────────────────────────────────────────

const validCalendarId = '507f1f77bcf86cd799439022';

function makeCalendar(overrides = {}) {
    return {
        _id:     validCalendarId,
        userId:  '507f1f77bcf86cd799439011',
        name:    'Mi calendario',
        color:   '#ff0000',
        visible: true,
        ...overrides,
    };
}

// ── GET / ──────────────────────────────────────────────────────────────────────

describe('GET /calendars', () => {
    it('devuelve 200 y un array con los calendarios del usuario', async () => {
        Calendar.find.mockResolvedValue([makeCalendar(), makeCalendar({ _id: '507f1f77bcf86cd799439033' })]);

        const res = await request(app).get('/calendars');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
    });

    it('devuelve 200 y array vacío si el usuario no tiene calendarios', async () => {
        Calendar.find.mockResolvedValue([]);

        const res = await request(app).get('/calendars');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        Calendar.find.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/calendars');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});

// ── POST / ────────────────────────────────────────────────────────────────────

describe('POST /calendars', () => {
    const validBody = { name: 'Trabajo', color: '#0000ff' };

    it('crea un calendario y devuelve 201', async () => {
        const saved = makeCalendar(validBody);
        // Calendar es una clase mock; simulamos new Calendar().save()
        Calendar.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(saved) }));

        const res = await request(app).post('/calendars').send(validBody);

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Trabajo');
    });

    it('devuelve 400 si falta el nombre', async () => {
        const res = await request(app).post('/calendars').send({ color: '#ff0000' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/name/i);
    });

    it('devuelve 400 si falta el color', async () => {
        const res = await request(app).post('/calendars').send({ name: 'Personal' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/color/i);
    });

    it('devuelve 400 si faltan nombre y color', async () => {
        const res = await request(app).post('/calendars').send({});

        expect(res.statusCode).toBe(400);
    });

    it('devuelve 500 si falla el guardado', async () => {
        Calendar.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(new Error('DB error')),
        }));

        const res = await request(app).post('/calendars').send(validBody);

        expect(res.statusCode).toBe(500);
    });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────

describe('DELETE /calendars/:id', () => {
    beforeEach(() => {
        // Silenciamos fetch global para que el DELETE interno no falle
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
    });

    it('elimina el calendario y devuelve 200', async () => {
        Calendar.findOne.mockResolvedValue(makeCalendar());
        Calendar.deleteOne.mockResolvedValue({});

        const res = await request(app).delete(`/calendars/${validCalendarId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
        expect(Calendar.deleteOne).toHaveBeenCalled();
    });

    it('devuelve 404 si el calendario no existe', async () => {
        Calendar.findOne.mockResolvedValue(null);

        const res = await request(app).delete(`/calendars/${validCalendarId}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('devuelve 400 si el id no es un ObjectId válido', async () => {
        const res = await request(app).delete('/calendars/no-valido');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        Calendar.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app).delete(`/calendars/${validCalendarId}`);

        expect(res.statusCode).toBe(500);
    });

    it('llama al endpoint de eventos para borrar los eventos del calendario', async () => {
        Calendar.findOne.mockResolvedValue(makeCalendar());
        Calendar.deleteOne.mockResolvedValue({});

        await request(app).delete(`/calendars/${validCalendarId}`);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(validCalendarId),
            expect.objectContaining({ method: 'DELETE' })
        );
    });
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────

describe('PUT /calendars/:id', () => {
    const updateBody = { name: 'Actualizado', color: '#00ff00' };

    it('actualiza el calendario y devuelve 200', async () => {
        const updated = makeCalendar(updateBody);
        Calendar.findOne.mockResolvedValue(makeCalendar());
        Calendar.findByIdAndUpdate.mockResolvedValue(updated);

        const res = await request(app)
            .put(`/calendars/${validCalendarId}`)
            .send(updateBody);

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Actualizado');
    });

    it('devuelve 404 si el calendario no existe', async () => {
        Calendar.findOne.mockResolvedValue(null);

        const res = await request(app)
            .put(`/calendars/${validCalendarId}`)
            .send(updateBody);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('devuelve 400 si el id no es un ObjectId válido', async () => {
        const res = await request(app)
            .put('/calendars/no-valido')
            .send(updateBody);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        Calendar.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
            .put(`/calendars/${validCalendarId}`)
            .send(updateBody);

        expect(res.statusCode).toBe(500);
    });
});