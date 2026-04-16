const express = require('express');
const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEventModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');
const { FREQUENCY_TYPE } = require("./models/enums/enums");


/**
 * Validate event data for creation or update
 * @param {Object} data - The event data to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.isCreation - Whether this is for POST (creation) or PUT (update)
 * @param {Object} options.existingEvent - The original event (for updates)
 * @returns {Object} { valid: boolean, error: string|null, data: Object }
 */
function validateEventData(data, options = {}) {
    const { isCreation = false, existingEvent = null } = options;
    const allowedFields = ['title', 'start', 'end', 'calendarId', 'description', 'color', 
        'useCalendarColor', 'label'];
    
    // For creation, require certain fields
    if (isCreation) {
        if (!data.title || !data.start || !data.end || !data.calendarId) {
            return {
                valid: false,
                error: "Title, start, end and calendarId are required"
            };
        }
    }

    // Filter to allowed fields (for updates)
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = data[field];
        }
    }

    // For updates, ensure at least one field is provided
    if (!isCreation && Object.keys(updateData).length === 0) {
        return {
            valid: false,
            error: "No valid fields provided for update"
        };
    }

    // Validate calendarId format if provided
    if (Object.prototype.hasOwnProperty.call(updateData, 'calendarId')) {
        if (!mongoose.Types.ObjectId.isValid(updateData.calendarId)) {
            return {
                valid: false,
                error: "Invalid calendarId"
            };
        }
    } else if (isCreation && !mongoose.Types.ObjectId.isValid(data.calendarId)) {
        return {
            valid: false,
            error: "Invalid calendarId"
        };
    }

    // Determine which dates to validate against
    const startDate = updateData.start || data.start || existingEvent?.start;
    const endDate = updateData.end || data.end || existingEvent?.end;

    // Validate that end date is after start date (if both are provided)
    if (startDate && endDate) {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        if (endDateTime <= startDateTime) {
            return {
                valid: false,
                error: "End date must be after start date"
            };
        }
    }

    return {
        valid: true,
        error: null,
        data: isCreation ? data : updateData
    };
}

/**
 * 
 */
function getChangedFields(newData, originalEvent) {
    // Detectar únicamente los campos que han cambiado
    const allowedFields = ['title', 'calendarId', 'description', 'color', 'useCalendarColor', 'label'];
    const changedFields = {};
    for (const field of allowedFields) {
        if (!Object.prototype.hasOwnProperty.call(newData, field)) continue;
        const incoming = String(newData[field]);
        const original = String(originalEvent[field]);
        if (incoming !== original) {
            changedFields[field] = newData[field];
        }
    }

    const dateFields = new Set(['start', 'end']);

    for (const field of allowedFields) {
        if (!Object.prototype.hasOwnProperty.call(newData, field)) continue;
        
        const incoming = dateFields.has(field)
            ? new Date(newData[field]).toISOString()
            : newData[field];
        const original = dateFields.has(field)
            ? new Date(originalEvent[field]).toISOString()
            : originalEvent[field];

        if (incoming !== original) {
            changedFields[field] = newData[field];
        }
    }
    return changedFields;
}

/**
 * Generate recurring events based on the recurrence rule
 * @param {Object} baseEvent - The base event to generate recurrences from
 * @returns {Array} Array of event objects to be created
 */
function generateRecurringEvents(baseEvent) {
    const events = [baseEvent];
    
    // If no frequency type or it's "none", return just the base event
    if (!baseEvent.frequencyType || baseEvent.frequencyType === FREQUENCY_TYPE.NONE) {
        return events;
    }

    let currentStart = new Date(baseEvent.start);
    let currentEnd = new Date(baseEvent.end);
    let occurrencesLeft = baseEvent.frequencyOccurrencesLeft;
    const endDate = baseEvent.frequencyEndDate ? new Date(baseEvent.frequencyEndDate) : null;
    const interval = baseEvent.frequencyInterval || 1;
    const frequencyType = baseEvent.frequencyType;
    const daysOfWeek = baseEvent.frequencyDaysOfWeek || [];
    const endType = baseEvent.frequencyEndType;

    // Helper function to add time duration and create new event
    function createNextEvent(start, end, occurrencesLeftValue) {
        const event = {
            ...baseEvent,
            start: new Date(start),
            end: new Date(end),
            _id: undefined // Let MongoDB generate new IDs
        };
        
        // Update frequencyOccurrencesLeft if provided
        if (occurrencesLeftValue !== undefined) {
            event.frequencyOccurrencesLeft = occurrencesLeftValue;
        }
        
        delete event.__v; // Remove version field if exists
        return event;
    }

    // Generate recurrences based on frequency type
    while (true) {
        let nextStart = new Date(currentStart);
        let nextEnd = new Date(currentEnd);
        
        // Calculate next occurrence based on frequency type
        if (frequencyType === FREQUENCY_TYPE.DAYS) {
            nextStart.setDate(nextStart.getDate() + interval);
            nextEnd.setDate(nextEnd.getDate() + interval);
        } else if (frequencyType === FREQUENCY_TYPE.WEEKS) {
            if (daysOfWeek.length > 0) {
                // For weekly with specific days
                let found = false;
                
                // Find next occurrence on the specified days
                for (let i = 1; i <= 7; i++) {
                    const checkDate = new Date(nextStart);
                    checkDate.setDate(checkDate.getDate() + i);
                    const checkDay = checkDate.getDay();
                    
                    if (daysOfWeek.includes(checkDay)) {
                        nextStart = checkDate;
                        nextEnd = new Date(checkDate);
                        const timeDiff = new Date(baseEvent.end) - new Date(baseEvent.start);
                        nextEnd.setTime(nextEnd.getTime() + timeDiff);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    break; // This shouldn't happen with valid input
                }
            } else {
                nextStart.setDate(nextStart.getDate() + (interval * 7));
                nextEnd.setDate(nextEnd.getDate() + (interval * 7));
            }
        } else if (frequencyType === FREQUENCY_TYPE.MONTHS) {
            nextStart.setMonth(nextStart.getMonth() + interval);
            nextEnd.setMonth(nextEnd.getMonth() + interval);
        } else if (frequencyType === FREQUENCY_TYPE.YEARS) {
            nextStart.setFullYear(nextStart.getFullYear() + interval);
            nextEnd.setFullYear(nextEnd.getFullYear() + interval);
        }

        // Check if we should continue generating
        let shouldContinue = true;

        if (endType === "after" && occurrencesLeft !== undefined) {
            occurrencesLeft--;
            if (occurrencesLeft <= 0) {
                shouldContinue = false;
            }
        } else if (endType === "on" && endDate) {
            if (nextStart > endDate) {
                shouldContinue = false;
            }
        }

        if (!shouldContinue) {
            break;
        }

        events.push(createNextEvent(nextStart, nextEnd, occurrencesLeft));
        currentStart = nextStart;
        currentEnd = nextEnd;
    }

    return events;
}

router.get('/', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;

    try {
        const events = await CalendarEvent.find({ userId });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo eventos" });
    }
});

router.post('/', dbLimiter, authMiddleware, async function(req, res) {
    try {
        const userId = req.userId;

        // Validate input data
        const validation = validateEventData(req.body, { isCreation: true });
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Create base event with userId
        const baseEvent = { userId, ...validation.data };

        // Generate all recurring events if applicable
        const eventsToCreate = generateRecurringEvents(baseEvent);

        const groupId = new mongoose.Types.ObjectId().toString();

        // If multiple events are generated, assign them a common groupId
        if (eventsToCreate.length > 1) {
            eventsToCreate.forEach(event => {
                event.groupId = groupId;
            });
        }

        // Save all events
        const saved = await CalendarEvent.insertMany(eventsToCreate);
        res.status(201).json(saved.length === 1 ? saved[0] : saved);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    // Validate input data
    const validation = validateEventData(req.body, { isCreation: false });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        // Update the event
        const updated = await CalendarEvent.findOneAndUpdate(
            { _id: eventId, userId },
            { $set: validation.data },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: "Event updated successfully", event: updated });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/forward/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    const validation = validateEventData(req.body, { isCreation: false });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const originalEvent = await CalendarEvent.findOne({ _id: eventId, userId });
        if (!originalEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

        const changedFields = getChangedFields(validation.data, originalEvent);

        if (Object.keys(changedFields).length === 0) {
            return res.status(200).json({ message: "No changes detected", modifiedCount: 0 });
        }

        const updateQuery = originalEvent.groupId
            ? { groupId: originalEvent.groupId, userId, start: { $gte: originalEvent.start } }
            : { _id: eventId, userId };

        const result = await CalendarEvent.updateMany(updateQuery, { $set: changedFields });

        res.json({
            message: `${result.modifiedCount} event(s) updated successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    const validation = validateEventData(req.body, { isCreation: false });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const originalEvent = await CalendarEvent.findOne({ _id: eventId, userId });
        if (!originalEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

        const changedFields = getChangedFields(validation.data, originalEvent);

        if (Object.keys(changedFields).length === 0) {
            return res.status(200).json({ message: "No changes detected", modifiedCount: 0 });
        }

        const updateQuery = originalEvent.groupId
            ? { groupId: originalEvent.groupId, userId }
            : { _id: eventId, userId };

        const result = await CalendarEvent.updateMany(updateQuery, { $set: changedFields });

        res.json({
            message: `${result.modifiedCount} event(s) updated successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/calendar/:calendarId', dbLimiter, authMiddleware, async function(req, res) {

    const userId = req.userId;
    const calendarId = req.params.calendarId;

    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res.status(400).json({ error: "Invalid calendar ID" });
    }

    try {
        const deleted = await CalendarEvent.deleteMany({ calendarId, userId });
        res.json({ message: `${deleted.deletedCount} events deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: "Error deleting events" });
    }
});

router.delete('/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    try {
        const deleted = await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
        if (!deleted) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting event" });
    }   
});

router.delete('/forward/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    try {
        const event = await CalendarEvent.findOne({ _id: eventId, userId });
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const deleteQuery = event.groupId
            ? { groupId: event.groupId, userId, start: { $gte: event.start } }
            : { _id: eventId, userId };

        const result = await CalendarEvent.deleteMany(deleteQuery);

        res.json({
            message: `${result.deletedCount} event(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ error: "Error deleting event" });
    }
});

router.delete('/all/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    try {
        const deleted = await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
        if (!deleted) {
            return res.status(404).json({ error: "Event not found" });
        }

        await CalendarEvent.deleteMany({ groupId: deleted.groupId, userId });

        res.status(200).json({ message: "Events deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting event" });
    }   
});

module.exports = router;
