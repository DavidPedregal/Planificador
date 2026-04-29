const CalendarEvent = require("./models/CalendarEventModel");
const mongoose = require("mongoose");
import { RepositoryError } from '../errors/AppError';

export const deleteEventsByCalendarId = async (calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return CalendarEvent.deleteMany({ calendarId });
};

export const getEventsByUserId = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return CalendarEvent.find({ userId });
};

export const getEventById = async (userId, eventId) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return CalendarEvent.findOne({ _id: eventId, userId });
};

export const createEvent = async (events) => 
    CalendarEvent.insertMany(events);

export const updateEvent = async (userId, eventId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return await CalendarEvent.findOneAndUpdate(
        { _id: eventId, userId },
        { $set: updateData },
        { new: true }
    );
};

export const updateForwardEvent = async (userId, eventId, updateData, originalStart) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    const updateQuery = groupId
        ? { groupId: groupId, userId, start: { $gte: originalStart } }
        : { _id: eventId, userId };

    const result = await CalendarEvent.updateMany(updateQuery, { $set: updateData });
    return result;
};

export const updateAllEventsInGroup = async (userId, groupId, updateData) => {
    const updateQuery = groupId
        ? { groupId: groupId, userId }
        : { _id: eventId, userId };

    const result = await CalendarEvent.updateMany(updateQuery, { $set: updateData });
    return result;
};

export const deleteEvent = async (userId, eventId) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return CalendarEvent.deleteOne({ _id: eventId, userId });
};

export const deleteForwardEvents = async (userId, groupId, start) => {
    const deleteQuery = groupId
        ? { groupId: groupId, userId, start: { $gte: start } }
        : { _id: eventId, userId };

    const result = await CalendarEvent.deleteMany(deleteQuery);
    return result;
};

export const deleteAllEventsInGroup = async (userId, groupId) => {
    return await CalendarEvent.deleteMany({ groupId, userId });
};
