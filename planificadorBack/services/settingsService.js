const settingsRepo = require("../repository/settingsRepository.js");
const { ValidationError, NotFoundError } = require('../errors/AppError');

const getSettingsForUser = async (userId) => {
    let settings = await settingsRepo.findSettingsForUser(userId);
    if (!settings) {
        settings = await settingsRepo.createSettings({ userId });
    }
    return settings;
};

const updateSettings = async (userId, updateData) => {
    const allowedFields = ['systemColor', 'theme', 'defaultCalendarView', 'startHour', 'endHour', 'slotDuration', 'maxTime'];
    const updateFields = Object.keys(updateData);
    const isValidUpdate = updateFields.every(field => allowedFields.includes(field));

    if (!isValidUpdate) {
        throw new ValidationError('Invalid update fields');
    }

    if (updateData.startHour !== undefined && (updateData.startHour < 0 || updateData.startHour > 24)) {
        throw new ValidationError('startHour must be between 0 and 24');
    }

    if (updateData.endHour !== undefined && (updateData.endHour < 0 || updateData.endHour > 24)) {
        throw new ValidationError('endHour must be between 0 and 24');
    }

    if (updateData.startHour !== undefined && updateData.endHour !== undefined && updateData.startHour >= updateData.endHour) {
        throw new ValidationError('startHour must be less than endHour');
    }

    const validSlotDurations = ['00:15:00', '00:30:00', '01:00:00'];
    if (updateData.slotDuration !== undefined && !validSlotDurations.includes(updateData.slotDuration)) {
        throw new ValidationError('slotDuration must be one of 00:15:00, 00:30:00, 01:00:00');
    }

    if (updateData.maxTime !== undefined && (updateData.maxTime <= 0 || !Number.isInteger(updateData.maxTime))) {
        throw new ValidationError('maxTime must be a positive integer');
    }

    return settingsRepo.updateSettings(userId, updateData);
};

const deleteSettings = async (userId) => {
    return settingsRepo.deleteSettings(userId);
};

const getMaxTimeForPlanning = async (userId) => {
    const settings = await getSettingsForUser(userId);
    return settings.maxTime || 10;
};

module.exports = {
    getSettingsForUser,
    updateSettings,
    deleteSettings,
    getMaxTimeForPlanning
};