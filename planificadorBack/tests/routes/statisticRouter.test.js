const request = require('supertest');
const app = require('../../app');
const StatisticService = require('../../services/statisticService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/statisticService');
jest.mock('../../middlewares/rateLimiterMiddleware', () => ({
    authLimiter: (req, res, next) => next(),
    dbLimiter: (req, res, next) => next(),
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

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

describe('statisticRouter', () => {
    describe('GET /statistics/subject-time', () => {
        it('should return 200 with subject time data', async () => {
            const mockData = [
                { name: 'Mathematics', minutes: 120 },
                { name: 'Physics', minutes: 60 },
            ];
            StatisticService.getSubjectTimeStatistics.mockResolvedValue(mockData);

            const res = await request(app)
                .get('/statistics/subject-time')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: mockData });
        });

        it('should pass from and to query params to the service', async () => {
            StatisticService.getSubjectTimeStatistics.mockResolvedValue([]);

            await request(app)
                .get('/statistics/subject-time?from=2026-01-01&to=2026-06-01')
                .set('Authorization', `Bearer ${validToken}`);

            expect(StatisticService.getSubjectTimeStatistics).toHaveBeenCalledWith(
                mockUserId,
                '2026-01-01',
                '2026-06-01'
            );
        });

        it('should return 200 with empty array when no data', async () => {
            StatisticService.getSubjectTimeStatistics.mockResolvedValue([]);

            const res = await request(app)
                .get('/statistics/subject-time')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [] });
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/statistics/subject-time');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            StatisticService.getSubjectTimeStatistics.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/statistics/subject-time')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /statistics/comparison-time', () => {
        it('should return 200 with comparison data', async () => {
            const mockData = [
                { name: 'Mathematics', planned: 180, actual: 120 },
                { name: 'Physics', planned: 90, actual: 75 },
            ];
            StatisticService.getComparisonTimeStatistics.mockResolvedValue(mockData);

            const res = await request(app)
                .get('/statistics/comparison-time')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: mockData });
        });

        it('should pass from and to query params to the service', async () => {
            StatisticService.getComparisonTimeStatistics.mockResolvedValue([]);

            await request(app)
                .get('/statistics/comparison-time?from=2026-01-01&to=2026-06-01')
                .set('Authorization', `Bearer ${validToken}`);

            expect(StatisticService.getComparisonTimeStatistics).toHaveBeenCalledWith(
                mockUserId,
                '2026-01-01',
                '2026-06-01'
            );
        });

        it('should return 200 with empty array when no data', async () => {
            StatisticService.getComparisonTimeStatistics.mockResolvedValue([]);

            const res = await request(app)
                .get('/statistics/comparison-time')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [] });
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/statistics/comparison-time');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            StatisticService.getComparisonTimeStatistics.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/statistics/comparison-time')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });
});
