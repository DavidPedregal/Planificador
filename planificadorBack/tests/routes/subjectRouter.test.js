// tests/routes/subjectRouter.test.js
const request = require('supertest');
const app = require('../../app');
const SubjectService = require('../../services/subjectService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/subjectService');
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
const mockSubjectId = '507f1f77bcf86cd799439012';

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const mockSubject = { _id: mockSubjectId, userId: mockUserId, name: 'Matemáticas' };

describe('subjectRouter', () => {
    describe('GET /subjects', () => {
        it('should return 200 with all subjects', async () => {
            SubjectService.getSubjectsForUser.mockResolvedValue([mockSubject]);

            const res = await request(app)
                .get('/subjects')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [mockSubject] });
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/subjects');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            SubjectService.getSubjectsForUser.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/subjects')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('POST /subjects', () => {
        it('should return 201 with the created subject', async () => {
            SubjectService.createSubject.mockResolvedValue(mockSubject);

            const res = await request(app)
                .post('/subjects')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Matemáticas' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ data: mockSubject, message: "Subject created successfully" });
        });

        it('should return 400 if service throws ValidationError', async () => {
            SubjectService.createSubject.mockRejectedValue(new ValidationError('Subject name is required'));

            const res = await request(app)
                .post('/subjects')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/subjects').send({ name: 'Matemáticas' });
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /subjects/:id', () => {
        it('should return 200 when subject is deleted', async () => {
            SubjectService.deleteSubject.mockResolvedValue();

            const res = await request(app)
                .delete(`/subjects/${mockSubjectId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Subject deleted successfully');
        });

        it('should return 404 if subject does not exist', async () => {
            SubjectService.deleteSubject.mockRejectedValue(new NotFoundError('Subject not found'));

            const res = await request(app)
                .delete(`/subjects/${mockSubjectId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/subjects/${mockSubjectId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /subjects/:id', () => {
        it('should return 200 with the updated subject', async () => {
            const updated = { ...mockSubject, name: 'Física' };
            SubjectService.updateSubject.mockResolvedValue(updated);

            const res = await request(app)
                .put(`/subjects/${mockSubjectId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Física' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Física');
        });

        it('should return 404 if subject does not exist', async () => {
            SubjectService.updateSubject.mockRejectedValue(new NotFoundError('Subject not found'));

            const res = await request(app)
                .put(`/subjects/${mockSubjectId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Física' });

            expect(res.status).toBe(404);
        });

        it('should return 400 if service throws ValidationError', async () => {
            SubjectService.updateSubject.mockRejectedValue(new ValidationError('Subject name is required'));

            const res = await request(app)
                .put(`/subjects/${mockSubjectId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/subjects/${mockSubjectId}`).send({});
            expect(res.status).toBe(401);
        });
    });
});