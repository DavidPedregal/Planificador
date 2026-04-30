const request = require('supertest');
const app = require('../../app');
const TaskService = require('../../services/taskService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../config/db', () => jest.fn());
jest.mock('../../services/taskService');
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
const mockTaskId = '507f1f77bcf86cd799439012';

const validToken = jwt.sign(
    { userId: mockUserId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const mockTask = {
    _id: mockTaskId,
    userId: mockUserId,
    title: 'Test Task',
    estimatedTime: 60,
    finishDate: '2026-05-10T10:00:00Z',
    givenDate: '2026-05-01T10:00:00Z',
    completed: false,
};

describe('taskRouter', () => {
    describe('GET /tasks', () => {
        it('should return 200 with all tasks', async () => {
            TaskService.getAllTasks.mockResolvedValue([mockTask]);

            const res = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([mockTask]);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/tasks');
            expect(res.status).toBe(401);
        });

        it('should return 500 if service throws unexpected error', async () => {
            TaskService.getAllTasks.mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /tasks/:id', () => {
        it('should return 200 with the task', async () => {
            TaskService.getTaskById.mockResolvedValue(mockTask);

            const res = await request(app)
                .get(`/tasks/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockTask);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.getTaskById.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .get(`/tasks/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get(`/tasks/${mockTaskId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('POST /tasks', () => {
        it('should return 201 with the created tasks', async () => {
            TaskService.createTasks.mockResolvedValue([mockTask]);

            const res = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${validToken}`)
                .send(mockTask);

            expect(res.status).toBe(201);
            expect(res.body).toEqual([mockTask]);
        });

        it('should return 400 if service throws ValidationError', async () => {
            TaskService.createTasks.mockRejectedValue(new ValidationError('Invalid data'));

            const res = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/tasks').send(mockTask);
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /tasks/:id', () => {
        it('should return 200 with the updated task', async () => {
            const updated = { ...mockTask, title: 'Updated' };
            TaskService.updateTask.mockResolvedValue(updated);

            const res = await request(app)
                .put(`/tasks/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Updated');
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.updateTask.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .put(`/tasks/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/tasks/${mockTaskId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /tasks/forward/:id', () => {
        it('should return 200 with the result', async () => {
            TaskService.updateForwardTask.mockResolvedValue({ message: 'Task(s) updated successfully', modifiedCount: 2 });

            const res = await request(app)
                .put(`/tasks/forward/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(2);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.updateForwardTask.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .put(`/tasks/forward/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/tasks/forward/${mockTaskId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /tasks/all/:id', () => {
        it('should return 200 with the result', async () => {
            TaskService.updateAllTasksInGroup.mockResolvedValue({ message: 'Task(s) updated successfully', modifiedCount: 3 });

            const res = await request(app)
                .put(`/tasks/all/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(3);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.updateAllTasksInGroup.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .put(`/tasks/all/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/tasks/all/${mockTaskId}`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /tasks/toggle/:id', () => {
        it('should return 200 with the toggled task', async () => {
            const toggled = { ...mockTask, completed: true };
            TaskService.toggleTaskCompletion.mockResolvedValue(toggled);

            const res = await request(app)
                .put(`/tasks/toggle/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.completed).toBe(true);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.toggleTaskCompletion.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .put(`/tasks/toggle/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).put(`/tasks/toggle/${mockTaskId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /tasks/:id', () => {
        it('should return 200 when task is deleted', async () => {
            TaskService.deleteTask.mockResolvedValue();

            const res = await request(app)
                .delete(`/tasks/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.deleteTask.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .delete(`/tasks/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/tasks/${mockTaskId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /tasks/forward/:id', () => {
        it('should return 200 with the result', async () => {
            TaskService.deleteForwardTasks.mockResolvedValue({ message: 'Task(s) deleted successfully', modifiedCount: 2 });

            const res = await request(app)
                .delete(`/tasks/forward/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(2);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.deleteForwardTasks.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .delete(`/tasks/forward/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/tasks/forward/${mockTaskId}`);
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /tasks/all/:id', () => {
        it('should return 200 with the result', async () => {
            TaskService.deleteAllTasksInGroup.mockResolvedValue({ message: 'Task(s) deleted successfully', modifiedCount: 3 });

            const res = await request(app)
                .delete(`/tasks/all/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(3);
        });

        it('should return 404 if task does not exist', async () => {
            TaskService.deleteAllTasksInGroup.mockRejectedValue(new NotFoundError('Task not found'));

            const res = await request(app)
                .delete(`/tasks/all/${mockTaskId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete(`/tasks/all/${mockTaskId}`);
            expect(res.status).toBe(401);
        });
    });
});