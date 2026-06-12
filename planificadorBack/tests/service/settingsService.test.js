const SettingsRepo = require('../../repository/settingsRepository');
const SettingsService = require('../../services/settingsService');
const { ValidationError } = require('../../errors/AppError');

jest.mock('../../repository/settingsRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = 'user123';

const mockSettings = {
    _id: '507f1f77bcf86cd799439011',
    userId: mockUserId,
    systemColor: '#7c6ff740',
    theme: 'dark',
    defaultCalendarView: 'timeGridWeek',
    startHour: 8,
    endHour: 20,
    slotDuration: '00:30:00',
    maxTime: 10
};

describe('settingsService', () => {
    describe('getSettingsForUser', () => {
        it('should return existing settings', async () => {
            SettingsRepo.findSettingsForUser.mockResolvedValue(mockSettings);

            const result = await SettingsService.getSettingsForUser(mockUserId);

            expect(result).toEqual(mockSettings);
            expect(SettingsRepo.findSettingsForUser).toHaveBeenCalledWith(mockUserId);
            expect(SettingsRepo.createSettings).not.toHaveBeenCalled();
        });

        it('should create and return settings if none exist', async () => {
            SettingsRepo.findSettingsForUser.mockResolvedValue(null);
            SettingsRepo.createSettings.mockResolvedValue(mockSettings);

            const result = await SettingsService.getSettingsForUser(mockUserId);

            expect(SettingsRepo.createSettings).toHaveBeenCalledWith({ userId: mockUserId });
            expect(result).toEqual(mockSettings);
        });
    });

    describe('updateSettings', () => {
        it('should update with valid fields', async () => {
            const updated = { ...mockSettings, theme: 'light' };
            SettingsRepo.updateSettings.mockResolvedValue(updated);

            const result = await SettingsService.updateSettings(mockUserId, { theme: 'light' });

            expect(result).toEqual(updated);
            expect(SettingsRepo.updateSettings).toHaveBeenCalledWith(mockUserId, { theme: 'light' });
        });

        it('should throw ValidationError for unknown fields', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { unknownField: 'value' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if startHour is below 0', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { startHour: -1 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if startHour is above 24', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { startHour: 25 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if endHour is below 0', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { endHour: -1 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if endHour is above 24', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { endHour: 25 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if startHour equals endHour', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { startHour: 10, endHour: 10 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if startHour is greater than endHour', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { startHour: 15, endHour: 10 })
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid startHour and endHour', async () => {
            SettingsRepo.updateSettings.mockResolvedValue({ ...mockSettings, startHour: 6, endHour: 22 });

            await expect(
                SettingsService.updateSettings(mockUserId, { startHour: 6, endHour: 22 })
            ).resolves.not.toThrow();
        });

        it('should accept all allowed fields', async () => {
            const updateData = {
                systemColor: '#aabbcc',
                theme: 'light',
                defaultCalendarView: 'dayGridMonth',
                startHour: 7,
                endHour: 19,
                slotDuration: '00:15:00',
                maxTime: 30
            };
            SettingsRepo.updateSettings.mockResolvedValue({ ...mockSettings, ...updateData });

            await expect(
                SettingsService.updateSettings(mockUserId, updateData)
            ).resolves.not.toThrow();

            expect(SettingsRepo.updateSettings).toHaveBeenCalledWith(mockUserId, updateData);
        });

        it('should accept a valid maxTime (positive integer)', async () => {
            SettingsRepo.updateSettings.mockResolvedValue({ ...mockSettings, maxTime: 30 });
            await expect(
                SettingsService.updateSettings(mockUserId, { maxTime: 30 })
            ).resolves.not.toThrow();
        });

        it('should throw ValidationError if maxTime is zero', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { maxTime: 0 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if maxTime is negative', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { maxTime: -5 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if maxTime is not an integer', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { maxTime: 5.5 })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid slotDuration', async () => {
            await expect(
                SettingsService.updateSettings(mockUserId, { slotDuration: '00:20:00' })
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid slotDuration values', async () => {
            for (const value of ['00:15:00', '00:30:00', '01:00:00']) {
                SettingsRepo.updateSettings.mockResolvedValue({ ...mockSettings, slotDuration: value });
                await expect(
                    SettingsService.updateSettings(mockUserId, { slotDuration: value })
                ).resolves.not.toThrow();
            }
        });
    });

    describe('getMaxTimeForPlanning', () => {
        it('should return maxTime from settings when set', async () => {
            SettingsRepo.findSettingsForUser.mockResolvedValue({ ...mockSettings, maxTime: 30 });
            const result = await SettingsService.getMaxTimeForPlanning(mockUserId);
            expect(result).toBe(30);
        });

        it('should return 10 as default when maxTime is not set', async () => {
            SettingsRepo.findSettingsForUser.mockResolvedValue({ ...mockSettings, maxTime: null });
            const result = await SettingsService.getMaxTimeForPlanning(mockUserId);
            expect(result).toBe(10);
        });

        it('should create settings and return 10 if user has no settings yet', async () => {
            SettingsRepo.findSettingsForUser.mockResolvedValue(null);
            SettingsRepo.createSettings.mockResolvedValue({ ...mockSettings, maxTime: null });
            const result = await SettingsService.getMaxTimeForPlanning(mockUserId);
            expect(result).toBe(10);
        });
    });

    describe('deleteSettings', () => {
        it('should call repo deleteSettings', async () => {
            SettingsRepo.deleteSettings.mockResolvedValue({ deletedCount: 1 });

            await SettingsService.deleteSettings(mockUserId);

            expect(SettingsRepo.deleteSettings).toHaveBeenCalledWith(mockUserId);
        });
    });
});