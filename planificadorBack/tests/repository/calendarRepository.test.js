const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const CalendarRepo = require('../../repository/calendarRepository');
const { AppError, RepositoryError } = require('../../errors/AppError');

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
const otherUserId = new mongoose.Types.ObjectId();

const mockCalendar = {
    userId: mockUserId,
    name: 'Test Calendar',
    color: '#ff0000',
};

describe('calendarRepository', () => {
    describe('createCalendar', () => {
        it('should create a calendar with all fields', async () => {
            const calendar = await CalendarRepo.createCalendar(mockCalendar);

            expect(calendar._id).toBeDefined();
            expect(calendar.userId.toString()).toBe(mockUserId.toString());
            expect(calendar.name).toBe(mockCalendar.name);
            expect(calendar.color).toBe(mockCalendar.color);
            expect(calendar.visible).toBe(true);
            expect(calendar.isSystem).toBe(false);
        });

        it('should fail if userId is missing', async () => {
            const { userId, ...withoutUserId } = mockCalendar;
            await expect(CalendarRepo.createCalendar(withoutUserId)).rejects.toThrow();
        });

        it('should fail if name is missing', async () => {
            const { name, ...withoutName } = mockCalendar;
            await expect(CalendarRepo.createCalendar(withoutName)).rejects.toThrow();
        });

        it('should fail if color is missing', async () => {
            const { color, ...withoutColor } = mockCalendar;
            await expect(CalendarRepo.createCalendar(withoutColor)).rejects.toThrow();
        });

        it('should create a system calendar when isSystem is true', async () => {
            const calendar = await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: true });
            expect(calendar.isSystem).toBe(true);
        });
    });

    describe('findCalendarForUser', () => {
        it('should find a calendar by userId and calendarId', async () => {
            const created = await CalendarRepo.createCalendar(mockCalendar);
            const found = await CalendarRepo.findCalendarForUser(mockUserId, created._id.toString());

            expect(found).not.toBeNull();
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should return null if calendar belongs to another user', async () => {
            const created = await CalendarRepo.createCalendar(mockCalendar);
            const found = await CalendarRepo.findCalendarForUser(otherUserId, created._id.toString());

            expect(found).toBeNull();
        });

        it('should throw RepositoryError if calendarId format is invalid', async () => {
            await expect(
                CalendarRepo.findCalendarForUser(mockUserId, 'invalid_id')
            ).rejects.toMatchObject({
                code: 'REPOSITORY_ERROR',
                message: 'Invalid ID format'
            });
        });
    });

    describe('findCustomCalendarsForUser', () => {
        it('should return only non-system calendars for the user', async () => {
            await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: false });
            await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: false });
            await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: true });

            const calendars = await CalendarRepo.findCustomCalendarsForUser(mockUserId);

            expect(calendars).toHaveLength(2);
            calendars.forEach(c => expect(c.isSystem).toBe(false));
        });

        it('should return empty array if user has no custom calendars', async () => {
            const calendars = await CalendarRepo.findCustomCalendarsForUser(mockUserId);
            expect(calendars).toHaveLength(0);
        });

        it('should not return calendars from other users', async () => {
            await CalendarRepo.createCalendar({ ...mockCalendar, userId: otherUserId });
            const calendars = await CalendarRepo.findCustomCalendarsForUser(mockUserId);
            expect(calendars).toHaveLength(0);
        });
    });

    describe('findSystemCalendarsForUser', () => {
        it('should return only system calendars for the user', async () => {
            await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: true });
            await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: true });
            await CalendarRepo.createCalendar({ ...mockCalendar, isSystem: false });

            const calendars = await CalendarRepo.findSystemCalendarsForUser(mockUserId);

            expect(calendars).toHaveLength(2);
            calendars.forEach(c => expect(c.isSystem).toBe(true));
        });

        it('should return empty array if user has no system calendars', async () => {
            const calendars = await CalendarRepo.findSystemCalendarsForUser(mockUserId);
            expect(calendars).toHaveLength(0);
        });
    });

    describe('deleteCalendar', () => {
        it('should delete an existing calendar', async () => {
            const created = await CalendarRepo.createCalendar(mockCalendar);
            await CalendarRepo.deleteCalendar(mockUserId, created._id.toString());

            const found = await CalendarRepo.findCalendarForUser(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should not delete a calendar belonging to another user', async () => {
            const created = await CalendarRepo.createCalendar(mockCalendar);
            await CalendarRepo.deleteCalendar(otherUserId, created._id.toString());

            const found = await CalendarRepo.findCalendarForUser(mockUserId, created._id.toString());
            expect(found).not.toBeNull();
        });

        it('should throw RepositoryError if calendarId format is invalid', async () => {
            await expect(
                CalendarRepo.deleteCalendar(mockUserId, 'invalid_id')
            ).rejects.toThrow('Invalid ID format');
        });
    });

    describe('updateCalendar', () => {
        it('should update the name and color of a calendar', async () => {
            const created = await CalendarRepo.createCalendar(mockCalendar);
            const updated = await CalendarRepo.updateCalendar(
                mockUserId,
                created._id.toString(),
                { name: 'Updated', color: '#00ff00' }
            );

            expect(updated.name).toBe('Updated');
            expect(updated.color).toBe('#00ff00');
        });

        it('should return null if calendar does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const updated = await CalendarRepo.updateCalendar(mockUserId, fakeId, { name: 'X' });
            expect(updated).toBeNull();
        });

        it('should throw RepositoryError if calendarId format is invalid', async () => {
            await expect(
                CalendarRepo.updateCalendar(mockUserId, 'invalid_id', { name: 'X' })
            ).rejects.toThrow(RepositoryError);
        });

        it('should not update a calendar belonging to another user', async () => {
            const created = await CalendarRepo.createCalendar(mockCalendar);
            const updated = await CalendarRepo.updateCalendar(
                otherUserId,
                created._id.toString(),
                { name: 'Hacked' }
            );

            expect(updated).toBeNull();
        });
    });
});