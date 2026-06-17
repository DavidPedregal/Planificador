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
    const updateFields = Object.keys(updateData || {});
    const isValidUpdate = updateFields.every(field => allowedFields.includes(field));

    if (!isValidUpdate) {
        throw new ValidationError('Invalid update fields');
    }

    const safeUpdateData = {};

    if (updateData.systemColor !== undefined) {
        if (typeof updateData.systemColor !== 'string') {
            throw new ValidationError('systemColor must be a string');
        }
        safeUpdateData.systemColor = updateData.systemColor;
    }

    if (updateData.theme !== undefined) {
        if (typeof updateData.theme !== 'string') {
            throw new ValidationError('theme must be a string');
        }
        safeUpdateData.theme = updateData.theme;
    }

    if (updateData.defaultCalendarView !== undefined) {
        if (typeof updateData.defaultCalendarView !== 'string') {
            throw new ValidationError('defaultCalendarView must be a string');
        }
        safeUpdateData.defaultCalendarView = updateData.defaultCalendarView;
    }

    if (updateData.startHour !== undefined) {
        if (!Number.isInteger(updateData.startHour)) {
            throw new ValidationError('startHour must be an integer');
        }
        safeUpdateData.startHour = updateData.startHour;
    }

    if (updateData.endHour !== undefined) {
        if (!Number.isInteger(updateData.endHour)) {
            throw new ValidationError('endHour must be an integer');
        }
        safeUpdateData.endHour = updateData.endHour;
    }

    if (updateData.slotDuration !== undefined) {
        if (typeof updateData.slotDuration !== 'string') {
            throw new ValidationError('slotDuration must be a string');
        }
        safeUpdateData.slotDuration = updateData.slotDuration;
    }

    if (updateData.maxTime !== undefined) {
        if (!Number.isInteger(updateData.maxTime)) {
            throw new ValidationError('maxTime must be an integer');
        }
        safeUpdateData.maxTime = updateData.maxTime;
    }

    if (safeUpdateData.startHour !== undefined && (safeUpdateData.startHour < 0 || safeUpdateData.startHour > 24)) {
        throw new ValidationError('startHour must be between 0 and 24');
    }

    if (safeUpdateData.endHour !== undefined && (safeUpdateData.endHour < 0 || safeUpdateData.endHour > 24)) {
        throw new ValidationError('endHour must be between 0 and 24');
    }

    if (safeUpdateData.startHour !== undefined && safeUpdateData.endHour !== undefined && safeUpdateData.startHour >= safeUpdateData.endHour) {
        throw new ValidationError('startHour must be less than endHour');
    }

    const validSlotDurations = ['00:15:00', '00:30:00', '01:00:00'];
    if (safeUpdateData.slotDuration !== undefined && !validSlotDurations.includes(safeUpdateData.slotDuration)) {
        throw new ValidationError('slotDuration must be one of 00:15:00, 00:30:00, 01:00:00');
    }

    if (safeUpdateData.maxTime !== undefined && (safeUpdateData.maxTime <= 0 || !Number.isInteger(safeUpdateData.maxTime) || safeUpdateData.maxTime > 270)) {
        throw new ValidationError('maxTime must be a positive integer no greater than 270');

    }

    return settingsRepo.updateSettings(userId, safeUpdateData);
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