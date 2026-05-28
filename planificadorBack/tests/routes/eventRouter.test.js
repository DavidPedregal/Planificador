// tests/routes/eventRouter.test.js
const request = require('supertest');
const app = require('../../app');
const EventService = require('../../services/eventService');
const CalendarRepo = require('../../repository/calendarRepository');
const { parseUniversityCsv } = require('../../services/importParsers/universityCsvParser');
const { parseGoogleCalendar } = require('../../services/importParsers/googleCalendarParser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/eventService');
jest.mock('../../repository/calendarRepository');
jest.mock('../../services/importParsers/universityCsvParser');
jest.mock('../../services/importParsers/googleCalendarParser');
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
            expect(res.body.data).toEqual([mockEvent]);
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
    
    describe('GET /events/:id', () => {
        it('should return 200 with the event', async () => {
            EventService.getEventById.mockResolvedValue(mockEvent);

            const res = await request(app)
                .get(`/events/${mockEventId}`)
                .set('Authorization', `Bearer ${validToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockEvent);
        });

        it('should return 404 if event does not exist', async () => {
            EventService.getEventById.mockRejectedValue(new NotFoundError('Event not found'));

            const res = await request(app)
                .get(`/events/notExistingId`)
                .set('Authorization', `Bearer ${validToken}`);
            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get(`/events/${mockEventId}`);
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            EventService.getEventById.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get(`/events/${mockEventId}`)
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
            expect(res.body.data).toEqual([mockEvent]);
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
            expect(res.body.data.title).toBe('Updated');
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
            expect(res.body.data.modifiedCount).toBe(2);
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
            expect(res.body.data.modifiedCount).toBe(3);
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
            expect(res.body.data.modifiedCount).toBe(2);
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
            expect(res.body.data.modifiedCount).toBe(3);
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

    describe('DELETE /events/label/:label', () => {
        it('should return 200 with the result', async () => {
            EventService.deleteEventsByLabel.mockResolvedValue({ message: 'Event(s) deleted successfully', modifiedCount: 2 });

            const res = await request(app)
                .delete('/events/label/examen')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.modifiedCount).toBe(2);
        });

        it('should return 400 if service throws ValidationError', async () => {
            EventService.deleteEventsByLabel.mockRejectedValue(
                new ValidationError('Invalid label')
            );

            const res = await request(app)
                .delete('/events/label/examen')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete('/events/label/examen');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /events/import', () => {
        const mockCalendarId = '507f1f77bcf86cd799439013';
        const mockCalendar = { _id: mockCalendarId, name: 'Test', userId: mockUserId };
        const mockParsedEvents = [
            { title: 'DLP.T.I-1 - A-S-03', start: new Date('2026-01-27T09:00:00'), end: new Date('2026-01-27T11:00:00') },
        ];
        const csvBuffer = Buffer.from('Subject,Start Date\nDLP.T.I-1,27/01/2026');
        const icsBuffer = Buffer.from('BEGIN:VCALENDAR\nEND:VCALENDAR');

        it('should return 201 with count on successful CSV import', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            parseUniversityCsv.mockReturnValue(mockParsedEvents);
            EventService.bulkImportEvents.mockResolvedValue([{}]);

            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', csvBuffer, { filename: 'schedule.csv', contentType: 'text/csv' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(201);
            expect(res.body.data.count).toBe(1);
            expect(parseUniversityCsv).toHaveBeenCalled();
        });

        it('should return 201 with count on successful ICS import', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            parseGoogleCalendar.mockReturnValue(mockParsedEvents);
            EventService.bulkImportEvents.mockResolvedValue([{}]);

            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', icsBuffer, { filename: 'calendar.ics', contentType: 'text/calendar' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(201);
            expect(parseGoogleCalendar).toHaveBeenCalled();
        });

        it('should forward label to service when provided', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            parseUniversityCsv.mockReturnValue(mockParsedEvents);
            EventService.bulkImportEvents.mockResolvedValue([{}]);

            await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', csvBuffer, { filename: 'schedule.csv', contentType: 'text/csv' })
                .field('calendarId', mockCalendarId)
                .field('label', 'DLP');

            expect(EventService.bulkImportEvents).toHaveBeenCalledWith(
                expect.anything(), expect.anything(), mockCalendarId, 'DLP'
            );
        });

        it('should return 400 if calendarId is missing', async () => {
            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', csvBuffer, { filename: 'schedule.csv' });

            expect(res.status).toBe(400);
        });

        it('should return 400 if no file is provided', async () => {
            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(400);
        });

        it('should return 400 if calendar not found for user', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(null);

            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', csvBuffer, { filename: 'schedule.csv' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(400);
        });

        it('should return 400 if file format is unsupported', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);

            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', Buffer.from('data'), { filename: 'file.txt' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(400);
        });

        it('should return 400 if no valid events found in file', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            parseUniversityCsv.mockReturnValue([]);

            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', csvBuffer, { filename: 'empty.csv' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/events/import')
                .attach('file', csvBuffer, { filename: 'schedule.csv' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            parseUniversityCsv.mockReturnValue(mockParsedEvents);
            EventService.bulkImportEvents.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .post('/events/import')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('file', csvBuffer, { filename: 'schedule.csv' })
                .field('calendarId', mockCalendarId);

            expect(res.status).toBe(500);
        });
    });
});