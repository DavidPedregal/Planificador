import * as EventRepo from '../repository/eventRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { generateRecurringEvents, getChangedFields, validateEventData } from './helper/eventHelper';
const { randomUUID } = require('crypto');

export const getAllEvents = async (userId) => 
    EventRepo.getEventsByUserId(userId);

export const getEventById = async (userId, eventId) => {
    const event = await EventRepo.getEventById(userId, eventId);
    if (!event) {
        throw new NotFoundError("Event not found");
    }
    return event;
};

export const createEvent = async (userId, eventData) => {
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

export const updateEvent = async (userId, eventId, newData) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }

    const validation = validateEventData(newData, { isCreation: false, existingEvent });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const changedFields = getChangedFields(existingEvent, validation.data);
    if (Object.keys(changedFields).length === 0) {
        throw new ValidationError("No changes detected");
    }

    return await EventRepo.updateEvent(userId, eventId, changedFields);
};

export const updateforwardEvent = async (userId, eventId, newData) => {
    const validation = validateEventData(newData, { isCreation: false });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const originalEvent = await EventRepo.getEventById(userId, eventId);
    if (!originalEvent) {
        throw new NotFoundError("Event not found");
    }

    const changedFields = getChangedFields(originalEvent, validation.data);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const modifiedCount = await EventRepo.updateForwardEvent(userId, eventId, changedFields, originalEvent.start);
    return { message: "Event(s) forwarded successfully", modifiedCount };
};

export const updateAllEventsInGroup = async (userId, eventId, newData) => {
    const validation = validateEventData(newData, { isCreation: false });
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const originalEvent = await EventRepo.getEventById(userId, eventId);
    if (!originalEvent) {
        throw new NotFoundError("Event not found");
    }

    const changedFields = getChangedFields(originalEvent, validation.data);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const modifiedCount = await EventRepo.updateAllEventsInGroup(userId, eventId, changedFields, originalEvent.groupId, originalEvent.start);
    return { message: "Event(s) updated successfully", modifiedCount };
};

export const deleteEvent = async (userId, eventId) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }
    await EventRepo.deleteEvent(userId, eventId);
};

export const deleteForwardEvents = async (userId, eventId) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }

    const modifiedCount = await EventRepo.deleteForwardEvents(userId, existingEvent.groupId, existingEvent.start);
    return { message: "Event(s) deleted successfully", modifiedCount };
};

export const deleteAllEventsInGroup = async (userId, eventId) => {
    const existingEvent = await EventRepo.getEventById(userId, eventId);
    if (!existingEvent) {
        throw new NotFoundError("Event not found");
    }

    const modifiedCount = await EventRepo.deleteAllEventsInGroup(userId, existingEvent.groupId);
    return { message: "Event(s) deleted successfully", modifiedCount };
};