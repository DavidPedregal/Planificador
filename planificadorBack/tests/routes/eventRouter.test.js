// tests/routes/eventRouter.test.js
const request = require('supertest');
const app = require('../../app');
const EventService = require('../../services/eventService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/eventService');
jest.mock('../../middlewares/rateLimiterMiddleware', () => ({
    authLimiter: (req, res, next) => next(),
    dbLimiter: (req, res, next) => next()
}));

let server;

beforeAll(() => {
    server = app.listen(0);
});

afterAll(async () => {
    await server.close();
    await mongoose.disconnect();
});

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';
const mockEventId = '507f1f77bcf86cd799439012';

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const mockEvent = {
    _id: mockEventId,
    userId: mockUserId,
    title: 'Test Event',
    calendarId: '507f1f77bcf86cd799439013',
    start: '2026-05-01T10:00:00Z',
    end: '2026-05-01T11:00:00Z',
    useCalendarColor: true,
    color: '#ff0000',
};

describe('eventRouter', () => {
    describe('GET /events', () => {
        it('should return 200 with all events', async () => {
            EventService.getAllEvents.mockResolvedValue([mockEvent]);

            const res = await request(app)
                .get('/events')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([mockEvent]);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/events');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            EventService.getAllEvents.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/events')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('POST /events', () => {
        it('should return 201 with the created events', async () => {
            EventService.createEvent.mockResolvedValue([mockEvent]);

            const res = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${validToken}`)
                .send(mockEvent);

            expect(res.status).toBe(201);
            expect(res.body).toEqual([mockEvent]);
        });

        it('should return 400 if service throws ValidationError', async () => {
            EventService.createEvent.mockRejectedValue(
                new ValidationError('Title, start, end and calendarId are required')
            );

            const res = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/events').send(mockEvent);
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /events/:id', () => {
        it('should return 200 with the updated event', async () => {
            const updated = { ...mockEvent, title: 'Updated' };
            EventService.updateEvent.mockResolvedValue(updated);

            const res = await request(app)
                .put(`/events/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Updated');
        });

        it('should return 404 if event does not exist', async () => {
            EventService.updateEvent.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .put(`/events/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
        });

        it('should return 400 if service throws ValidationError', async () => {
            EventService.updateEvent.mockRejectedValue(new ValidationError('No changes detected'));

            const res = await request(app)
                .put(`/events/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Test Event' });

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/events/${mockEventId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /events/forward/:id', () => {
        it('should return 200 with the result', async () => {
            EventService.updateforwardEvent.mockResolvedValue({ message: 'Event(s) forwarded successfully', modifiedCount: 2 });

            const res = await request(app)
                .put(`/events/forward/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(2);
        });

        it('should return 404 if event does not exist', async () => {
            EventService.updateforwardEvent.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .put(`/events/forward/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/events/forward/${mockEventId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /events/all/:id', () => {
        it('should return 200 with the result', async () => {
            EventService.updateAllEventsInGroup.mockResolvedValue({ message: 'Event(s) updated successfully', modifiedCount: 3 });

            const res = await request(app)
                .put(`/events/all/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(3);
        });

        it('should return 404 if event does not exist', async () => {
            EventService.updateAllEventsInGroup.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .put(`/events/all/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/events/all/${mockEventId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /events/:id', () => {
        it('should return 200 when event is deleted', async () => {
            EventService.deleteEvent.mockResolvedValue();

            const res = await request(app)
                .delete(`/events/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
        });

        it('should return 404 if event does not exist', async () => {
            EventService.deleteEvent.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .delete(`/events/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/events/${mockEventId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /events/forward/:id', () => {
        it('should return 200 with the result', async () => {
            EventService.deleteForwardEvents.mockResolvedValue({ message: 'Event(s) deleted successfully', modifiedCount: 2 });

            const res = await request(app)
                .delete(`/events/forward/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(2);
        });

        it('should return 404 if event does not exist', async () => {
            EventService.deleteForwardEvents.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .delete(`/events/forward/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/events/forward/${mockEventId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /events/all/:id', () => {
        it('should return 200 with the result', async () => {
            EventService.deleteAllEventsInGroup.mockResolvedValue({ message: 'Event(s) deleted successfully', modifiedCount: 3 });

            const res = await request(app)
                .delete(`/events/all/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(3);
        });

        it('should return 404 if event does not exist', async () => {
            EventService.deleteAllEventsInGroup.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .delete(`/events/all/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/events/all/${mockEventId}`);
            expect(res.status).toBe(401);
        });
    });
});