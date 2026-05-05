const PlanRepo = require('../../repository/planRepository');
const EventService = require('../../services/eventService');
const TaskService = require('../../services/taskService');
const CalendarService = require('../../services/calendarService');
const PlanService = require('../../services/planService');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../repository/planRepository');
jest.mock('../../services/eventService');
jest.mock('../../services/taskService');
jest.mock('../../services/calendarService');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';
const mockPlanEventId = '507f1f77bcf86cd799439012';
const mockTaskId = '507f1f77bcf86cd799439013';
const mockCalendarId = '507f1f77bcf86cd799439014';
const mockPlannedCalendarId = '507f1f77bcf86cd799439015';

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

const mockTask = {
    _id: mockTaskId,
    title: 'Matemáticas',
    estimatedTime: 120,
    finishDate: new Date('2026-05-10T00:00:00Z'),
    givenDate: new Date('2026-05-01T00:00:00Z'),
    includeReviews: false
};

const mockSlot = {
    start: new Date('2026-05-05T09:00:00Z'),
    end: new Date('2026-05-05T12:00:00Z')
};

const mockPlannedCalendar = {
    _id: mockPlannedCalendarId,
    name: 'Planned',
    isSystem: true
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

    describe('getPlanEventForUser', () => {
        it('should return a plan event by id', async () => {
            PlanRepo.findPlanEventForUser.mockResolvedValue(mockPlanEvent);
            const result = await PlanService.getPlanEventForUser(mockUserId, mockPlanEventId);
            expect(result).toEqual(mockPlanEvent);
        });

        it('should throw NotFoundError if plan event does not exist', async () => {
            PlanRepo.findPlanEventForUser.mockResolvedValue(null);
            await expect(
                PlanService.getPlanEventForUser(mockUserId, mockPlanEventId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('getDataToPlan', () => {
        beforeEach(() => {
            PlanRepo.findPlanForUser.mockResolvedValue([mockPlanEvent]);
            EventService.getPlannableEventsForUser.mockResolvedValue([mockSlot]);
            TaskService.getTasksToPlan.mockResolvedValue([mockTask]);
        });

        it('should return mapped data for the planner', async () => {
            const result = await PlanService.getDataToPlan(mockUserId);
            expect(result).toHaveProperty('mappedPreviousPlan');
            expect(result).toHaveProperty('mappedPlannableSlots');
            expect(result).toHaveProperty('mappedTasks');
        });

        it('should map tasks with correct fields', async () => {
            const result = await PlanService.getDataToPlan(mockUserId);
            const task = result.mappedTasks[0];
            expect(task).toHaveProperty('taskId');
            expect(task).toHaveProperty('title');
            expect(task).toHaveProperty('estimatedTime');
            expect(task).toHaveProperty('finishDate');
            expect(task).toHaveProperty('givenDate');
            expect(task).toHaveProperty('includeReviews');
        });

        it('should map slots with correct fields', async () => {
            const result = await PlanService.getDataToPlan(mockUserId);
            const slot = result.mappedPlannableSlots[0];
            expect(slot).toHaveProperty('start');
            expect(slot).toHaveProperty('end');
        });

        it('should map previous plan with status', async () => {
            const result = await PlanService.getDataToPlan(mockUserId);
            const block = result.mappedPreviousPlan[0];
            expect(block).toHaveProperty('taskId');
            expect(block).toHaveProperty('scheduledTime');
            expect(block).toHaveProperty('status');
        });
    });

    describe('addPlan', () => {
        it('should map plan data and save to repo', async () => {
            CalendarService.getSystemCalendarsForUser.mockResolvedValue([mockPlannedCalendar]);
            PlanRepo.addPlan.mockResolvedValue([mockPlanEvent]);

            const planEvents = [{
                taskId: mockTaskId,
                title: 'Matemáticas',
                start: '2026-05-05T09:00:00Z',
                end: '2026-05-05T11:00:00Z',
                scheduledTime: 120
            }];

            await PlanService.addPlan(planEvents, mockUserId);

            expect(PlanRepo.addPlan).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        userId: mockUserId,
                        calendarId: mockPlannedCalendarId,
                        status: 'pending'
                    })
                ])
            );
        });

        it('should throw NotFoundError if Planned calendar does not exist', async () => {
            CalendarService.getSystemCalendarsForUser.mockResolvedValue([]);

            await expect(
                PlanService.addPlan([], mockUserId)
            ).rejects.toThrow(NotFoundError);
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

        it('should throw ValidationError if userTime is zero or negative', async () => {
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