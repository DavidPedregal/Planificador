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
    endHour: 20
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
                endHour: 19
            };
            SettingsRepo.updateSettings.mockResolvedValue({ ...mockSettings, ...updateData });

            await expect(
                SettingsService.updateSettings(mockUserId, updateData)
            ).resolves.not.toThrow();

            expect(SettingsRepo.updateSettings).toHaveBeenCalledWith(mockUserId, updateData);
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