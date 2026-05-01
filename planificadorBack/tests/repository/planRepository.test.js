// tests/repository/planRepository.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const PlanRepo = require('../../repository/planRepository');
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
const mockTaskId = new mongoose.Types.ObjectId();
const mockCalendarId = new mongoose.Types.ObjectId();
const invalidId = 'invalid_id';

const mockPlanEventData = {
    userId: mockUserId,
    title: 'Matemáticas',
    calendarId: mockCalendarId.toString(),
    taskId: mockTaskId,
    start: new Date('2026-05-05T09:00:00Z'),
    end: new Date('2026-05-05T11:00:00Z'),
    scheduledTime: 120,
};

describe('planRepository', () => {
    describe('addPlan', () => {
        it('should create a single plan event', async () => {
            const events = await PlanRepo.addPlan([mockPlanEventData]);
            expect(events).toHaveLength(1);
            expect(events[0].title).toBe(mockPlanEventData.title);
            expect(events[0].status).toBe('pending');
        });

        it('should create multiple plan events', async () => {
            const events = await PlanRepo.addPlan([mockPlanEventData, mockPlanEventData]);
            expect(events).toHaveLength(2);
        });

        it('should fail if title is missing', async () => {
            const { title, ...withoutTitle } = mockPlanEventData;
            await expect(PlanRepo.addPlan([withoutTitle])).rejects.toThrow();
        });

        it('should fail if calendarId is missing', async () => {
            const { calendarId, ...withoutCalendarId } = mockPlanEventData;
            await expect(PlanRepo.addPlan([withoutCalendarId])).rejects.toThrow();
        });

        it('should fail if start is missing', async () => {
            const { start, ...withoutStart } = mockPlanEventData;
            await expect(PlanRepo.addPlan([withoutStart])).rejects.toThrow();
        });

        it('should fail if end is missing', async () => {
            const { end, ...withoutEnd } = mockPlanEventData;
            await expect(PlanRepo.addPlan([withoutEnd])).rejects.toThrow();
        });

        it('should fail if scheduledTime is missing', async () => {
            const { scheduledTime, ...withoutScheduledTime } = mockPlanEventData;
            await expect(PlanRepo.addPlan([withoutScheduledTime])).rejects.toThrow();
        });

        it('should fail if status is invalid', async () => {
            await expect(PlanRepo.addPlan([{ ...mockPlanEventData, status: 'invalid' }])).rejects.toThrow();
        });
    });

    describe('findPlanForUser', () => {
        it('should return all plan events for a user', async () => {
            await PlanRepo.addPlan([mockPlanEventData, mockPlanEventData]);
            const events = await PlanRepo.findPlanForUser(mockUserId);
            expect(events).toHaveLength(2);
        });

        it('should not return plan events from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await PlanRepo.addPlan([{ ...mockPlanEventData, userId: otherUserId }]);
            const events = await PlanRepo.findPlanForUser(mockUserId);
            expect(events).toHaveLength(0);
        });

        it('should return empty array if user has no plan', async () => {
            const events = await PlanRepo.findPlanForUser(mockUserId);
            expect(events).toHaveLength(0);
        });
    });

    describe('findPlanEventForUser', () => {
        it('should find a plan event by userId and planEventId', async () => {
            const [created] = await PlanRepo.addPlan([mockPlanEventData]);
            const found = await PlanRepo.findPlanEventForUser(mockUserId, created._id.toString());
            expect(found).not.toBeNull();
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should return null if plan event belongs to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await PlanRepo.addPlan([{ ...mockPlanEventData, userId: otherUserId }]);
            const found = await PlanRepo.findPlanEventForUser(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should throw RepositoryError if planEventId format is invalid', async () => {
            await expect(
                PlanRepo.findPlanEventForUser(mockUserId, invalidId)
            ).rejects.toThrow(RepositoryError);
        });
    });

    describe('deletePlan', () => {
        it('should delete all plan events for a user', async () => {
            await PlanRepo.addPlan([mockPlanEventData, mockPlanEventData]);
            await PlanRepo.deletePlan(mockUserId);
            const events = await PlanRepo.findPlanForUser(mockUserId);
            expect(events).toHaveLength(0);
        });

        it('should not delete plan events from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await PlanRepo.addPlan([{ ...mockPlanEventData, userId: otherUserId }]);
            await PlanRepo.deletePlan(mockUserId);
            const events = await PlanRepo.findPlanForUser(otherUserId);
            expect(events).toHaveLength(1);
        });
    });

    describe('deletePlanEvent', () => {
        it('should delete a single plan event', async () => {
            const [created] = await PlanRepo.addPlan([mockPlanEventData]);
            await PlanRepo.deletePlanEvent(mockUserId, created._id.toString());
            const found = await PlanRepo.findPlanEventForUser(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should not delete a plan event belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await PlanRepo.addPlan([{ ...mockPlanEventData, userId: otherUserId }]);
            await PlanRepo.deletePlanEvent(mockUserId, created._id.toString());
            const found = await PlanRepo.findPlanEventForUser(otherUserId, created._id.toString());
            expect(found).not.toBeNull();
        });

        it('should throw RepositoryError if planEventId format is invalid', async () => {
            await expect(
                PlanRepo.deletePlanEvent(mockUserId, invalidId)
            ).rejects.toThrow(RepositoryError);
        });
    });

    describe('updatePlanEvent', () => {
        it('should update status of a plan event', async () => {
            const [created] = await PlanRepo.addPlan([mockPlanEventData]);
            const updated = await PlanRepo.updatePlanEvent(
                mockUserId,
                created._id.toString(),
                { status: 'completed', userTime: 90 }
            );
            expect(updated.status).toBe('completed');
            expect(updated.userTime).toBe(90);
        });

        it('should return null if plan event does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const updated = await PlanRepo.updatePlanEvent(mockUserId, fakeId, { status: 'completed' });
            expect(updated).toBeNull();
        });

        it('should not update a plan event belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await PlanRepo.addPlan([{ ...mockPlanEventData, userId: otherUserId }]);
            const updated = await PlanRepo.updatePlanEvent(
                mockUserId,
                created._id.toString(),
                { status: 'completed' }
            );
            expect(updated).toBeNull();
        });

        it('should throw RepositoryError if planEventId format is invalid', async () => {
            await expect(
                PlanRepo.updatePlanEvent(mockUserId, invalidId, { status: 'completed' })
            ).rejects.toThrow(RepositoryError);
        });
    });
});