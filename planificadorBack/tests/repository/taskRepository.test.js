const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const TaskRepo = require('../../repository/taskRepository');
const { RepositoryError } = require('../../errors/AppError');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await mongoose.connection.dropDatabase();
});

const mockUserId = new mongoose.Types.ObjectId();
const mockSubjectId = new mongoose.Types.ObjectId();
const invalidId = 'invalid_id';

const mockTaskData = {
    userId: mockUserId,
    title: 'Test Task',
    estimatedTime: 60,
    finishDate: new Date('2026-05-10T10:00:00Z'),
    givenDate: new Date('2026-05-01T10:00:00Z'),
};

describe('taskRepository', () => {
    describe('createTasks', () => {
        it('should create a single task', async () => {
            const tasks = await TaskRepo.createTasks([mockTaskData]);
            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toBe(mockTaskData.title);
            expect(tasks[0].completed).toBe(false);
        });

        it('should create multiple tasks', async () => {
            const tasks = await TaskRepo.createTasks([mockTaskData, mockTaskData]);
            expect(tasks).toHaveLength(2);
        });

        it('should fail if title is missing', async () => {
            const { title, ...withoutTitle } = mockTaskData;
            await expect(TaskRepo.createTasks([withoutTitle])).rejects.toThrow();
        });

        it('should fail if estimatedTime is missing', async () => {
            const { estimatedTime, ...withoutEstimatedTime } = mockTaskData;
            await expect(TaskRepo.createTasks([withoutEstimatedTime])).rejects.toThrow();
        });

        it('should fail if finishDate is missing', async () => {
            const { finishDate, ...withoutFinishDate } = mockTaskData;
            await expect(TaskRepo.createTasks([withoutFinishDate])).rejects.toThrow();
        });

        it('should fail if givenDate is missing', async () => {
            const { givenDate, ...withoutGivenDate } = mockTaskData;
            await expect(TaskRepo.createTasks([withoutGivenDate])).rejects.toThrow();
        });
    });

    describe('getAllTasks', () => {
        it('should return all tasks for a user sorted by finishDate', async () => {
            const task1 = { ...mockTaskData, finishDate: new Date('2026-05-15T10:00:00Z') };
            const task2 = { ...mockTaskData, finishDate: new Date('2026-05-10T10:00:00Z') };
            await TaskRepo.createTasks([task1, task2]);

            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks).toHaveLength(2);
            expect(new Date(tasks[0].finishDate) <= new Date(tasks[1].finishDate)).toBe(true);
        });

        it('should not return tasks from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await TaskRepo.createTasks([{ ...mockTaskData, userId: otherUserId }]);
            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks).toHaveLength(0);
        });

        it('should return empty array if user has no tasks', async () => {
            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks).toHaveLength(0);
        });
    });

    describe('getTaskById', () => {
        it('should return a task by id', async () => {
            const [created] = await TaskRepo.createTasks([mockTaskData]);
            const found = await TaskRepo.getTaskById(mockUserId, created._id.toString());
            expect(found).not.toBeNull();
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should return null if task belongs to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await TaskRepo.createTasks([{ ...mockTaskData, userId: otherUserId }]);
            const found = await TaskRepo.getTaskById(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should throw RepositoryError if taskId format is invalid', async () => {
            await expect(TaskRepo.getTaskById(mockUserId, invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('updateTask', () => {
        it('should update a task', async () => {
            const [created] = await TaskRepo.createTasks([mockTaskData]);
            const updated = await TaskRepo.updateTask(mockUserId, created._id.toString(), { title: 'Updated' });
            expect(updated.title).toBe('Updated');
        });

        it('should return null if task does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const updated = await TaskRepo.updateTask(mockUserId, fakeId, { title: 'Updated' });
            expect(updated).toBeNull();
        });

        it('should not update a task belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await TaskRepo.createTasks([{ ...mockTaskData, userId: otherUserId }]);
            const updated = await TaskRepo.updateTask(mockUserId, created._id.toString(), { title: 'Hacked' });
            expect(updated).toBeNull();
        });

        it('should throw RepositoryError if taskId format is invalid', async () => {
            await expect(TaskRepo.updateTask(mockUserId, invalidId, { title: 'X' })).rejects.toThrow(RepositoryError);
        });
    });

    describe('toggleTaskCompletion', () => {
        it('should toggle completed from false to true', async () => {
            const [created] = await TaskRepo.createTasks([mockTaskData]);
            const updated = await TaskRepo.toggleTaskCompletion(mockUserId, created._id.toString());
            expect(updated.completed).toBe(true);
        });

        it('should toggle completed from true to false', async () => {
            const [created] = await TaskRepo.createTasks([{ ...mockTaskData, completed: true }]);
            const updated = await TaskRepo.toggleTaskCompletion(mockUserId, created._id.toString());
            expect(updated.completed).toBe(false);
        });

        it('should throw RepositoryError if taskId format is invalid', async () => {
            await expect(TaskRepo.toggleTaskCompletion(mockUserId, invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('deleteTask', () => {
        it('should delete a task', async () => {
            const [created] = await TaskRepo.createTasks([mockTaskData]);
            await TaskRepo.deleteTask(mockUserId, created._id.toString());
            const found = await TaskRepo.getTaskById(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should not delete a task belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await TaskRepo.createTasks([{ ...mockTaskData, userId: otherUserId }]);
            await TaskRepo.deleteTask(mockUserId, created._id.toString());
            const found = await TaskRepo.getTaskById(otherUserId, created._id.toString());
            expect(found).not.toBeNull();
        });

        it('should throw RepositoryError if taskId format is invalid', async () => {
            await expect(TaskRepo.deleteTask(mockUserId, invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('updateForwardTask', () => {
        it('should update all tasks in group from a date onwards', async () => {
            const groupId = 'group-1';
            const task1 = { ...mockTaskData, groupId, finishDate: new Date('2026-05-01T10:00:00Z') };
            const task2 = { ...mockTaskData, groupId, finishDate: new Date('2026-05-02T10:00:00Z') };
            const task3 = { ...mockTaskData, groupId, finishDate: new Date('2026-05-03T10:00:00Z') };
            const [t1, t2, t3] = await TaskRepo.createTasks([task1, task2, task3]);

            await TaskRepo.updateForwardTask(mockUserId, t2._id.toString(), groupId, { title: 'Updated' }, task2.finishDate);

            const tasks = await TaskRepo.getAllTasks(mockUserId);
            const updated = tasks.filter(t => t.title === 'Updated');
            const untouched = tasks.filter(t => t.title === mockTaskData.title);
            expect(updated).toHaveLength(2);
            expect(untouched).toHaveLength(1);
        });

        it('should update only the single task if groupId is null', async () => {
            const [created] = await TaskRepo.createTasks([mockTaskData]);
            await TaskRepo.updateForwardTask(mockUserId, created._id.toString(), null, { title: 'Updated' }, mockTaskData.finishDate);
            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks[0].title).toBe('Updated');
        });

        it('should throw RepositoryError if taskId format is invalid', async () => {
            await expect(
                TaskRepo.updateForwardTask(mockUserId, invalidId, null, { title: 'X' }, new Date())
            ).rejects.toThrow(RepositoryError);
        });
    });

    describe('updateAllTasksInGroup', () => {
        it('should update all tasks in a group', async () => {
            const groupId = 'group-1';
            await TaskRepo.createTasks([
                { ...mockTaskData, groupId },
                { ...mockTaskData, groupId },
                { ...mockTaskData, groupId }
            ]);

            const [first] = await TaskRepo.getAllTasks(mockUserId);
            await TaskRepo.updateAllTasksInGroup(mockUserId, first._id.toString(), groupId, { title: 'Updated' });

            const tasks = await TaskRepo.getAllTasks(mockUserId);
            tasks.forEach(t => expect(t.title).toBe('Updated'));
        });

        it('should update only the single task if groupId is null', async () => {
            const [created] = await TaskRepo.createTasks([mockTaskData]);
            await TaskRepo.updateAllTasksInGroup(mockUserId, created._id.toString(), null, { title: 'Updated' });
            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks[0].title).toBe('Updated');
        });
    });

    describe('deleteForwardTasks', () => {
        it('should delete all tasks in group from a date onwards', async () => {
            const groupId = 'group-1';
            const task1 = { ...mockTaskData, groupId, finishDate: new Date('2026-05-01T10:00:00Z') };
            const task2 = { ...mockTaskData, groupId, finishDate: new Date('2026-05-02T10:00:00Z') };
            const task3 = { ...mockTaskData, groupId, finishDate: new Date('2026-05-03T10:00:00Z') };
            const [t1, t2] = await TaskRepo.createTasks([task1, task2, task3]);

            await TaskRepo.deleteForwardTasks(mockUserId, t2._id.toString(), groupId, task2.finishDate);

            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks).toHaveLength(1);
            expect(tasks[0].finishDate.toISOString()).toBe(task1.finishDate.toISOString());
        });

        it('should delete only the single task if groupId is null', async () => {
            const [t1, t2] = await TaskRepo.createTasks([mockTaskData, mockTaskData]);
            await TaskRepo.deleteForwardTasks(mockUserId, t1._id.toString(), null, mockTaskData.finishDate);
            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks).toHaveLength(1);
        });
    });

    describe('deleteAllTasksInGroup', () => {
        it('should delete all tasks in a group', async () => {
            const groupId = 'group-1';
            await TaskRepo.createTasks([
                { ...mockTaskData, groupId },
                { ...mockTaskData, groupId },
                { ...mockTaskData }
            ]);

            await TaskRepo.deleteAllTasksInGroup(mockUserId, groupId);

            const tasks = await TaskRepo.getAllTasks(mockUserId);
            expect(tasks).toHaveLength(1);
            expect(tasks[0].groupId).toBeUndefined();
        });
    });
});