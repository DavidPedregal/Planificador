const mongoose = require('mongoose');
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
        const completionDate = new Date('2026-05-22T10:00:00Z');

        it('should mark task as completed when timeSpent >= estimatedTime', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({ ...mockTask, completed: true });

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, completionDate);

            expect(TaskRepo.markTaskAsCompleted).toHaveBeenCalledWith(mockUserId, mockTaskId);
        });

        it('should mark task as completed when timeSpent exceeds estimatedTime', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({ ...mockTask, completed: true });

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime + 30, null, completionDate);

            expect(TaskRepo.markTaskAsCompleted).toHaveBeenCalledWith(mockUserId, mockTaskId);
        });

        it('should not mark task as completed when timeSpent < estimatedTime', async () => {
            TaskRepo.getTaskById.mockResolvedValue(mockTask);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime - 1, null, completionDate);

            expect(TaskRepo.markTaskAsCompleted).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if task does not exist', async () => {
            TaskRepo.getTaskById.mockResolvedValue(null);
            await expect(
                TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, 60, null, completionDate)
            ).rejects.toThrow(NotFoundError);
        });

        it('should not create a review when includeReviews is false', async () => {
            TaskRepo.getTaskById.mockResolvedValue({ ...mockTask, includeReviews: false });
            TaskRepo.markTaskAsCompleted.mockResolvedValue({});

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, completionDate);

            expect(TaskRepo.createTasks).not.toHaveBeenCalled();
        });

        it('should create a first review when task has includeReviews and is not a review', async () => {
            const reviewableTask = {
                ...mockTask,
                includeReviews: true,
                isReview: false,
                ef: 2.5,
                interval: 0,
                iteration: 0,
                finishDate: new Date('2026-12-31T00:00:00Z'),
            };
            TaskRepo.getTaskById.mockResolvedValue(reviewableTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({});
            TaskRepo.createTasks.mockResolvedValue([{}]);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, completionDate);

            expect(TaskRepo.createTasks).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        isReview: true,
                        includeReviews: true,
                        plannable: true,
                        reviewOf: reviewableTask._id,
                    })
                ])
            );
        });

        it('should set givenDate before finishDate on the generated review', async () => {
            const reviewableTask = {
                ...mockTask,
                includeReviews: true,
                isReview: false,
                ef: 2.5,
                interval: 0,
                iteration: 0,
                finishDate: new Date('2026-12-31T00:00:00Z'),
            };
            TaskRepo.getTaskById.mockResolvedValue(reviewableTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({});
            TaskRepo.createTasks.mockResolvedValue([{}]);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, completionDate);

            const [reviewTasks] = TaskRepo.createTasks.mock.calls;
            const review = reviewTasks[0][0];
            expect(new Date(review.givenDate) < new Date(review.finishDate)).toBe(true);
        });

        it('should set givenDate at least 1 day after the completion date', async () => {
            const reviewableTask = {
                ...mockTask,
                includeReviews: true,
                isReview: false,
                ef: 2.5,
                interval: 0,
                iteration: 0,
                finishDate: new Date('2026-12-31T00:00:00Z'),
            };
            TaskRepo.getTaskById.mockResolvedValue(reviewableTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({});
            TaskRepo.createTasks.mockResolvedValue([{}]);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, completionDate);

            const [reviewTasks] = TaskRepo.createTasks.mock.calls;
            const review = reviewTasks[0][0];
            const midnightNextDay = new Date(completionDate);
            midnightNextDay.setHours(0, 0, 0, 0);
            midnightNextDay.setDate(midnightNextDay.getDate() + 1);
            expect(new Date(review.givenDate) >= midnightNextDay).toBe(true);
        });

        it('should calculate review dates from midnight regardless of the completion time', async () => {
            const reviewableTask = {
                ...mockTask,
                includeReviews: true,
                isReview: false,
                ef: 2.5,
                interval: 0,
                iteration: 0,
                finishDate: new Date('2026-12-31T00:00:00Z'),
            };
            TaskRepo.getTaskById.mockResolvedValue(reviewableTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({});
            TaskRepo.createTasks.mockResolvedValue([{}]);

            const lateEveningDate = new Date('2026-05-22T23:45:00Z');
            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, lateEveningDate);

            const [reviewTasks] = TaskRepo.createTasks.mock.calls;
            const review = reviewTasks[0][0];
            expect(new Date(review.givenDate).getHours()).toBe(0);
            expect(new Date(review.givenDate).getMinutes()).toBe(0);
            expect(new Date(review.finishDate).getHours()).toBe(0);
            expect(new Date(review.finishDate).getMinutes()).toBe(0);
        });

        it('should create next review using original task when completing a review', async () => {
            const originalTaskId = new mongoose.Types.ObjectId().toString();
            const reviewTask = {
                ...mockTask,
                _id: mockTaskId,
                includeReviews: true,
                isReview: true,
                reviewOf: originalTaskId,
                ef: 2.5,
                interval: 6,
                iteration: 1,
            };
            const originalTask = {
                ...mockTask,
                _id: originalTaskId,
                estimatedTime: 120,
                finishDate: new Date('2026-12-31T00:00:00Z'),
            };
            TaskRepo.getTaskById
                .mockResolvedValueOnce(reviewTask)
                .mockResolvedValueOnce(originalTask)
                .mockResolvedValueOnce(originalTask);
            TaskRepo.markTaskAsCompleted.mockResolvedValue({});
            TaskRepo.createTasks.mockResolvedValue([{}]);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, reviewTask.estimatedTime, 4, completionDate);

            expect(TaskRepo.createTasks).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        isReview: true,
                        reviewOf: originalTaskId,
                    })
                ])
            );
        });

        it('should do nothing if the task is already completed', async () => {
            const alreadyCompleted = { ...mockTask, completed: true, includeReviews: true };
            TaskRepo.getTaskById.mockResolvedValue(alreadyCompleted);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime, null, completionDate);

            expect(TaskRepo.markTaskAsCompleted).not.toHaveBeenCalled();
            expect(TaskRepo.createTasks).not.toHaveBeenCalled();
        });

        it('should not create a review when timeSpent < estimatedTime even if includeReviews is true', async () => {
            const reviewableTask = { ...mockTask, includeReviews: true, isReview: false };
            TaskRepo.getTaskById.mockResolvedValue(reviewableTask);

            await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, mockTask.estimatedTime - 1, null, completionDate);

            expect(TaskRepo.createTasks).not.toHaveBeenCalled();
        });

        describe('SM-2 spaced repetition logic', () => {
            const reviewDate = new Date('2026-06-23T10:00:00Z');
            const originalTaskId = new mongoose.Types.ObjectId().toString();
            const originalTask = {
                _id: originalTaskId,
                userId: mockUserId,
                estimatedTime: 120,
                finishDate: new Date('2026-07-30T00:00:00Z'),
            };

            function makeTask(overrides = {}) {
                return {
                    ...mockTask,
                    includeReviews: true,
                    isReview: false,
                    completed: false,
                    ef: 2.5,
                    interval: 0,
                    iteration: 0,
                    estimatedTime: 120,
                    finishDate: new Date('2026-07-30T00:00:00Z'),
                    ...overrides,
                };
            }

            function makeReviewTask(overrides = {}) {
                return makeTask({
                    isReview: true,
                    reviewOf: originalTaskId,
                    interval: 1,
                    iteration: 1,
                    ...overrides,
                });
            }

            function setupNonReviewMocks(task) {
                TaskRepo.getTaskById.mockResolvedValueOnce(task).mockResolvedValue(task);
                TaskRepo.markTaskAsCompleted.mockResolvedValue({});
                TaskRepo.createTasks.mockResolvedValue([{}]);
            }

            function setupReviewMocks(reviewTask) {
                TaskRepo.getTaskById
                    .mockResolvedValueOnce(reviewTask)
                    .mockResolvedValueOnce(originalTask)
                    .mockResolvedValue(originalTask);
                TaskRepo.markTaskAsCompleted.mockResolvedValue({});
                TaskRepo.createTasks.mockResolvedValue([{}]);
            }

            function getCreatedReview() {
                return TaskRepo.createTasks.mock.calls[0][0][0];
            }

            it('first review always has iteration=1 and interval=1', async () => {
                const task = makeTask();
                setupNonReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, null, reviewDate);
                const review = getCreatedReview();
                expect(review.iteration).toBe(1);
                expect(review.interval).toBe(1);
            });

            it('perfect rating (5) increases EF from 2.5 to 2.6', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 1, interval: 1 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 5, reviewDate);
                expect(getCreatedReview().ef).toBeCloseTo(2.6, 5);
            });

            it('rating 4 leaves EF unchanged', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 1, interval: 1 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 4, reviewDate);
                // ef = 2.5 + (0.1 - 1*(0.08+0.02)) = 2.5
                expect(getCreatedReview().ef).toBeCloseTo(2.5, 5);
            });

            it('rating 3 decreases EF slightly', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 1, interval: 1 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 3, reviewDate);
                // ef = 2.5 + (0.1 - 2*(0.08+0.04)) = 2.5 - 0.14 = 2.36
                expect(getCreatedReview().ef).toBeCloseTo(2.36, 5);
            });

            it('second review with rating >= 3 progresses to iteration=2 and interval=6', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 1, interval: 1 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 4, reviewDate);
                const review = getCreatedReview();
                expect(review.iteration).toBe(2);
                expect(review.interval).toBe(6);
            });

            it('third review with rating 5 gives interval = round(lastInterval × newEF)', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 2, interval: 6 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 5, reviewDate);
                const review = getCreatedReview();
                expect(review.iteration).toBe(3);
                expect(review.interval).toBe(Math.round(6 * 2.6)); // 16
            });

            it('rating 2 (< 3) resets iteration to 1 and interval to 1', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 3, interval: 15 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 2, reviewDate);
                const review = getCreatedReview();
                expect(review.iteration).toBe(1);
                expect(review.interval).toBe(1);
            });

            it('rating 1 resets regardless of how far the chain had progressed', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 5, interval: 60 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 1, reviewDate);
                const review = getCreatedReview();
                expect(review.iteration).toBe(1);
                expect(review.interval).toBe(1);
            });

            it('rating 3 (boundary) does not reset — interval progresses to 6', async () => {
                const task = makeReviewTask({ ef: 2.5, iteration: 1, interval: 1 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 3, reviewDate);
                const review = getCreatedReview();
                expect(review.iteration).toBe(2);
                expect(review.interval).toBe(6);
            });

            it('EF is clamped to minimum 1.3 when rating is 0', async () => {
                const task = makeReviewTask({ ef: 1.35, iteration: 1, interval: 1 });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 0, reviewDate);
                // ef_raw = 1.35 + (0.1 - 5*0.18) = 0.55 → clamped to 1.3
                expect(getCreatedReview().ef).toBeCloseTo(1.3, 5);
            });

            it('EF cannot drop below 1.3 even after two consecutive failures', async () => {
                const task1 = makeReviewTask({ ef: 2.5, iteration: 1, interval: 1 });
                setupReviewMocks(task1);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task1.estimatedTime, 0, reviewDate);
                const review1 = getCreatedReview();
                expect(review1.ef).toBeGreaterThanOrEqual(1.3);

                jest.clearAllMocks();

                const task2 = makeReviewTask({ ef: review1.ef, iteration: 1, interval: 1 });
                setupReviewMocks(task2);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task2.estimatedTime, 0, reviewDate);
                expect(getCreatedReview().ef).toBeCloseTo(1.3, 5);
            });

            it('review title is preserved when completing a review (no double-prefix)', async () => {
                const task = makeReviewTask({ title: 'Review: Math Exam' });
                setupReviewMocks(task);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 4, reviewDate);
                expect(getCreatedReview().title).toBe('Review: Math Exam');
            });

            it('does not create a review if the original task no longer exists', async () => {
                const task = makeTask();
                TaskRepo.getTaskById.mockResolvedValueOnce(task).mockResolvedValue(null);
                TaskRepo.markTaskAsCompleted.mockResolvedValue({});
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, null, reviewDate);
                expect(TaskRepo.createTasks).not.toHaveBeenCalled();
            });

            it('does not create a review when the next givenDate falls after the original task finishDate', async () => {
                // Original task was due yesterday — the next review would start tomorrow, which is past the deadline
                const pastFinishDate = new Date(reviewDate.getTime() - 24 * 60 * 60 * 1000); // yesterday
                const task = makeTask();
                const expiredOriginal = { ...originalTask, finishDate: pastFinishDate };
                TaskRepo.getTaskById.mockResolvedValueOnce(task).mockResolvedValue(expiredOriginal);
                TaskRepo.markTaskAsCompleted.mockResolvedValue({});
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, null, reviewDate);
                expect(TaskRepo.createTasks).not.toHaveBeenCalled();
            });

            it('creates a review when the next givenDate is before the original task finishDate', async () => {
                // Original task finishDate is far in the future — review is valid
                const futureFinishDate = new Date(reviewDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
                const task = makeTask();
                const activeOriginal = { ...originalTask, finishDate: futureFinishDate };
                TaskRepo.getTaskById.mockResolvedValueOnce(task).mockResolvedValue(activeOriginal);
                TaskRepo.markTaskAsCompleted.mockResolvedValue({});
                TaskRepo.createTasks.mockResolvedValue([{}]);
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, null, reviewDate);
                expect(TaskRepo.createTasks).toHaveBeenCalled();
            });

            it('does not create a review when a long interval pushes the givenDate past the original finishDate', async () => {
                // Third review at n=3 with ef=2.5 gives interval=15 days — if finishDate is only 5 days away, skip it
                const nearFinishDate = new Date(reviewDate.getTime() + 5 * 24 * 60 * 60 * 1000);
                const task = makeReviewTask({ ef: 2.5, iteration: 2, interval: 6 });
                const nearDeadlineOriginal = { ...originalTask, finishDate: nearFinishDate };
                TaskRepo.getTaskById
                    .mockResolvedValueOnce(task)
                    .mockResolvedValueOnce(nearDeadlineOriginal)
                    .mockResolvedValue(nearDeadlineOriginal);
                TaskRepo.markTaskAsCompleted.mockResolvedValue({});
                await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, 5, reviewDate);
                expect(TaskRepo.createTasks).not.toHaveBeenCalled();
            });

            it('givenDate is always strictly before finishDate for every rating', async () => {
                for (const rating of [0, 1, 2, 3, 4, 5]) {
                    jest.clearAllMocks();
                    const task = makeReviewTask({ ef: 2.5, iteration: 2, interval: 6 });
                    setupReviewMocks(task);
                    await TaskService.updateTaskAfterPlanEventCompletion(mockUserId, mockTaskId, task.estimatedTime, rating, reviewDate);
                    const review = getCreatedReview();
                    expect(new Date(review.givenDate) < new Date(review.finishDate)).toBe(true);
                }
            });
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