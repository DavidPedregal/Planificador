// tests/service/planService.test.js
const PlanRepo = require('../../repository/planRepository');
const PlanService = require('../../services/planService');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../repository/planRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';
const mockPlanEventId = '507f1f77bcf86cd799439012';
const mockTaskId = '507f1f77bcf86cd799439013';
const mockCalendarId = '507f1f77bcf86cd799439014';

const mockPlanEvent = {
    _id: mockPlanEventId,
    userId: mockUserId,
    title: 'Matemáticas',
    calendarId: mockCalendarId,
    taskId: mockTaskId,
    start: new Date('2026-05-05T09:00:00Z'),
    end: new Date('2026-05-05T11:00:00Z'),
    scheduledTime: 120,
    status: 'pending'
};

describe('planService', () => {
    describe('getPlanForUser', () => {
        it('should return all plan events for a user', async () => {
            PlanRepo.findPlanForUser.mockResolvedValue([mockPlanEvent]);
            const result = await PlanService.getPlanForUser(mockUserId);
            expect(result).toEqual([mockPlanEvent]);
            expect(PlanRepo.findPlanForUser).toHaveBeenCalledWith(mockUserId);
        });

        it('should return empty array if user has no plan', async () => {
            PlanRepo.findPlanForUser.mockResolvedValue([]);
            const result = await PlanService.getPlanForUser(mockUserId);
            expect(result).toHaveLength(0);
        });
    });

    describe('addPlan', () => {
        it('should add userId to each event and save', async () => {
            PlanRepo.addPlan.mockResolvedValue([mockPlanEvent]);
            const planEvents = [{ title: 'Matemáticas', scheduledTime: 120 }];

            await PlanService.addPlan([mockPlanEvent]);

            expect(PlanRepo.addPlan).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ userId: mockUserId, title: 'Matemáticas' })
                ])
            );
        });

        it('should handle multiple events', async () => {
            PlanRepo.addPlan.mockResolvedValue([mockPlanEvent, mockPlanEvent]);
            const planEvents = [
                { title: 'Matemáticas', scheduledTime: 120 },
                { title: 'Historia', scheduledTime: 60 }
            ];

            await PlanService.addPlan(planEvents);

            const callArg = PlanRepo.addPlan.mock.calls[0][0];
            expect(callArg).toHaveLength(2);
        });
    });

    describe('deletePlan', () => {
        it('should delete all plan events for a user', async () => {
            PlanRepo.deletePlan.mockResolvedValue({});
            await PlanService.deletePlan(mockUserId);
            expect(PlanRepo.deletePlan).toHaveBeenCalledWith(mockUserId);
        });
    });

    describe('deletePlanEvent', () => {
        it('should delete a plan event', async () => {
            PlanRepo.findPlanEventForUser.mockResolvedValue(mockPlanEvent);
            PlanRepo.deletePlanEvent.mockResolvedValue({});

            await PlanService.deletePlanEvent(mockUserId, mockPlanEventId);
            expect(PlanRepo.deletePlanEvent).toHaveBeenCalledWith(mockUserId, mockPlanEventId);
        });

        it('should throw NotFoundError if plan event does not exist', async () => {
            PlanRepo.findPlanEventForUser.mockResolvedValue(null);
            await expect(
                PlanService.deletePlanEvent(mockUserId, mockPlanEventId)
            ).rejects.toThrow(NotFoundError);
            expect(PlanRepo.deletePlanEvent).not.toHaveBeenCalled();
        });
    });

    describe('updatePlanEvent', () => {
        it('should update status to completed with userTime', async () => {
            PlanRepo.updatePlanEvent.mockResolvedValue({ ...mockPlanEvent, status: 'completed', userTime: 90 });

            const result = await PlanService.updatePlanEvent(mockUserId, mockPlanEventId, {
                status: 'completed',
                userTime: 90
            });

            expect(result.status).toBe('completed');
            expect(PlanRepo.updatePlanEvent).toHaveBeenCalledWith(
                mockUserId,
                mockPlanEventId,
                { status: 'completed', userTime: 90 }
            );
        });

        it('should update status to uncompleted without userTime', async () => {
            PlanRepo.updatePlanEvent.mockResolvedValue({ ...mockPlanEvent, status: 'uncompleted' });

            const result = await PlanService.updatePlanEvent(mockUserId, mockPlanEventId, {
                status: 'uncompleted'
            });

            expect(result.status).toBe('uncompleted');
        });

        it('should throw ValidationError if status is missing', async () => {
            await expect(
                PlanService.updatePlanEvent(mockUserId, mockPlanEventId, {})
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if status is invalid', async () => {
            await expect(
                PlanService.updatePlanEvent(mockUserId, mockPlanEventId, { status: 'invalid' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if status is completed but userTime is missing', async () => {
            await expect(
                PlanService.updatePlanEvent(mockUserId, mockPlanEventId, { status: 'completed' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if userTime is negative or zero', async () => {
            await expect(
                PlanService.updatePlanEvent(mockUserId, mockPlanEventId, { status: 'completed', userTime: 0 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw NotFoundError if plan event does not exist', async () => {
            PlanRepo.updatePlanEvent.mockResolvedValue(null);
            await expect(
                PlanService.updatePlanEvent(mockUserId, mockPlanEventId, { status: 'uncompleted' })
            ).rejects.toThrow(NotFoundError);
        });
    });
});