const CalendarEvent = require("./models/CalendarEventModel");
const mongoose = require("mongoose");
const { RepositoryError } = require('../errors/AppError');

const deleteEventsByCalendarId = async (calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return CalendarEvent.deleteMany({ calendarId });
};

const getEventsByUserId = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return CalendarEvent.find({ userId });
};

const getEventById = async (userId, eventId) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return CalendarEvent.findOne({ _id: eventId, userId });
};

const getPlannableEventsForUser = async (userId, calendarId) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return CalendarEvent.find({ userId, calendarId, start: { $gte: startOfToday } });
};

const createEvent = async (events) => 
    CalendarEvent.insertMany(events);

const updateEvent = async (userId, eventId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return await CalendarEvent.findOneAndUpdate(
        { _id: eventId, userId },
        { $set: updateData },
        { returnDocument: 'after' }
    );
};

const updateForwardEvent = async (userId, eventId, groupId, updateData, originalStart) => {
    const updateQuery = groupId
        ? { groupId: groupId, userId, start: { $gte: originalStart } }
        : { _id: eventId, userId };

    const result = await CalendarEvent.updateMany(updateQuery, { $set: updateData });
    return result;
};

const updateAllEventsInGroup = async (userId, eventId, groupId, updateData) => {
    const updateQuery = groupId
        ? { groupId: groupId, userId }
        : { _id: eventId, userId };

    const result = await CalendarEvent.updateMany(updateQuery, { $set: updateData });
    return result;
};

const deleteEvent = async (userId, eventId) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return CalendarEvent.deleteOne({ _id: eventId, userId });
};

const deleteForwardEvents = async (userId, groupId, eventId, start) => {
    const deleteQuery = groupId
        ? { groupId: groupId, userId, start: { $gte: start } }
        : { _id: eventId, userId };

    const result = await CalendarEvent.deleteMany(deleteQuery);
    return result;
};

const deleteAllEventsInGroup = async (userId, groupId) => {
    return await CalendarEvent.deleteMany({ groupId, userId });
};

const deleteEventsByLabel = async (userId, label) => {
    return await CalendarEvent.deleteMany({ label, userId });
}

module.exports = {
    deleteEventsByCalendarId,
    getEventsByUserId,
    getEventById,
    getPlannableEventsForUser,
    createEvent,
    updateEvent,
    updateForwardEvent,
    updateAllEventsInGroup,
    deleteEvent,
    deleteForwardEvents,
    deleteAllEventsInGroup,
    deleteEventsByLabel
};