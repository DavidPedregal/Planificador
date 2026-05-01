const EventRepo = require('../repository/eventRepository');
const CalendarRepo = require('../repository/calendarRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const { generateRecurringEvents, getChangedFields, validateEventData } = require('./helper/eventHelper');
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
    const plannableCalendar = systemCalendars.find(cal => cal.name === "Plannable");
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

    const result = await EventRepo.updateForwardEvent(userId, eventId, originalEvent.groupId, changedFields, originalEvent.start);
    return { message: "Event(s) forwarded successfully", modifiedCount: result.modifiedCount };
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

    const result = await EventRepo.updateAllEventsInGroup(userId, eventId, originalEvent.groupId, changedFields);
    return { message: "Event(s) updated successfully", modifiedCount: result.modifiedCount };
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

module.exports = {
    getAllEvents,
    getEventById,
    getPlannableEventsForUser,
    createEvent,
    updateEvent,
    updateforwardEvent,
    updateAllEventsInGroup,
    deleteEvent,
    deleteForwardEvents,
    deleteAllEventsInGroup
}