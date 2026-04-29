const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../middlewares/authmiddleware', () =>
    (req, _res, next) => {
        req.userId = '507f1f77bcf86cd799439011'; // ObjectId válido hardcodeado
        next();
    }
);

jest.mock('../middlewares/rateLimiterMiddleware', () => ({
    dbLimiter: (_req, _res, next) => next(),
}));

jest.mock('../routes/models/CalendarEventModel');
const CalendarEvent = require('../routes/models/CalendarEventModel');

// ── App setup ──────────────────────────────────────────────────────────────────

const eventsRouter = require('../routes/events'); // ajusta la ruta si el archivo se llama distinto
const { FREQUENCY_TYPE } = require('../routes/models/enums/enums');

const app = express();
app.use(express.json());
app.use('/events', eventsRouter);

// ── Helpers ────────────────────────────────────────────────────────────────────

const validCalendarId = new mongoose.Types.ObjectId().toString();
const validEventId    = new mongoose.Types.ObjectId().toString();
const validGroupId    = new mongoose.Types.ObjectId().toString();

function makeEvent(overrides = {}) {
    return {
        _id:        validEventId,
        userId:     new mongoose.Types.ObjectId().toString(),
        title:      'Test event',
        start:      new Date('2025-06-01T10:00:00Z'),
        end:        new Date('2025-06-01T11:00:00Z'),
        calendarId: validCalendarId,
        frequencyType: FREQUENCY_TYPE.NONE,
        groupId:    validGroupId,
        toObject:   function () { return { ...this }; },
        ...overrides,
    };
}

// ── GET / ──────────────────────────────────────────────────────────────────────

describe('GET /events', () => {
    it('devuelve 200 y un array con los eventos del usuario', async () => {
        const events = [makeEvent(), makeEvent({ _id: new mongoose.Types.ObjectId().toString() })];
        CalendarEvent.find.mockResolvedValue(events);

        const res = await request(app).get('/events');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        CalendarEvent.find.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/events');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});

// ── POST / ────────────────────────────────────────────────────────────────────

describe('POST /events', () => {
    const validBody = {
        title:      'Reunión',
        start:      '2025-06-01T10:00:00Z',
        end:        '2025-06-01T11:00:00Z',
        calendarId: validCalendarId,
    };

    beforeEach(() => {
        // insertMany debe devolver un array; simulamos el objeto guardado
        CalendarEvent.insertMany.mockResolvedValue([{ ...validBody, _id: validEventId }]);
    });

    it('crea un evento sin recurrencia y devuelve 201', async () => {
        const res = await request(app).post('/events').send(validBody);

        expect(res.statusCode).toBe(201);
        expect(CalendarEvent.insertMany).toHaveBeenCalledTimes(1);
        // Sin recurrencia → insertMany recibe exactamente 1 evento
        const [inserted] = CalendarEvent.insertMany.mock.calls[0];
        expect(inserted).toHaveLength(1);
    });

    it('devuelve 400 si falta el título', async () => {
        const res = await request(app)
            .post('/events')
            .send({ ...validBody, title: undefined });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('devuelve 400 si falta el start', async () => {
        const res = await request(app)
            .post('/events')
            .send({ ...validBody, start: undefined });

        expect(res.statusCode).toBe(400);
    });

    it('devuelve 400 si end es anterior a start', async () => {
        const res = await request(app).post('/events').send({
            ...validBody,
            start: '2025-06-01T11:00:00Z',
            end:   '2025-06-01T10:00:00Z',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/end date/i);
    });

    it('devuelve 400 si calendarId no es un ObjectId válido', async () => {
        const res = await request(app)
            .post('/events')
            .send({ ...validBody, calendarId: 'no-valido' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/calendarId/i);
    });

    it('crea múltiples eventos cuando hay recurrencia diaria con límite de ocurrencias', async () => {
        jest.clearAllMocks();
        
        const body = {
            ...validBody,
            frequencyType:             FREQUENCY_TYPE.DAYS,
            frequencyEndType:          'after',
            frequencyOccurrencesLeft:  3,
            frequencyInterval:         1,
        };

        // insertMany devolverá tantos objetos como eventos se generen (3 = base + 2)
        CalendarEvent.insertMany.mockResolvedValue(
            Array.from({ length: 3 }, (_, i) => ({ ...body, _id: new mongoose.Types.ObjectId().toString(), i }))
        );

        const res = await request(app).post('/events').send(body);

        expect(res.statusCode).toBe(201);
        const [inserted] = CalendarEvent.insertMany.mock.calls[0];
        expect(inserted.length).toBeGreaterThan(1);
        // Todos los eventos recurrentes deben compartir groupId
        const groupIds = [...new Set(inserted.map(e => e.groupId))];
        expect(groupIds).toHaveLength(1);
    });

    it('crea múltiples eventos con recurrencia semanal hasta fecha límite', async () => {
        const body = {
            ...validBody,
            start:             '2025-06-02T10:00:00Z', // lunes
            end:               '2025-06-02T11:00:00Z',
            frequencyType:     FREQUENCY_TYPE.WEEKS,
            frequencyEndType:  'on',
            frequencyEndDate:  '2025-06-23', // 3 semanas después
            frequencyInterval: 1,
        };

        CalendarEvent.insertMany.mockResolvedValue([]);

        await request(app).post('/events').send(body);

        const [inserted] = CalendarEvent.insertMany.mock.calls[0];
        // Debe haber generado más de 1 evento
        expect(inserted.length).toBeGreaterThan(1);
    });
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────

describe('PUT /events/:id', () => {
    const updateBody = { title: 'Actualizado' };

    it('actualiza el evento y devuelve 200', async () => {
        const updated = makeEvent({ title: 'Actualizado' });
        CalendarEvent.findOne.mockResolvedValue(makeEvent());
        CalendarEvent.findOneAndUpdate.mockResolvedValue(updated);
        CalendarEvent.insertMany.mockResolvedValue([]);

        const res = await request(app)
            .put(`/events/${validEventId}`)
            .send(updateBody);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Event updated successfully');
    });

    it('devuelve 404 si el evento no existe', async () => {
        CalendarEvent.findOne.mockResolvedValue(null);

        const res = await request(app)
            .put(`/events/${validEventId}`)
            .send(updateBody);

        expect(res.statusCode).toBe(404);
    });

    it('devuelve 400 si el id no es un ObjectId válido', async () => {
        const res = await request(app)
            .put('/events/id-no-valido')
            .send(updateBody);

        expect(res.statusCode).toBe(400);
    });

    it('devuelve 400 si no se envía ningún campo válido', async () => {
        const res = await request(app)
            .put(`/events/${validEventId}`)
            .send({ campoInventado: 'x' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no valid fields/i);
    });

    it('devuelve 400 si se intenta cambiar la recurrencia en un evento recurrente', async () => {
        CalendarEvent.findOne.mockResolvedValue(makeEvent({ frequencyType: 'day' }));

        const res = await request(app)
            .put(`/events/${validEventId}`)
            .send({ frequencyInterval: 2 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/recurrence/i);
    });

    it('devuelve 400 si end es anterior o igual a start', async () => {
        const res = await request(app)
            .put(`/events/${validEventId}`)
            .send({
                start: '2025-06-01T11:00:00Z',
                end:   '2025-06-01T10:00:00Z',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/end date/i);
    });
});

// ── PUT /all/:id ──────────────────────────────────────────────────────────────

describe('PUT /events/all/:id', () => {
    it('actualiza todos los eventos del grupo sin cambio de recurrencia y devuelve 200', async () => {
        CalendarEvent.findOne.mockResolvedValue(makeEvent());
        CalendarEvent.updateMany.mockResolvedValue({ modifiedCount: 3 });

        const res = await request(app)
            .put(`/events/all/${validEventId}`)
            .send({ title: 'Nuevo título' });

        expect(res.statusCode).toBe(200);
        expect(res.body.modifiedCount).toBe(3);
    });

    it('regenera eventos cuando cambia la recurrencia', async () => {
        CalendarEvent.findOne.mockResolvedValue(makeEvent({ 
            frequencyType: FREQUENCY_TYPE.DAYS,
            frequencyEndType: 'after',
            frequencyOccurrencesLeft: 2,
            frequencyInterval: 1
        }));
        CalendarEvent.deleteMany.mockResolvedValue({});
        CalendarEvent.insertMany.mockResolvedValue([makeEvent(), makeEvent()]);

        const res = await request(app)
            .put(`/events/all/${validEventId}`)
            .send({ frequencyInterval: 2 });

        expect(res.statusCode).toBe(200);
        expect(CalendarEvent.deleteMany).toHaveBeenCalled();
        expect(CalendarEvent.insertMany).toHaveBeenCalled();
        expect(res.body).toHaveProperty('events');
    });

    it('devuelve 404 si el evento no existe', async () => {
        CalendarEvent.findOne.mockResolvedValue(null);

        const res = await request(app)
            .put(`/events/all/${validEventId}`)
            .send({ title: 'x' });

        expect(res.statusCode).toBe(404);
    });

    it('devuelve 400 si el id no es válido', async () => {
        const res = await request(app)
            .put('/events/all/no-valido')
            .send({ title: 'x' });

        expect(res.statusCode).toBe(400);
    });

    it('devuelve 400 si no hay campos válidos', async () => {
        const res = await request(app)
            .put(`/events/all/${validEventId}`)
            .send({ campoInventado: 'x' });

        expect(res.statusCode).toBe(400);
    });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────

describe('DELETE /events/:id', () => {
    it('elimina el evento y devuelve 200', async () => {
        CalendarEvent.findOneAndDelete.mockResolvedValue(makeEvent());

        const res = await request(app).delete(`/events/${validEventId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it('devuelve 404 si el evento no existe', async () => {
        CalendarEvent.findOneAndDelete.mockResolvedValue(null);

        const res = await request(app).delete(`/events/${validEventId}`);

        expect(res.statusCode).toBe(404);
    });

    it('devuelve 400 si el id no es válido', async () => {
        const res = await request(app).delete('/events/no-valido');

        expect(res.statusCode).toBe(400);
    });
});

// ── DELETE /all/:id ───────────────────────────────────────────────────────────

describe('DELETE /events/all/:id', () => {
    it('elimina todos los eventos del grupo y devuelve 200', async () => {
        CalendarEvent.findOneAndDelete.mockResolvedValue(makeEvent());
        CalendarEvent.deleteMany.mockResolvedValue({ deletedCount: 4 });

        const res = await request(app).delete(`/events/all/${validEventId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted successfully/i);
        expect(CalendarEvent.deleteMany).toHaveBeenCalled();
    });

    it('devuelve 404 si el evento no existe', async () => {
        CalendarEvent.findOneAndDelete.mockResolvedValue(null);

        const res = await request(app).delete(`/events/all/${validEventId}`);

        expect(res.statusCode).toBe(404);
    });

    it('devuelve 400 si el id no es válido', async () => {
        const res = await request(app).delete('/events/all/no-valido');

        expect(res.statusCode).toBe(400);
    });
});

// ── DELETE /calendar/:calendarId ──────────────────────────────────────────────

describe('DELETE /events/calendar/:calendarId', () => {
    it('elimina todos los eventos del calendario y devuelve 200', async () => {
        CalendarEvent.deleteMany.mockResolvedValue({ deletedCount: 5 });

        const res = await request(app).delete(`/events/calendar/${validCalendarId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/5 events deleted/i);
    });

    it('devuelve 400 si el calendarId no es válido', async () => {
        const res = await request(app).delete('/events/calendar/no-valido');

        expect(res.statusCode).toBe(400);
    });

    it('devuelve 500 si la base de datos falla', async () => {
        CalendarEvent.deleteMany.mockRejectedValue(new Error('DB error'));

        const res = await request(app).delete(`/events/calendar/${validCalendarId}`);

        expect(res.statusCode).toBe(500);
    });
    
});
