import * as CalendarRepo from '../repository/calendarRepository';
import * as EventRepo from '../repository/eventRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';

export const getCustomCalendarsForUser = async (userId) => {
    const customCalendars = await CalendarRepo.findCustomCalendarsForUser(userId);
    return customCalendars;
};

export const getSystemCalendarsForUser = async (userId) => {
    const systemCalendars = await CalendarRepo.findSystemCalendarsForUser(userId);
    return systemCalendars;
}

export const createCalendarForUser = async (userId, calendarData) => {
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
    const newCalendar = CalendarRepo.createCalendar(filteredData);
    return newCalendar;
};

export const deleteCalendarForUser = async (userId, calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new ValidationError("Invalid calendar ID");
    }

    const calendar = await CalendarRepo.findCalendarForUser(userId, calendarId);
    if (!calendar) {
        throw new NotFoundError("Calendar not found");
    }

    if (calendar.isSystem) {
        throw new ValidationError("Cannot delete a default calendar");
    }

    await CalendarRepo.deleteCalendar(calendar._id);
    await EventRepo.deleteEventsByCalendarId(calendar._id);
};

export const updateCalendarForUser = async (userId, calendarId, updateData) => {
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
    const updatedCalendar = await CalendarRepo.updateCalendar(calendarId, filteredData);
    return updatedCalendar;
};

export const toggleCalendarVisibilityForUser = async (userId, calendarId) => {
    const calendar = await CalendarRepo.findCalendarForUser(userId, calendarId);
    if (!calendar) {
        throw new NotFoundError("Calendar not found");
    }

    const updatedCalendar = await CalendarRepo.updateCalendar(calendarId, { visible: !calendar.visible });
    return updatedCalendar;
}