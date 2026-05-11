const request = require('supertest');
const app = require('../../app');
const PlanService = require('../../services/planService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/planService');
jest.mock('../../middlewares/rateLimiterMiddleware', () => ({
    authLimiter: (req, res, next) => next(),
    dbLimiter: (req, res, next) => next()
}));

global.fetch = jest.fn();

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
const mockPlanEventId = '507f1f77bcf86cd799439012';

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const mockPlanEvent = {
    _id: mockPlanEventId,
    userId: mockUserId,
    title: 'Matemáticas',
    start: '2026-05-05T09:00:00Z',
    end: '2026-05-05T11:00:00Z',
    scheduledTime: 120,
    status: 'pending'
};

const mockPythonResponse = {
    scheduled: [mockPlanEvent],
    warnings: []
};

const mockMappedData = {
    mappedPreviousPlan: [],
    mappedPlannableSlots: [],
    mappedTasks: []
};

describe('planRouter', () => {
    describe('GET /plan', () => {
        it('should return 201 with the plan', async () => {
            PlanService.getPlanForUser.mockResolvedValue([mockPlanEvent]);

            const res = await request(app)
                .get('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([mockPlanEvent]);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/plan');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            PlanService.getPlanForUser.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('POST /plan', () => {
        beforeEach(() => {
            PlanService.getDataToPlan.mockResolvedValue(mockMappedData);
            PlanService.addPlan.mockResolvedValue([mockPlanEvent]);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockPythonResponse
            });
        });

        it('should return 201 when plan is created', async () => {
            const res = await request(app)
                .post('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(201);
        });

        it('should call getDataToPlan with userId', async () => {
            await request(app)
                .post('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(PlanService.getDataToPlan).toHaveBeenCalledWith(mockUserId);
        });

        it('should call the Python planner', async () => {
            await request(app)
                .post('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/plan'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should return warnings from Python in response', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    scheduled: [],
                    warnings: [{ taskId: 'x', title: 'X', message: 'No cabe' }]
                })
            });

            const res = await request(app)
                .post('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.body.data).toHaveLength(1);
        });

        it('should return 500 if Python service fails', async () => {
            global.fetch.mockResolvedValue({ ok: false });

            const res = await request(app)
                .post('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/plan');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /plan/reset', () => {
        beforeEach(() => {
            PlanService.deletePlan.mockResolvedValue({});
            PlanService.getDataToPlan.mockResolvedValue(mockMappedData);
            PlanService.addPlan.mockResolvedValue([mockPlanEvent]);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockPythonResponse
            });
        });

        it('should return 201 when plan is reset', async () => {
            const res = await request(app)
                .post('/plan/reset')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(201);
        });

        it('should delete existing plan before creating new one', async () => {
            await request(app)
                .post('/plan/reset')
                .set('Authorization', `Bearer ${validToken}`);

            expect(PlanService.deletePlan).toHaveBeenCalledWith(mockUserId);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/plan/reset');
            expect(res.status).toBe(401);
        });
    });

    describe('put /plan/:id', () => {
        it('should return 200 when plan event is updated', async () => {
            PlanService.updatePlanEvent.mockResolvedValue({ ...mockPlanEvent, status: 'completed' });

            const res = await request(app)
                .put(`/plan/${mockPlanEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'completed', userTime: 90 });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Plan event updated successfully');
        });

        it('should return 400 if service throws ValidationError', async () => {
            PlanService.updatePlanEvent.mockRejectedValue(
                new ValidationError('Plan event status is required')
            );

            const res = await request(app)
                .put(`/plan/${mockPlanEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 404 if plan event does not exist', async () => {
            PlanService.updatePlanEvent.mockRejectedValue(
                new NotFoundError('Plan not found')
            );

            const res = await request(app)
                .put(`/plan/${mockPlanEventId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'completed', userTime: 90 });

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/plan/${mockPlanEventId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /plan/:id', () => {
        it('should return 200 when plan event is deleted', async () => {
            PlanService.deletePlanEvent.mockResolvedValue({});

            const res = await request(app)
                .delete(`/plan/${mockPlanEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Plan event deleted successfully');
        });

        it('should return 404 if plan event does not exist', async () => {
            PlanService.deletePlanEvent.mockRejectedValue(
                new NotFoundError('Plan event not found')
            );

            const res = await request(app)
                .delete(`/plan/${mockPlanEventId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/plan/${mockPlanEventId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /plan', () => {
        it('should return 200 when plan is deleted', async () => {
            PlanService.deletePlan.mockResolvedValue({});

            const res = await request(app)
                .delete('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Plan deleted successfully');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete('/plan');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            PlanService.deletePlan.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .delete('/plan')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });
});