// tests/service/eventService.test.js
const EventRepo = require('../../repository/eventRepository');
const CalendarRepo = require('../../repository/calendarRepository');
const EventService = require('../../services/eventService');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../repository/eventRepository');
jest.mock('../../repository/calendarRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';
const mockEventId = '507f1f77bcf86cd799439012';
const mockCalendarId = '507f1f77bcf86cd799439013';
const mockGroupId = 'some-uuid-group-id';


const mockPlannableCalendar = {
    _id: mockCalendarId,
    name: 'calendar.plannable',
    isSystem: true,
    userId: mockUserId
};

const mockEvent = {
    _id: mockEventId,
    userId: mockUserId,
    title: 'Test Event',
    calendarId: mockCalendarId,
    start: new Date('2026-05-01T10:00:00Z'),
    end: new Date('2026-05-01T11:00:00Z'),
    useCalendarColor: true,
    color: '#ff0000',
    groupId: mockGroupId
};

const mockEventData = {
    title: 'Test Event',
    calendarId: mockCalendarId,
    start: '2026-05-01T10:00:00Z',
    end: '2026-05-01T11:00:00Z',
    useCalendarColor: true,
    color: '#ff0000',
};

describe('eventService', () => {
    describe('getAllEvents', () => {
        it('should return all events for a user', async () => {
            EventRepo.getEventsByUserId.mockResolvedValue([mockEvent]);
            const result = await EventService.getAllEvents(mockUserId);
            expect(result).toEqual([mockEvent]);
            expect(EventRepo.getEventsByUserId).toHaveBeenCalledWith(mockUserId);
        });
    });

    describe('getEventById', () => {
        it('should return an event by id', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            const result = await EventService.getEventById(mockUserId, mockEventId);
            expect(result).toEqual(mockEvent);
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(EventService.getEventById(mockUserId, mockEventId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('getPlannableEventsForUser', () => {
        it('should return plannable events for user', async () => {
            CalendarRepo.findSystemCalendarsForUser.mockResolvedValue([mockPlannableCalendar]);
            EventRepo.getPlannableEventsForUser.mockResolvedValue([mockEvent]);

            const result = await EventService.getPlannableEventsForUser(mockUserId);

            expect(result).toEqual([mockEvent]);
            expect(EventRepo.getPlannableEventsForUser).toHaveBeenCalledWith(
                mockUserId,
                mockCalendarId
            );
        });

        it('should throw NotFoundError if Plannable calendar does not exist', async () => {
            CalendarRepo.findSystemCalendarsForUser.mockResolvedValue([]);

            await expect(
                EventService.getPlannableEventsForUser(mockUserId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should not use a non-Plannable system calendar', async () => {
            CalendarRepo.findSystemCalendarsForUser.mockResolvedValue([
                { _id: mockCalendarId, name: 'Planned', isSystem: true }
            ]);

            await expect(
                EventService.getPlannableEventsForUser(mockUserId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('createEvent', () => {
        it('should create a single non-recurring event', async () => {
            EventRepo.createEvent.mockResolvedValue([mockEvent]);
            const result = await EventService.createEvent(mockUserId, mockEventData);
            expect(EventRepo.createEvent).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ title: mockEventData.title })])
            );
            expect(result).toEqual([mockEvent]);
        });

        it('should throw ValidationError if title is missing', async () => {
            const { title, ...withoutTitle } = mockEventData;
            await expect(EventService.createEvent(mockUserId, withoutTitle)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if start is missing', async () => {
            const { start, ...withoutStart } = mockEventData;
            await expect(EventService.createEvent(mockUserId, withoutStart)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if end is missing', async () => {
            const { end, ...withoutEnd } = mockEventData;
            await expect(EventService.createEvent(mockUserId, withoutEnd)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if calendarId is missing', async () => {
            const { calendarId, ...withoutCalendarId } = mockEventData;
            await expect(EventService.createEvent(mockUserId, withoutCalendarId)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if end is before start', async () => {
            await expect(EventService.createEvent(mockUserId, {
                ...mockEventData,
                start: '2026-05-01T11:00:00Z',
                end: '2026-05-01T10:00:00Z'
            })).rejects.toThrow(ValidationError);
        });

        it('should create multiple events for a recurring event', async () => {
            EventRepo.createEvent.mockResolvedValue([mockEvent, mockEvent, mockEvent]);
            const recurringEventData = {
                ...mockEventData,
                frequencyType: 'day',
                frequencyInterval: 1,
                frequencyEndType: 'after',
                frequencyOccurrencesLeft: 3
            };

            await EventService.createEvent(mockUserId, recurringEventData);

            const callArg = EventRepo.createEvent.mock.calls[0][0];
            expect(callArg.length).toBeGreaterThan(1);
        });

        it('should assign a groupId to all events when recurring', async () => {
            EventRepo.createEvent.mockResolvedValue([mockEvent, mockEvent]);
            const recurringEventData = {
                ...mockEventData,
                frequencyType: 'day',
                frequencyInterval: 1,
                frequencyEndType: 'after',
                frequencyOccurrencesLeft: 2
            };

            await EventService.createEvent(mockUserId, recurringEventData);

            const callArg = EventRepo.createEvent.mock.calls[0][0];
            const groupIds = callArg.map(e => e.groupId);
            expect(groupIds.every(id => id === groupIds[0])).toBe(true);
            expect(groupIds[0]).toBeDefined();
        });

        it('should not assign a groupId to a single non-recurring event', async () => {
            EventRepo.createEvent.mockResolvedValue([mockEvent]);
            await EventService.createEvent(mockUserId, mockEventData);

            const callArg = EventRepo.createEvent.mock.calls[0][0];
            expect(callArg[0].groupId).toBeUndefined();
        });
    });

    describe('updateEvent', () => {
        it('should update an event with valid changes', async () => {
            const updated = { ...mockEvent, title: 'Updated' };
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            EventRepo.updateEvent.mockResolvedValue(updated);

            const result = await EventService.updateEvent(mockUserId, mockEventId, { title: 'Updated' });
            expect(result.title).toBe('Updated');
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(
                EventService.updateEvent(mockUserId, mockEventId, { title: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if no valid fields provided', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            await expect(
                EventService.updateEvent(mockUserId, mockEventId, {})
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if no changes detected', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            await expect(
                EventService.updateEvent(mockUserId, mockEventId, {
                    title: mockEvent.title,
                    color: mockEvent.color
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if end is before start', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            await expect(
                EventService.updateEvent(mockUserId, mockEventId, {
                    start: '2026-05-01T12:00:00Z',
                    end: '2026-05-01T10:00:00Z'
                })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('updateforwardEvent', () => {
        it('should update forward events and return modifiedCount', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            EventRepo.updateForwardEvent.mockResolvedValue({ modifiedCount: 2 });

            const result = await EventService.updateforwardEvent(mockUserId, mockEventId, { title: 'Updated' });
            expect(result.modifiedCount).toBe(2);
        });

        it('should return modifiedCount 0 if no changes detected', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            const result = await EventService.updateforwardEvent(mockUserId, mockEventId, {
                title: mockEvent.title,
                color: mockEvent.color
            });
            expect(result.modifiedCount).toBe(0);
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(
                EventService.updateforwardEvent(mockUserId, mockEventId, { title: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if no valid fields provided', async () => {
            await expect(
                EventService.updateforwardEvent(mockUserId, mockEventId, {})
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('updateAllEventsInGroup', () => {
        it('should update all events in group and return modifiedCount', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            EventRepo.updateAllEventsInGroup.mockResolvedValue({ modifiedCount: 3 });

            const result = await EventService.updateAllEventsInGroup(mockUserId, mockEventId, { title: 'Updated' });
            expect(result.modifiedCount).toBe(3);
        });

        it('should return modifiedCount 0 if no changes detected', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            const result = await EventService.updateAllEventsInGroup(mockUserId, mockEventId, {
                title: mockEvent.title,
                color: mockEvent.color
            });
            expect(result.modifiedCount).toBe(0);
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(
                EventService.updateAllEventsInGroup(mockUserId, mockEventId, { title: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteEvent', () => {
        it('should delete an event', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            EventRepo.deleteEvent.mockResolvedValue({});

            await EventService.deleteEvent(mockUserId, mockEventId);
            expect(EventRepo.deleteEvent).toHaveBeenCalledWith(mockUserId, mockEventId);
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(EventService.deleteEvent(mockUserId, mockEventId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteForwardEvents', () => {
        it('should delete forward events and return result', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            EventRepo.deleteForwardEvents.mockResolvedValue({ deletedCount: 2 });

            const result = await EventService.deleteForwardEvents(mockUserId, mockEventId);
            expect(result.modifiedCount).toBe(2);
            expect(EventRepo.deleteForwardEvents).toHaveBeenCalledWith(
                mockUserId,
                mockEvent.groupId,
                mockEventId,
                mockEvent.start
            );
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(EventService.deleteForwardEvents(mockUserId, mockEventId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteAllEventsInGroup', () => {
        it('should delete all events in group and return result', async () => {
            EventRepo.getEventById.mockResolvedValue(mockEvent);
            EventRepo.deleteAllEventsInGroup.mockResolvedValue({ deletedCount: 3 });

            const result = await EventService.deleteAllEventsInGroup(mockUserId, mockEventId);
            expect(result.modifiedCount).toBe(3);
            expect(EventRepo.deleteAllEventsInGroup).toHaveBeenCalledWith(mockUserId, mockEvent.groupId);
        });

        it('should throw NotFoundError if event does not exist', async () => {
            EventRepo.getEventById.mockResolvedValue(null);
            await expect(EventService.deleteAllEventsInGroup(mockUserId, mockEventId)).rejects.toThrow(NotFoundError);
        });
    });

    describe('bulkImportEvents', () => {
        const parsedEvents = [
            { title: 'DLP.T.I-1 - A-S-03', start: new Date('2026-01-27T09:00:00'), end: new Date('2026-01-27T11:00:00') },
            { title: 'DLP.T.I-1 - A-S-03', start: new Date('2026-02-03T09:00:00'), end: new Date('2026-02-03T11:00:00') },
        ];

        it('should insert all parsed events with userId, calendarId and useCalendarColor', async () => {
            EventRepo.createEvent.mockResolvedValue(parsedEvents.map((e, i) => ({ ...e, _id: String(i) })));

            const result = await EventService.bulkImportEvents(mockUserId, parsedEvents, mockCalendarId, null);

            const callArg = EventRepo.createEvent.mock.calls[0][0];
            expect(callArg).toHaveLength(2);
            expect(callArg[0]).toMatchObject({
                userId: mockUserId,
                calendarId: mockCalendarId,
                useCalendarColor: true,
                title: parsedEvents[0].title,
            });
            expect(result).toHaveLength(2);
        });

        it('should include label on each doc when provided', async () => {
            EventRepo.createEvent.mockResolvedValue([]);

            await EventService.bulkImportEvents(mockUserId, parsedEvents, mockCalendarId, 'DLP');

            const callArg = EventRepo.createEvent.mock.calls[0][0];
            expect(callArg.every(doc => doc.label === 'DLP')).toBe(true);
        });

        it('should not include label field when label is null', async () => {
            EventRepo.createEvent.mockResolvedValue([]);

            await EventService.bulkImportEvents(mockUserId, parsedEvents, mockCalendarId, null);

            const callArg = EventRepo.createEvent.mock.calls[0][0];
            expect(callArg[0].label).toBeUndefined();
        });

        it('should return an empty array when given no events', async () => {
            EventRepo.createEvent.mockResolvedValue([]);

            const result = await EventService.bulkImportEvents(mockUserId, [], mockCalendarId, null);
            expect(result).toEqual([]);
        });
    });

    describe('deleteEventsByLabel', () => {
        it('should delete events by label and return modifiedCount', async () => {
            EventRepo.deleteEventsByLabel.mockResolvedValue({ deletedCount: 2 });

            const result = await EventService.deleteEventsByLabel(mockUserId, 'examen');

            expect(result.modifiedCount).toBe(2);
            expect(EventRepo.deleteEventsByLabel).toHaveBeenCalledWith(mockUserId, 'examen');
        });

        it('should throw ValidationError if label is empty', async () => {
            await expect(
                EventService.deleteEventsByLabel(mockUserId, '')
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if label is not a string', async () => {
            await expect(
                EventService.deleteEventsByLabel(mockUserId, null)
            ).rejects.toThrow(ValidationError);
        });
    });
});