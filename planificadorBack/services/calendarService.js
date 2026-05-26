const CalendarRepo = require('../repository/calendarRepository');
const EventRepo = require('../repository/eventRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const getCustomCalendarsForUser = async (userId) => {
    const customCalendars = await CalendarRepo.findCustomCalendarsForUser(userId);
    return customCalendars;
};

const getSystemCalendarsForUser = async (userId) => {
    const systemCalendars = await CalendarRepo.findSystemCalendarsForUser(userId);
    return systemCalendars;
}

const createCalendarForUser = async (userId, calendarData) => {
    if (!calendarData.name || calendarData.name.length === 0 || !calendarData.color) {
        throw new ValidationError("Name and color are required");
    }
    if (calendarData.name.length > 100) {
        throw new ValidationError('Name cannot exceed 100 characters');
    }

    const filteredData = {
        name: calendarData.name,
        color: calendarData.color,
        isSystem: false,
        userId
    }
    const newCalendar = await CalendarRepo.createCalendar(filteredData);
    return newCalendar;
};

const deleteCalendarForUser = async (userId, calendarId) => {
    const calendar = await CalendarRepo.findCalendarForUser(userId, calendarId);
    if (!calendar) {
        throw new NotFoundError("Calendar not found");
    }

    if (calendar.isSystem) {
        throw new ValidationError("Cannot delete a default calendar");
    }

    await CalendarRepo.deleteCalendar(userId, calendarId);
    await EventRepo.deleteEventsByCalendarId(calendar._id);
};

const updateCalendarForUser = async (userId, calendarId, updateData) => {
    const existingCalendar = await CalendarRepo.findCalendarForUser(userId, calendarId);
    if (!existingCalendar) {
        throw new NotFoundError("Calendar not found");
    }

    if (!updateData.name || updateData.name.length === 0 || !updateData.color) {
        throw new ValidationError("Name and color are required");
    }
    if (updateData.name.length > 100) {
        throw new ValidationError('Name cannot exceed 100 characters');
    }

    const filteredData = {
        name: updateData.name,
        color: updateData.color,
        isSystem: false,
        userId
    }
    const updatedCalendar = await CalendarRepo.updateCalendar(userId, calendarId, filteredData);
    return updatedCalendar;
};

const toggleCalendarVisibilityForUser = async (userId, calendarId) => {
    const calendar = await CalendarRepo.findCalendarForUser(userId, calendarId);
    if (!calendar) {
        throw new NotFoundError("Calendar not found");
    }

    const updatedCalendar = await CalendarRepo.updateCalendar(userId, calendarId, { visible: !calendar.visible });
    return updatedCalendar;
}

module.exports = {
    getCustomCalendarsForUser,
    getSystemCalendarsForUser,
    createCalendarForUser,
    deleteCalendarForUser,
    updateCalendarForUser,
    toggleCalendarVisibilityForUser
};