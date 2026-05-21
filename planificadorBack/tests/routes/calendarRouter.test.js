const request = require('supertest');
const app = require('../../app');
const CalendarService = require('../../services/calendarService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/calendarService');
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
const mockCalendarId = '507f1f77bcf86cd799439012';

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const mockCalendar = {
    _id: mockCalendarId,
    userId: mockUserId,
    name: 'Test Calendar',
    color: '#ff0000',
    visible: true,
    isSystem: false
};

describe('calendarRouter', () => {
    describe('GET /calendars', () => {
        it('should return 200 with custom calendars', async () => {
            CalendarService.getCustomCalendarsForUser.mockResolvedValue([mockCalendar]);

            const res = await request(app)
                .get('/calendars')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([mockCalendar]);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/calendars');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            CalendarService.getCustomCalendarsForUser.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/calendars')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /calendars/common', () => {
        it('should return 200 with system calendars', async () => {
            CalendarService.getSystemCalendarsForUser.mockResolvedValue([mockCalendar]);

            const res = await request(app)
                .get('/calendars/common')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([mockCalendar]);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/calendars/common');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /calendars', () => {
        it('should return 201 with the created calendar', async () => {
            CalendarService.createCalendarForUser.mockResolvedValue(mockCalendar);

            const res = await request(app)
                .post('/calendars')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Test Calendar', color: '#ff0000' });

            expect(res.status).toBe(201);
            expect(res.body.data).toEqual(mockCalendar);
        });

        it('should return 400 if service throws ValidationError', async () => {
            CalendarService.createCalendarForUser.mockRejectedValue(
                new ValidationError('Name and color are required')
            );

            const res = await request(app)
                .post('/calendars')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/calendars').send({ name: 'Test', color: '#ff0000' });
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /calendars/:id', () => {
        it('should return 200 when calendar is deleted', async () => {
            CalendarService.deleteCalendarForUser.mockResolvedValue();

            const res = await request(app)
                .delete(`/calendars/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('api.calendar.deleted');
        });

        it('should return 404 if calendar does not exist', async () => {
            CalendarService.deleteCalendarForUser.mockRejectedValue(
                new NotFoundError('Calendar not found')
            );

            const res = await request(app)
                .delete(`/calendars/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 400 if trying to delete a system calendar', async () => {
            CalendarService.deleteCalendarForUser.mockRejectedValue(
                new ValidationError('Cannot delete a default calendar')
            );

            const res = await request(app)
                .delete(`/calendars/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/calendars/${mockCalendarId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /calendars/:id', () => {
        it('should return 200 with the updated calendar', async () => {
            const updated = { ...mockCalendar, name: 'Updated' };
            CalendarService.updateCalendarForUser.mockResolvedValue(updated);

            const res = await request(app)
                .put(`/calendars/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Updated', color: '#ff0000' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Updated');
        });

        it('should return 404 if calendar does not exist', async () => {
            CalendarService.updateCalendarForUser.mockRejectedValue(
                new NotFoundError('Calendar not found')
            );

            const res = await request(app)
                .put(`/calendars/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Updated', color: '#ff0000' });

            expect(res.status).toBe(404);
        });

        it('should return 400 if service throws ValidationError', async () => {
            CalendarService.updateCalendarForUser.mockRejectedValue(
                new ValidationError('Name and color are required')
            );

            const res = await request(app)
                .put(`/calendars/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/calendars/${mockCalendarId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /calendars/toggleVisibility/:id', () => {
        it('should return 200 when visibility is toggled', async () => {
            CalendarService.toggleCalendarVisibilityForUser.mockResolvedValue({
                ...mockCalendar,
                visible: false
            });

            const res = await request(app)
                .put(`/calendars/toggleVisibility/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.visible).toBe(false);
            expect(res.body.message).toBe('api.calendar.visibilityChanged');
        });

        it('should return 404 if calendar does not exist', async () => {
            CalendarService.toggleCalendarVisibilityForUser.mockRejectedValue(
                new NotFoundError('Calendar not found')
            );

            const res = await request(app)
                .put(`/calendars/toggleVisibility/${mockCalendarId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/calendars/toggleVisibility/${mockCalendarId}`);
            expect(res.status).toBe(401);
        });
    });
});