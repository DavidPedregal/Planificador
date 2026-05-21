const TaskRepo = require('../../repository/taskRepository');
const TaskService = require('../../services/taskService');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../repository/taskRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';
const mockTaskId = '507f1f77bcf86cd799439012';
const mockSubjectId = '507f1f77bcf86cd799439013';
const mockGroupId = 'some-uuid-group-id';

const mockTask = {
    _id: mockTaskId,
    userId: mockUserId,
    title: 'Test Task',
    estimatedTime: 60,
    finishDate: new Date('2026-05-10T10:00:00Z'),
    givenDate: new Date('2026-05-01T10:00:00Z'),
    completed: false,
    groupId: mockGroupId,
    subjectId: null,
    plannable: false
};

const mockTaskData = {
    title: 'Test Task',
    estimatedTime: 60,
    finishDate: '2026-05-10T10:00:00Z',
    givenDate: '2026-05-01T10:00:00Z',
};

describe('taskService', () => {
    describe('getAllTasks', () => {
        it('should return all tasks for a user', async () => {
            TaskRepo.getAllTasks.mockResolvedValue([mockTask]);
            const result = await TaskService.getAllTasks(mockUserId);
            expect(result).toEqual([mockTask]);
            expect(TaskRepo.getAllTasks).toHaveBeenCalledWith(mockUserId);
        });
    });

    describe('getTaskById', () => {
        it('should return a task by id', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            const result = await TaskService.getTaskById(mockUserId, mockTaskId);
            expect(result).toEqual(mockTask);
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(TaskService.getTaskById(mockUserId, mockTaskId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('getTasksToPlan', () => {
        it('should return plannable incomplete tasks', async () => {
            TaskRepo.getTasksToPlan.mockResolvedValue([mockTask]);

            const result = await TaskService.getTasksToPlan(mockUserId);

            expect(result).toEqual([mockTask]);
            expect(TaskRepo.getTasksToPlan).toHaveBeenCalledWith(mockUserId);
        });

        it('should return empty array if no tasks to plan', async () => {
            TaskRepo.getTasksToPlan.mockResolvedValue([]);

            const result = await TaskService.getTasksToPlan(mockUserId);

            expect(result).toHaveLength(0);
        });
    });
    
    describe('createTasks', () => {
        it('should create a single non-recurring task', async () => {
            TaskRepo.createTasks.mockResolvedValue([mockTask]);
            const result = await TaskService.createTasks(mockUserId, mockTaskData);
            expect(TaskRepo.createTasks).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ title: mockTaskData.title })])
            );
            expect(result).toEqual([mockTask]);
        });

        it('should create multiple tasks for a recurring task', async () => {
            TaskRepo.createTasks.mockResolvedValue([mockTask, mockTask, mockTask]);
            const recurringTaskData = {
                ...mockTaskData,
                frequencyType: 'day',
                frequencyInterval: 1,
                frequencyEndType: 'after',
                frequencyOccurrencesLeft: 3
            };

            await TaskService.createTasks(mockUserId, recurringTaskData);

            const callArg = TaskRepo.createTasks.mock.calls[0][0];
            expect(callArg.length).toBeGreaterThan(1);
        });

        it('should assign a groupId to all tasks when recurring', async () => {
            TaskRepo.createTasks.mockResolvedValue([mockTask, mockTask]);
            const recurringTaskData = {
                ...mockTaskData,
                frequencyType: 'day',
                frequencyInterval: 1,
                frequencyEndType: 'after',
                frequencyOccurrencesLeft: 2
            };

            await TaskService.createTasks(mockUserId, recurringTaskData);

            const callArg = TaskRepo.createTasks.mock.calls[0][0];
            const groupIds = callArg.map(t => t.groupId);
            expect(groupIds.every(id => id === groupIds[0])).toBe(true);
            expect(groupIds[0]).toBeDefined();
        });

        it('should not assign a groupId to a single non-recurring task', async () => {
            TaskRepo.createTasks.mockResolvedValue([mockTask]);
            await TaskService.createTasks(mockUserId, mockTaskData);

            const callArg = TaskRepo.createTasks.mock.calls[0][0];
            expect(callArg[0].groupId).toBeUndefined();
        });

        it('should throw ValidationError if subjectId is invalid', async () => {
            await expect(
                TaskService.createTasks(mockUserId, { ...mockTaskData, subjectId: 'invalid' })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('updateTask', () => {
        it('should update a task with valid changes', async () => {
            const updated = { ...mockTask, title: 'Updated' };
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.updateTask.mockResolvedValue(updated);

            const result = await TaskService.updateTask(mockUserId, mockTaskId, { title: 'Updated' });
            expect(result.title).toBe('Updated');
        });

        it('should return existing task if no changes detected', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);

            const result = await TaskService.updateTask(mockUserId, mockTaskId, {
                title: mockTask.title,
                estimatedTime: mockTask.estimatedTime
            });

            expect(result).toEqual(mockTask);
            expect(TaskRepo.updateTask).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(
                TaskService.updateTask(mockUserId, mockTaskId, { title: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateForwardTask', () => {
        it('should update forward tasks and return modifiedCount', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.updateForwardTask.mockResolvedValue({ modifiedCount: 2 });

            const result = await TaskService.updateForwardTask(mockUserId, mockTaskId, { title: 'Updated' });
            expect(result.modifiedCount).toBe(2);
            expect(TaskRepo.updateForwardTask).toHaveBeenCalledWith(
                mockUserId,
                mockTaskId,
                mockTask.groupId,
                expect.any(Object),
                mockTask.finishDate
            );
        });

        it('should return modifiedCount 0 if no changes detected', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);

            const result = await TaskService.updateForwardTask(mockUserId, mockTaskId, {
                title: mockTask.title,
                estimatedTime: mockTask.estimatedTime
            });

            expect(result.modifiedCount).toBe(0);
            expect(TaskRepo.updateForwardTask).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(
                TaskService.updateForwardTask(mockUserId, mockTaskId, { title: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateAllTasksInGroup', () => {
        it('should update all tasks in group and return modifiedCount', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.updateAllTasksInGroup.mockResolvedValue({ modifiedCount: 3 });

            const result = await TaskService.updateAllTasksInGroup(mockUserId, mockTaskId, { title: 'Updated' });
            expect(result.modifiedCount).toBe(3);
        });

        it('should return modifiedCount 0 if no changes detected', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);

            const result = await TaskService.updateAllTasksInGroup(mockUserId, mockTaskId, {
                title: mockTask.title,
                estimatedTime: mockTask.estimatedTime
            });

            expect(result.modifiedCount).toBe(0);
            expect(TaskRepo.updateAllTasksInGroup).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(
                TaskService.updateAllTasksInGroup(mockUserId, mockTaskId, { title: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('toggleTaskCompletion', () => {
        it('should toggle task completion', async () => {
            const toggled = { ...mockTask, completed: true };
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.toggleTaskCompletion.mockResolvedValue(toggled);

            const result = await TaskService.toggleTaskCompletion(mockUserId, mockTaskId);
            expect(result.completed).toBe(true);
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(
                TaskService.toggleTaskCompletion(mockUserId, mockTaskId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteTask', () => {
        it('should delete a task', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.deleteTask.mockResolvedValue({});

            await TaskService.deleteTask(mockUserId, mockTaskId);
            expect(TaskRepo.deleteTask).toHaveBeenCalledWith(mockUserId, mockTaskId);
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(TaskService.deleteTask(mockUserId, mockTaskId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteForwardTasks', () => {
        it('should delete forward tasks and return modifiedCount', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.deleteForwardTasks.mockResolvedValue({ deletedCount: 2 });

            const result = await TaskService.deleteForwardTasks(mockUserId, mockTaskId);
            expect(result.modifiedCount).toBe(2);
            expect(TaskRepo.deleteForwardTasks).toHaveBeenCalledWith(
                mockUserId,
                mockTaskId,
                mockTask.groupId,
                mockTask.finishDate
            );
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(TaskService.deleteForwardTasks(mockUserId, mockTaskId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateTaskAfterPlanEventCompletion', () => {
        it('should mark task as completed when timeSpent >= estimatedTime', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({ ...mockTask, completed: true });

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime);

            expect(TaskRepo.markTaskAsCompleted).toHaveBeenCalledWith(mockUserId, mockTaskId);
        });

        it('should mark task as completed when timeSpent exceeds estimatedTime', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({ ...mockTask, completed: true });

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime + 30);

            expect(TaskRepo.markTaskAsCompleted).toHaveBeenCalledWith(mockUserId, mockTaskId);
        });

        it('should not mark task as completed when timeSpent < estimatedTime', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime - 1);

            expect(TaskRepo.markTaskAsCompleted).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(
                TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, 60)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteAllTasksInGroup', () => {
        it('should delete all tasks in group and return modifiedCount', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.deleteAllTasksInGroup.mockResolvedValue({ deletedCount: 3 });

            const result = await TaskService.deleteAllTasksInGroup(mockUserId, mockTaskId);
            expect(result.modifiedCount).toBe(3);
            expect(TaskRepo.deleteAllTasksInGroup).toHaveBeenCalledWith(mockUserId, mockTask.groupId);
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(TaskService.deleteAllTasksInGroup(mockUserId, mockTaskId)).rejects.toThrow(NotFoundError);
        });
    });
});