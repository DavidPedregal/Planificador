const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SettingsRepo = require('../../repository/settingsRepository');

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

const mockUserId = 'user123';

describe('settingsRepository', () => {
    describe('createSettings', () => {
        it('should create settings with defaults for a user', async () => {
            const settings = await SettingsRepo.createSettings({ userId: mockUserId });

            expect(settings._id).toBeDefined();
            expect(settings.userId).toBe(mockUserId);
            expect(settings.theme).toBe('dark');
            expect(settings.startHour).toBe(8);
            expect(settings.endHour).toBe(20);
            expect(settings.defaultCalendarView).toBe('timeGridWeek');
        });

        it('should fail if userId is missing', async () => {
            await expect(SettingsRepo.createSettings({})).rejects.toThrow();
        });

        it('should create settings with custom values', async () => {
            const settings = await SettingsRepo.createSettings({
                userId: mockUserId,
                theme: 'light',
                startHour: 6,
                endHour: 22
            });

            expect(settings.theme).toBe('light');
            expect(settings.startHour).toBe(6);
            expect(settings.endHour).toBe(22);
        });
    });

    describe('findSettingsForUser', () => {
        it('should return settings for an existing user', async () => {
            await SettingsRepo.createSettings({ userId: mockUserId });
            const found = await SettingsRepo.findSettingsForUser(mockUserId);

            expect(found).not.toBeNull();
            expect(found.userId).toBe(mockUserId);
        });

        it('should return null if user has no settings', async () => {
            const found = await SettingsRepo.findSettingsForUser('nonexistent');
            expect(found).toBeNull();
        });

        it('should not return settings belonging to another user', async () => {
            await SettingsRepo.createSettings({ userId: 'otherUser' });
            const found = await SettingsRepo.findSettingsForUser(mockUserId);
            expect(found).toBeNull();
        });
    });

    describe('updateSettings', () => {
        it('should update settings fields', async () => {
            await SettingsRepo.createSettings({ userId: mockUserId });
            const updated = await SettingsRepo.updateSettings(mockUserId, { theme: 'light', startHour: 7 });

            expect(updated.theme).toBe('light');
            expect(updated.startHour).toBe(7);
        });

        it('should return null if user has no settings', async () => {
            const result = await SettingsRepo.updateSettings('nonexistent', { theme: 'light' });
            expect(result).toBeNull();
        });

        it('should not update settings of another user', async () => {
            await SettingsRepo.createSettings({ userId: mockUserId });
            const result = await SettingsRepo.updateSettings('otherUser', { theme: 'light' });
            expect(result).toBeNull();
        });
    });

    describe('deleteSettings', () => {
        it('should delete settings for a user', async () => {
            await SettingsRepo.createSettings({ userId: mockUserId });
            await SettingsRepo.deleteSettings(mockUserId);

            const found = await SettingsRepo.findSettingsForUser(mockUserId);
            expect(found).toBeNull();
        });

        it('should not throw if settings do not exist', async () => {
            await expect(SettingsRepo.deleteSettings('nonexistent')).resolves.not.toThrow();
        });
    });
});