const CalendarRepo = require('../../repository/calendarRepository');
const EventRepo = require('../../repository/eventRepository');
const PlanRepo = require('../../repository/planRepository');
const CalendarService = require('../../services/calendarService');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../repository/calendarRepository');
jest.mock('../../repository/eventRepository');
jest.mock('../../repository/planRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = 'user123';
const mockCalendarId = '507f1f77bcf86cd799439011';

const mockCalendar = {
    _id: mockCalendarId,
    userId: mockUserId,
    name: 'Test Calendar',
    color: '#ff0000',
    visible: true,
    isSystem: false
};

describe('calendarService', () => {
    describe('getCustomCalendarsForUser', () => {
        it('should return custom calendars for the user', async () => {
            CalendarRepo.findCustomCalendarsForUser.mockResolvedValue([mockCalendar]);

            const result = await CalendarService.getCustomCalendarsForUser(mockUserId);

            expect(result).toEqual([mockCalendar]);
            expect(CalendarRepo.findCustomCalendarsForUser).toHaveBeenCalledWith(mockUserId);
        });

        it('should return empty array if user has no custom calendars', async () => {
            CalendarRepo.findCustomCalendarsForUser.mockResolvedValue([]);

            const result = await CalendarService.getCustomCalendarsForUser(mockUserId);

            expect(result).toHaveLength(0);
        });
    });

    describe('getSystemCalendarsForUser', () => {
        it('should return system calendars for the user', async () => {
            CalendarRepo.findSystemCalendarsForUser.mockResolvedValue([mockCalendar]);

            const result = await CalendarService.getSystemCalendarsForUser(mockUserId);

            expect(result).toEqual([mockCalendar]);
            expect(CalendarRepo.findSystemCalendarsForUser).toHaveBeenCalledWith(mockUserId);
        });
    });

    describe('createCalendarForUser', () => {
        it('should create a calendar with valid data', async () => {
            CalendarRepo.createCalendar.mockResolvedValue(mockCalendar);

            const result = await CalendarService.createCalendarForUser(mockUserId, {
                name: 'Test Calendar',
                color: '#ff0000'
            });

            expect(result).toEqual(mockCalendar);
            expect(CalendarRepo.createCalendar).toHaveBeenCalledWith({
                name: 'Test Calendar',
                color: '#ff0000',
                isSystem: false,
                userId: mockUserId
            });
        });

        it('should throw ValidationError if name is missing', async () => {
            await expect(
                CalendarService.createCalendarForUser(mockUserId, { color: '#ff0000' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if color is missing', async () => {
            await expect(
                CalendarService.createCalendarForUser(mockUserId, { name: 'Test' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if name exceeds 100 characters', async () => {
            await expect(
                CalendarService.createCalendarForUser(mockUserId, {
                    name: 'a'.repeat(101),
                    color: '#ff0000'
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should not allow creating a system calendar', async () => {
            CalendarRepo.createCalendar.mockResolvedValue(mockCalendar);

            await CalendarService.createCalendarForUser(mockUserId, {
                name: 'Test',
                color: '#ff0000',
                isSystem: true
            });

            expect(CalendarRepo.createCalendar).toHaveBeenCalledWith(
                expect.objectContaining({ isSystem: false })
            );
        });
    });

    describe('deleteCalendarForUser', () => {
        it('should delete a calendar and its events', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            CalendarRepo.deleteCalendar.mockResolvedValue({});
            EventRepo.deleteEventsByCalendarId.mockResolvedValue({});

            await CalendarService.deleteCalendarForUser(mockUserId, mockCalendarId);

            expect(CalendarRepo.deleteCalendar).toHaveBeenCalledWith(mockUserId, mockCalendarId);
            expect(EventRepo.deleteEventsByCalendarId).toHaveBeenCalledWith(mockCalendar._id);
        });

        it('should throw NotFoundError if calendar does not exist', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(null);

            await expect(
                CalendarService.deleteCalendarForUser(mockUserId, mockCalendarId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if calendar is a system calendar', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue({ ...mockCalendar, isSystem: true });

            await expect(
                CalendarService.deleteCalendarForUser(mockUserId, mockCalendarId)
            ).rejects.toThrow(ValidationError);

            expect(CalendarRepo.deleteCalendar).not.toHaveBeenCalled();
            expect(EventRepo.deleteEventsByCalendarId).not.toHaveBeenCalled();
        });
    });

    describe('cleanCalendarForUser', () => {
        it('should delete all events in the calendar but not the calendar itself', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            EventRepo.deleteEventsByCalendarId.mockResolvedValue({ deletedCount: 3 });

            await CalendarService.cleanCalendarForUser(mockUserId, mockCalendarId);

            expect(EventRepo.deleteEventsByCalendarId).toHaveBeenCalledWith(mockCalendar._id);
            expect(CalendarRepo.deleteCalendar).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if calendar does not exist', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(null);

            await expect(
                CalendarService.cleanCalendarForUser(mockUserId, mockCalendarId)
            ).rejects.toThrow(NotFoundError);

            expect(EventRepo.deleteEventsByCalendarId).not.toHaveBeenCalled();
            expect(PlanRepo.deletePlan).not.toHaveBeenCalled();
        });

        it('should call PlanRepo.deletePlan for the planned calendar', async () => {
            const plannedCalendar = { ...mockCalendar, name: 'calendar.planned', isSystem: true };
            CalendarRepo.findCalendarForUser.mockResolvedValue(plannedCalendar);
            PlanRepo.deletePlan.mockResolvedValue({});

            await CalendarService.cleanCalendarForUser(mockUserId, mockCalendarId);

            expect(PlanRepo.deletePlan).toHaveBeenCalledWith(mockUserId);
            expect(EventRepo.deleteEventsByCalendarId).not.toHaveBeenCalled();
        });

        it('should not call PlanRepo.deletePlan for a regular calendar', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            EventRepo.deleteEventsByCalendarId.mockResolvedValue({});

            await CalendarService.cleanCalendarForUser(mockUserId, mockCalendarId);

            expect(PlanRepo.deletePlan).not.toHaveBeenCalled();
        });
    });

    describe('updateCalendarForUser', () => {
        it('should update a calendar with valid data', async () => {
            const updatedCalendar = { ...mockCalendar, name: 'Updated', color: '#00ff00' };
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);
            CalendarRepo.updateCalendar.mockResolvedValue(updatedCalendar);

            const result = await CalendarService.updateCalendarForUser(mockUserId, mockCalendarId, {
                name: 'Updated',
                color: '#00ff00'
            });

            expect(result).toEqual(updatedCalendar);
        });

        it('should throw NotFoundError if calendar does not exist', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(null);

            await expect(
                CalendarService.updateCalendarForUser(mockUserId, mockCalendarId, {
                    name: 'Updated',
                    color: '#00ff00'
                })
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if name is missing', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);

            await expect(
                CalendarService.updateCalendarForUser(mockUserId, mockCalendarId, { color: '#00ff00' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if color is missing', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);

            await expect(
                CalendarService.updateCalendarForUser(mockUserId, mockCalendarId, { name: 'Updated' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if name exceeds 100 characters', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(mockCalendar);

            await expect(
                CalendarService.updateCalendarForUser(mockUserId, mockCalendarId, {
                    name: 'a'.repeat(101),
                    color: '#00ff00'
                })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('toggleCalendarVisibilityForUser', () => {
        it('should toggle visibility from true to false', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue({ ...mockCalendar, visible: true });
            CalendarRepo.updateCalendar.mockResolvedValue({ ...mockCalendar, visible: false });

            await CalendarService.toggleCalendarVisibilityForUser(mockUserId, mockCalendarId);

            expect(CalendarRepo.updateCalendar).toHaveBeenCalledWith(
                mockUserId,
                mockCalendarId,
                { visible: false }
            );
        });

        it('should toggle visibility from false to true', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue({ ...mockCalendar, visible: false });
            CalendarRepo.updateCalendar.mockResolvedValue({ ...mockCalendar, visible: true });

            await CalendarService.toggleCalendarVisibilityForUser(mockUserId, mockCalendarId);

            expect(CalendarRepo.updateCalendar).toHaveBeenCalledWith(
                mockUserId,
                mockCalendarId,
                { visible: true }
            );
        });

        it('should throw NotFoundError if calendar does not exist', async () => {
            CalendarRepo.findCalendarForUser.mockResolvedValue(null);

            await expect(
                CalendarService.toggleCalendarVisibilityForUser(mockUserId, mockCalendarId)
            ).rejects.toThrow(NotFoundError);
        });
    });
});