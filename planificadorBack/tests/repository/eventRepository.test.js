// tests/repository/eventRepository.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const EventRepo = require('../../repository/eventRepository');
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
const mockCalendarId = new mongoose.Types.ObjectId();
const invalidId = 'invalid_id';

const mockEventData = {
    userId: mockUserId,
    title: 'Test Event',
    calendarId: mockCalendarId.toString(),
    start: new Date('2030-01-01T10:00:00Z'),
    end: new Date('2030-01-01T11:00:00Z'),
    useCalendarColor: true,
    color: '#ff0000',
};

describe('eventRepository', () => {
    describe('createEvent', () => {
        it('should create a single event', async () => {
            const events = await EventRepo.createEvent([mockEventData]);
            expect(events).toHaveLength(1);
            expect(events[0].title).toBe(mockEventData.title);
            expect(events[0].userId.toString()).toBe(mockUserId.toString());
        });

        it('should create multiple events', async () => {
            const secondEvent = { ...mockEventData, start: new Date('2026-05-02T10:00:00Z'), end: new Date('2026-05-02T11:00:00Z') };
            const events = await EventRepo.createEvent([mockEventData, secondEvent]);
            expect(events).toHaveLength(2);
        });

        it('should fail if title is missing', async () => {
            const { title, ...withoutTitle } = mockEventData;
            await expect(EventRepo.createEvent([withoutTitle])).rejects.toThrow();
        });

        it('should fail if start is missing', async () => {
            const { start, ...withoutStart } = mockEventData;
            await expect(EventRepo.createEvent([withoutStart])).rejects.toThrow();
        });

        it('should fail if end is missing', async () => {
            const { end, ...withoutEnd } = mockEventData;
            await expect(EventRepo.createEvent([withoutEnd])).rejects.toThrow();
        });

        it('should fail if calendarId is missing', async () => {
            const { calendarId, ...withoutCalendarId } = mockEventData;
            await expect(EventRepo.createEvent([withoutCalendarId])).rejects.toThrow();
        });
    });

    describe('getEventsByUserId', () => {
        it('should return all events for a user', async () => {
            await EventRepo.createEvent([mockEventData]);
            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(1);
        });

        it('should not return events from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await EventRepo.createEvent([{ ...mockEventData, userId: otherUserId }]);
            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(0);
        });

        it('should return empty array if user has no events', async () => {
            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(0);
        });

        it('should throw RepositoryError if userId format is invalid', async () => {
            await expect(EventRepo.getEventsByUserId(invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('getEventById', () => {
        it('should return an event by id', async () => {
            const [created] = await EventRepo.createEvent([mockEventData]);
            const found = await EventRepo.getEventById(mockUserId, created._id.toString());
            expect(found).not.toBeNull();
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should return null if event belongs to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await EventRepo.createEvent([{ ...mockEventData, userId: otherUserId }]);
            const found = await EventRepo.getEventById(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should throw RepositoryError if eventId format is invalid', async () => {
            await expect(EventRepo.getEventById(mockUserId, invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('getPlannableEventsForUser', () => {
        it('should return events for a specific calendar', async () => {
            await EventRepo.createEvent([mockEventData]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(1);
        });

        it('should not return events from other calendars', async () => {
            const otherCalendarId = new mongoose.Types.ObjectId();
            await EventRepo.createEvent([{ ...mockEventData, calendarId: otherCalendarId.toString() }]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(0);
        });

        it('should not return events from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await EventRepo.createEvent([{ ...mockEventData, userId: otherUserId }]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(0);
        });

        it('should not return events whose start date is in the past', async () => {
            const pastEvent = {
                ...mockEventData,
                start: new Date('2020-01-01T10:00:00Z'),
                end: new Date('2020-01-01T11:00:00Z'),
            };
            await EventRepo.createEvent([pastEvent]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(0);
        });

        it('should return empty array if all plannable events are in the past', async () => {
            const past1 = { ...mockEventData, start: new Date('2020-03-01T09:00:00Z'), end: new Date('2020-03-01T10:00:00Z') };
            const past2 = { ...mockEventData, start: new Date('2021-06-15T14:00:00Z'), end: new Date('2021-06-15T15:00:00Z') };
            await EventRepo.createEvent([past1, past2]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(0);
        });

        it('should return an event whose start is at midnight today', async () => {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date(startOfToday.getTime() + 60 * 60 * 1000);
            await EventRepo.createEvent([{ ...mockEventData, start: startOfToday, end: endOfToday }]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(1);
        });

        it('should return only future events when both past and future events exist', async () => {
            const pastEvent   = { ...mockEventData, start: new Date('2020-01-01T10:00:00Z'), end: new Date('2020-01-01T11:00:00Z') };
            const futureEvent = { ...mockEventData, start: new Date('2030-06-01T10:00:00Z'), end: new Date('2030-06-01T11:00:00Z') };
            await EventRepo.createEvent([pastEvent, futureEvent]);
            const events = await EventRepo.getPlannableEventsForUser(mockUserId, mockCalendarId);
            expect(events).toHaveLength(1);
            expect(events[0].start.toISOString()).toBe(futureEvent.start.toISOString());
        });
    });

    describe('updateEvent', () => {
        it('should update an event', async () => {
            const [created] = await EventRepo.createEvent([mockEventData]);
            const updated = await EventRepo.updateEvent(mockUserId, created._id.toString(), { title: 'Updated' });
            expect(updated.title).toBe('Updated');
        });

        it('should return null if event does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const updated = await EventRepo.updateEvent(mockUserId, fakeId, { title: 'Updated' });
            expect(updated).toBeNull();
        });

        it('should not update an event belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await EventRepo.createEvent([{ ...mockEventData, userId: otherUserId }]);
            const updated = await EventRepo.updateEvent(mockUserId, created._id.toString(), { title: 'Hacked' });
            expect(updated).toBeNull();
        });

        it('should throw RepositoryError if eventId format is invalid', async () => {
            await expect(EventRepo.updateEvent(mockUserId, invalidId, { title: 'X' })).rejects.toThrow(RepositoryError);
        });
    });

    describe('deleteEvent', () => {
        it('should delete an event', async () => {
            const [created] = await EventRepo.createEvent([mockEventData]);
            await EventRepo.deleteEvent(mockUserId, created._id.toString());
            const found = await EventRepo.getEventById(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should not delete an event belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const [created] = await EventRepo.createEvent([{ ...mockEventData, userId: otherUserId }]);
            await EventRepo.deleteEvent(mockUserId, created._id.toString());
            const found = await EventRepo.getEventById(otherUserId, created._id.toString());
            expect(found).not.toBeNull();
        });

        it('should throw RepositoryError if eventId format is invalid', async () => {
            await expect(EventRepo.deleteEvent(mockUserId, invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('deleteEventsByCalendarId', () => {
        it('should delete all events for a calendar', async () => {
            await EventRepo.createEvent([mockEventData, mockEventData]);
            await EventRepo.deleteEventsByCalendarId(mockCalendarId);
            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(0);
        });

        it('should throw RepositoryError if calendarId format is invalid', async () => {
            await expect(EventRepo.deleteEventsByCalendarId(invalidId)).rejects.toThrow(RepositoryError);
        });
    });

    describe('updateForwardEvent', () => {
        it('should update all events from a group from a date onwards', async () => {
            const groupId = 'group-1';
            const event1 = { ...mockEventData, groupId, start: new Date('2026-05-01T10:00:00Z'), end: new Date('2026-05-01T11:00:00Z') };
            const event2 = { ...mockEventData, groupId, start: new Date('2026-05-02T10:00:00Z'), end: new Date('2026-05-02T11:00:00Z') };
            const event3 = { ...mockEventData, groupId, start: new Date('2026-05-03T10:00:00Z'), end: new Date('2026-05-03T11:00:00Z') };
            const [e1, e2, e3] = await EventRepo.createEvent([event1, event2, event3]);

            await EventRepo.updateForwardEvent(mockUserId, e2._id.toString(), groupId, { title: 'Updated' }, event2.start);

            const events = await EventRepo.getEventsByUserId(mockUserId);
            const updated = events.filter(e => e.title === 'Updated');
            const untouched = events.filter(e => e.title === mockEventData.title);
            expect(updated).toHaveLength(2);
            expect(untouched).toHaveLength(1);
        });

        it('should update only the single event if groupId is null', async () => {
            const [created] = await EventRepo.createEvent([mockEventData]);
            await EventRepo.updateForwardEvent(mockUserId, created._id.toString(), null, { title: 'Updated' }, mockEventData.start);

            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events[0].title).toBe('Updated');
        });
    });

    describe('updateAllEventsInGroup', () => {
        it('should update all events in a group', async () => {
            const groupId = 'group-1';
            await EventRepo.createEvent([
                { ...mockEventData, groupId },
                { ...mockEventData, groupId },
                { ...mockEventData, groupId }
            ]);

            const [first] = await EventRepo.getEventsByUserId(mockUserId);
            await EventRepo.updateAllEventsInGroup(mockUserId, first._id.toString(), groupId, { title: 'Updated' });

            const events = await EventRepo.getEventsByUserId(mockUserId);
            events.forEach(e => expect(e.title).toBe('Updated'));
        });

        it('should update only the single event if groupId is null', async () => {
            const [created] = await EventRepo.createEvent([mockEventData]);
            await EventRepo.updateAllEventsInGroup(mockUserId, created._id.toString(), null, { title: 'Updated' });

            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events[0].title).toBe('Updated');
        });
    });

    describe('deleteForwardEvents', () => {
        it('should delete all events from a group from a date onwards', async () => {
            const groupId = 'group-1';
            const event1 = { ...mockEventData, groupId, start: new Date('2026-05-01T10:00:00Z'), end: new Date('2026-05-01T11:00:00Z') };
            const event2 = { ...mockEventData, groupId, start: new Date('2026-05-02T10:00:00Z'), end: new Date('2026-05-02T11:00:00Z') };
            const event3 = { ...mockEventData, groupId, start: new Date('2026-05-03T10:00:00Z'), end: new Date('2026-05-03T11:00:00Z') };
            const [e1, e2] = await EventRepo.createEvent([event1, event2, event3]);

            await EventRepo.deleteForwardEvents(mockUserId, groupId, e2._id.toString(), event2.start);

            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(1);
            expect(events[0].start.toISOString()).toBe(event1.start.toISOString());
        });

        it('should delete only the single event if groupId is null', async () => {
            const [e1, e2] = await EventRepo.createEvent([mockEventData, mockEventData]);
            await EventRepo.deleteForwardEvents(mockUserId, null, e1._id.toString(), mockEventData.start);

            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(1);
        });
    });

    describe('deleteAllEventsInGroup', () => {
        it('should delete all events in a group', async () => {
            const groupId = 'group-1';
            await EventRepo.createEvent([
                { ...mockEventData, groupId },
                { ...mockEventData, groupId },
                { ...mockEventData }
            ]);

            await EventRepo.deleteAllEventsInGroup(mockUserId, groupId);

            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(1);
            expect(events[0].groupId).toBeUndefined();
        });
    });

    describe('deleteEventsByLabel', () => {
        it('should delete all events with a given label', async () => {
            await EventRepo.createEvent([
                { ...mockEventData, label: 'examen' },
                { ...mockEventData, label: 'examen' },
                { ...mockEventData, label: 'tarea' }
            ]);

            await EventRepo.deleteEventsByLabel(mockUserId, 'examen');

            const events = await EventRepo.getEventsByUserId(mockUserId);
            expect(events).toHaveLength(1);
            expect(events[0].label).toBe('tarea');
        });

        it('should not delete events from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await EventRepo.createEvent([{ ...mockEventData, userId: otherUserId, label: 'examen' }]);

            await EventRepo.deleteEventsByLabel(mockUserId, 'examen');

            const events = await EventRepo.getEventsByUserId(otherUserId);
            expect(events).toHaveLength(1);
        });

        it('should return deletedCount 0 if no events match', async () => {
            const result = await EventRepo.deleteEventsByLabel(mockUserId, 'noexiste');
            expect(result.deletedCount).toBe(0);
        });
    });
});