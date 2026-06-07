const EventRepo = require('../repository/eventRepository');
const CalendarRepo = require('../repository/calendarRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const { generateRecurringEvents, getChangedFields, validateEventData, replaceTimeOnly } = require('./business/eventHelper');
const { randomUUID } = require('crypto');

const getAllEvents = async (userId) => 
    EventRepo.getEventsByUserId(userId);

const getEventById = async (userId, eventId) => {
    const event = await EventRepo.getEventById(userId, eventId);
    if (!event) {
        throw new NotFoundError("Event not found");
    }
    return event;
};

const getPlannableEventsForUser = async (userId) => {
    const systemCalendars = await CalendarRepo.findSystemCalendarsForUser(userId);
    const plannableCalendar = systemCalendars.find(cal => cal.name === "calendar.plannable");
    if (!plannableCalendar) {
        throw new NotFoundError('Plannable calendar not found');
    }
    return EventRepo.getPlannableEventsForUser(userId, plannableCalendar._id);
}

const createEvent = async (userId, eventData) => {
    const validation = validateEventData(eventData, { isCreation: true });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const baseEvent = { userId, ...validation.data };
    const eventsToCreate = generateRecurringEvents(baseEvent);

    if (eventsToCreate.length > 1) {
        const groupId = randomUUID();
        eventsToCreate.forEach(event => {
            event.groupId = groupId;
        });
    }

    return await EventRepo.createEvent(eventsToCreate);
};

const updateEvent = async (userId, eventId, newData) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }

    const validation = validateEventData(newData, { isCreation: false, existingEvent });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const changedFields = getChangedFields(validation.data, existingEvent);
    if (Object.keys(changedFields).length === 0) {
        throw new ValidationError("No changes detected");
    }

    return await EventRepo.updateEvent(userId, eventId, changedFields);
};

const updateforwardEvent = async (userId, eventId, newData) => {
    const validation = validateEventData(newData, { isCreation: false });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const originalEvent = await EventRepo.getEventById(userId, eventId);
    if (!originalEvent) {
        throw new NotFoundError("Event not found");
    }

    const changedFields = getChangedFields(validation.data, originalEvent);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const result = await applyMultiEventUpdate(
        userId, originalEvent.groupId, changedFields,
        { fromDate: originalEvent.start, fallbackId: eventId }
    );
    return { message: "Event(s) forwarded successfully", modifiedCount: result.modifiedCount ?? result.nModified ?? 0 };
};

const updateAllEventsInGroup = async (userId, eventId, newData) => {
    const validation = validateEventData(newData, { isCreation: false });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const originalEvent = await EventRepo.getEventById(userId, eventId);
    if (!originalEvent) {
        throw new NotFoundError("Event not found");
    }

    const changedFields = getChangedFields(validation.data, originalEvent);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const result = await applyMultiEventUpdate(userId, originalEvent.groupId, changedFields, { fallbackId: eventId });
    return { message: "Event(s) updated successfully", modifiedCount: result.modifiedCount ?? result.nModified ?? 0 };
};

// Apply updates to multiple events in a group.
// When start/end change, preserve each event's date and only replace the time-of-day.
const applyMultiEventUpdate = async (userId, groupId, changedFields, { fromDate = null, fallbackId } = {}) => {
    const { start, end, ...otherFields } = changedFields;

    if (!start && !end) {
        // No date/time change — existing updateMany is safe
        if (fromDate) {
            return EventRepo.updateForwardEvent(userId, fallbackId, groupId, otherFields, fromDate);
        }
        return EventRepo.updateAllEventsInGroup(userId, fallbackId, groupId, otherFields);
    }

    // Fetch affected events so we can compute per-event datetimes
    const events = await EventRepo.getGroupEvents(userId, groupId, fromDate);
    const newStartTime = start ? new Date(start) : null;
    const newEndTime   = end   ? new Date(end)   : null;

    const updates = events.map(event => {
        const fields = { ...otherFields };
        if (newStartTime) fields.start = replaceTimeOnly(event.start, newStartTime);
        if (newEndTime)   fields.end   = replaceTimeOnly(event.end,   newEndTime);
        return { id: event._id, fields };
    });

    return EventRepo.bulkUpdateEvents(updates);
};

const deleteEvent = async (userId, eventId) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }
    await EventRepo.deleteEvent(userId, eventId);
};

const deleteForwardEvents = async (userId, eventId) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }

    const result = await EventRepo.deleteForwardEvents(userId, existingEvent.groupId, eventId, existingEvent.start);
    return { message: "Event(s) deleted successfully", modifiedCount: result.deletedCount };
};

const deleteAllEventsInGroup = async (userId, eventId) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }

    const result = await EventRepo.deleteAllEventsInGroup(userId, existingEvent.groupId);
    return { message: "Event(s) deleted successfully", modifiedCount: result.deletedCount };
};

const bulkImportEvents = async (userId, parsedEvents, calendarId, label) => {
    const docs = parsedEvents.map(e => ({
        userId,
        calendarId,
        title: e.title,
        start: e.start,
        end: e.end,
        useCalendarColor: true,
        ...(label ? { label } : {}),
    }));
    return EventRepo.createEvent(docs);
};

const deleteEventsByLabel = async (userId, label) => {
    if (!label || typeof label !== 'string') {
        throw new ValidationError("Invalid label");
    }
    const result = await EventRepo.deleteEventsByLabel(userId, label);
    return { message: "Event(s) deleted successfully", modifiedCount: result.deletedCount };
};

module.exports = {
    getAllEvents,
    getEventById,
    getPlannableEventsForUser,
    createEvent,
    bulkImportEvents,
    updateEvent,
    updateforwardEvent,
    updateAllEventsInGroup,
    deleteEvent,
    deleteForwardEvents,
    deleteAllEventsInGroup,
    deleteEventsByLabel
}