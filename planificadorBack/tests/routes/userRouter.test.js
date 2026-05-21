const request = require('supertest');
const app = require('../../app');
const UserService = require('../../services/userService');
const PlanService = require('../../services/planService');
const jwt = require('jsonwebtoken');

jest.mock('../../services/userService');
jest.mock('../../services/planService');
jest.mock('../../middlewares/rateLimiterMiddleware', () => ({
    authLimiter: (req, res, next) => next(),
    dbLimiter: (req, res, next) => next()
}));
jest.mock('../../config/db', () => jest.fn()); // añade esto al principio

// Mockeamos fetch globalmente (lo usa el router para llamar a Google)
global.fetch = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

const mockGooglePayload = {
    email: 'test@test.com',
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/pic.jpg'
};

const mockDbUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@test.com',
};

let server;

beforeAll(() => {
    server = app.listen(0); // puerto 0 = aleatorio, evita conflictos
});

const mongoose = require('mongoose');

afterAll(async () => {
    await server.close();
    await mongoose.disconnect();
});


describe('userRouter', () => {
    describe('POST /users/login', () => {
        it('should return 401 if no token is provided', async () => {
            const res = await request(app).post('/users/login').send({});
            expect(res.status).toBe(401);
        });

        it('should return 401 if Google rejects the token', async () => {
            global.fetch.mockResolvedValue({ ok: false });

            const res = await request(app).post('/users/login').send({ token: 'invalid_token' });
            expect(res.status).toBe(401);
        });

        it('should return 200 with a JWT and user data on success', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockGooglePayload
            });
            UserService.login.mockResolvedValue(mockDbUser);

            const res = await request(app).post('/users/login').send({ token: 'valid_token' });

            expect(res.status).toBe(200);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(mockGooglePayload.email);
            expect(res.body.data.user.name).toBe(mockGooglePayload.given_name);
        });

        it('should return a valid JWT signed with the user id', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockGooglePayload
            });
            UserService.login.mockResolvedValue(mockDbUser);

            const res = await request(app).post('/users/login').send({ token: 'valid_token' });

            const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
            expect(decoded.userId).toBe(mockDbUser._id);
        });

        it('should call expirePendingPlanEvents with the user id on successful login', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockGooglePayload
            });
            UserService.login.mockResolvedValue(mockDbUser);
            PlanService.expirePendingPlanEvents.mockResolvedValue({ modifiedCount: 0 });

            await request(app).post('/users/login').send({ token: 'valid_token' });

            expect(PlanService.expirePendingPlanEvents).toHaveBeenCalledWith(mockDbUser._id);
        });

        it('should return 500 if the service throws an unexpected error', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockGooglePayload
            });
            UserService.login.mockRejectedValue(new Error('Unexpected error'));

            const res = await request(app).post('/users/login').send({ token: 'valid_token' });
            expect(res.status).toBe(500);
        });
    });

    describe('GET /users/verify', () => {
        it('should return 200 with a valid token', async () => {
            const token = jwt.sign(
                { userId: mockDbUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            const res = await request(app)
                .get('/users/verify')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });

        it('should return 401 with no token', async () => {
            const res = await request(app).get('/users/verify');
            expect(res.status).toBe(401);
        });

        it('should return 401 with an invalid token', async () => {
            const res = await request(app)
                .get('/users/verify')
                .set('Authorization', 'Bearer token_invalido');

            expect(res.status).toBe(401);
        });
    });
});