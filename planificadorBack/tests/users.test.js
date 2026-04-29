const request = require('supertest');
const express = require('express');

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../middlewares/authmiddleware', () =>
    (req, _res, next) => {
        req.userId = '507f1f77bcf86cd799439011';
        next();
    }
);

jest.mock('../middlewares/rateLimiterMiddleware', () => ({
    authLimiter: (_req, _res, next) => next(),
}));

jest.mock('../routes/models/UserModel');
const User = require('../routes/models/UserModel');

jest.mock('../routes/models/CalendarModel');
const Calendar = require('../routes/models/CalendarModel');

jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');

// ── App setup ──────────────────────────────────────────────────────────────────

const usersRouter = require('../users'); // ajusta el nombre si es distinto

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

// ── Helpers ────────────────────────────────────────────────────────────────────

const validUserId = '507f1f77bcf86cd799439011';

const googlePayload = {
    email:       'test@gmail.com',
    name:        'Test User',
    given_name:  'Test',
    family_name: 'User',
    picture:     'https://example.com/photo.jpg',
};

function mockGoogleSuccess(payload = googlePayload) {
    global.fetch = jest.fn().mockResolvedValue({
        ok:   true,
        json: jest.fn().mockResolvedValue(payload),
    });
}

function mockGoogleFailure() {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
}

// ── POST /login ───────────────────────────────────────────────────────────────

describe('POST /users/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jwt.sign.mockReturnValue('mocked.jwt.token');
        process.env.JWT_SECRET = 'test-secret';
    });

    it('devuelve 401 si no se envía token', async () => {
        const res = await request(app).post('/users/login').send({});

        expect(res.statusCode).toBe(401);
    });

    it('devuelve 401 si Google rechaza el token', async () => {
        mockGoogleFailure();

        const res = await request(app).post('/users/login').send({ token: 'bad-token' });

        expect(res.statusCode).toBe(401);
    });

    it('devuelve 200 con JWT si el usuario ya existe', async () => {
        mockGoogleSuccess();
        User.findOne.mockResolvedValue({ _id: validUserId });

        const res = await request(app).post('/users/login').send({ token: 'valid-token' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBe('mocked.jwt.token');
        expect(res.body.user).toMatchObject({
            email: googlePayload.email,
            name:  googlePayload.given_name,
        });
        // No debe crear un usuario nuevo
        expect(User).not.toHaveBeenCalled();
    });

    it('crea un usuario nuevo si no existe y devuelve 200', async () => {
        mockGoogleSuccess();
        User.findOne.mockResolvedValue(null);

        const savedUser = { _id: validUserId };
        const saveMock = jest.fn().mockResolvedValue(savedUser);
        User.mockImplementation(() => ({ save: saveMock }));

        // Calendar también necesita mock para createDefaultCalendarForUser
        Calendar.mockImplementation(() => ({ save: jest.fn().mockResolvedValue({}) }));

        const res = await request(app).post('/users/login').send({ token: 'new-user-token' });

        expect(res.statusCode).toBe(200);
        expect(saveMock).toHaveBeenCalled();
        expect(res.body.token).toBe('mocked.jwt.token');
    });

    it('crea un calendario por defecto al registrar un usuario nuevo', async () => {
        mockGoogleSuccess();
        User.findOne.mockResolvedValue(null);
        User.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({ _id: validUserId }),
        }));

        const calendarSave = jest.fn().mockResolvedValue({});
        Calendar.mockImplementation(() => ({ save: calendarSave }));

        await request(app).post('/users/login').send({ token: 'new-user-token' });

        // Damos un tick para que createDefaultCalendarForUser (fire-and-forget) se ejecute
        await new Promise(r => setImmediate(r));

        expect(calendarSave).toHaveBeenCalled();
    });

    it('firma el JWT con el userId correcto', async () => {
        mockGoogleSuccess();
        User.findOne.mockResolvedValue({ _id: validUserId });

        await request(app).post('/users/login').send({ token: 'valid-token' });

        expect(jwt.sign).toHaveBeenCalledWith(
            { userId: validUserId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    });

    it('devuelve 401 si Google API lanza un error', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const res = await request(app).post('/users/login').send({ token: 'valid-token' });

        expect(res.statusCode).toBe(401);
    });
});

// ── GET /verify ───────────────────────────────────────────────────────────────

describe('GET /users/verify', () => {
    it('devuelve 200 y ok:true si el token es válido', async () => {
        const res = await request(app).get('/users/verify');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});