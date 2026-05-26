const request = require('supertest');
const app = require('../../app');
const SettingsService = require('../../services/settingsService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/settingsService');
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
const mockSettingsId = '507f1f77bcf86cd799439012';

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const mockSettings = {
    _id: mockSettingsId,
    userId: mockUserId,
    systemColor: '#7c6ff740',
    theme: 'dark',
    defaultCalendarView: 'timeGridWeek',
    startHour: 8,
    endHour: 20
};

describe('settingsRouter', () => {
    describe('GET /settings', () => {
        it('should return 200 with settings', async () => {
            SettingsService.getSettingsForUser.mockResolvedValue(mockSettings);

            const res = await request(app)
                .get('/settings')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockSettings);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/settings');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            SettingsService.getSettingsForUser.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/settings')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('PUT /settings/:id', () => {
        it('should return 200 when settings are updated', async () => {
            SettingsService.updateSettings.mockResolvedValue({ ...mockSettings, theme: 'light' });

            const res = await request(app)
                .put(`/settings/${mockSettingsId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ theme: 'light' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('api.settings.updated');
        });

        it('should return 400 if service throws ValidationError', async () => {
            SettingsService.updateSettings.mockRejectedValue(
                new ValidationError('Invalid update fields')
            );

            const res = await request(app)
                .put(`/settings/${mockSettingsId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ unknownField: 'value' });

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .put(`/settings/${mockSettingsId}`)
                .send({ theme: 'light' });

            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            SettingsService.updateSettings.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .put(`/settings/${mockSettingsId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ theme: 'light' });

            expect(res.status).toBe(500);
        });
    });

    describe('DELETE /settings/:id', () => {
        it('should return 200 when settings are deleted', async () => {
            SettingsService.deleteSettings.mockResolvedValue();

            const res = await request(app)
                .delete(`/settings/${mockSettingsId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('api.settings.deleted');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/settings/${mockSettingsId}`);
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            SettingsService.deleteSettings.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .delete(`/settings/${mockSettingsId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });
});