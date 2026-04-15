const express = require('express');
const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEventModel");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dbLimiter } = require('../middlewares/rateLimiterMiddleware');
const { FREQUENCY_TYPE } = require("./models/enums/enums");

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
    function createNextEvent(start, end) {
        const event = {
            ...baseEvent,
            start: new Date(start),
            end: new Date(end),
            _id: undefined // Let MongoDB generate new IDs
        };
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

        events.push(createNextEvent(nextStart, nextEnd));
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

        if (!mongoose.Types.ObjectId.isValid(req.body.calendarId)) {
            return res.status(400).json({ error: "Invalid calendarId" });
        }

        if (!req.body.title || !req.body.start || !req.body.end || !req.body.calendarId) {
            return res.status(400).json({ error: "Title, start, end and calendarId are required" });
        }

        const startDate = new Date(req.body.start);
        const endDate = new Date(req.body.end);
        if (endDate <= startDate) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        // Create base event with userId
        const baseEvent = { userId, ...req.body };

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

    // Only allow these fields for single event update
    const allowedFields = ['title', 'start', 'end', 'calendarId', 'description', 'color', 
        'useCalendarColor', 'label', 'frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 
        'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
    
    // Allow start/end updates with validation
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updateData[field] = req.body[field];
        }
    }

    // Handle start/end separately with validation
    if (Object.prototype.hasOwnProperty.call(req.body, 'start')) {
        updateData.start = req.body.start;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'end')) {
        updateData.end = req.body.end;
    }

    // If calendarId is being updated, validate it
    if (Object.prototype.hasOwnProperty.call(updateData, 'calendarId')) {
        if (!mongoose.Types.ObjectId.isValid(updateData.calendarId)) {
            return res.status(400).json({ error: "Invalid calendarId" });
        }
    }

    // Validate that end date is after start date
    if (Object.prototype.hasOwnProperty.call(updateData, 'start') || Object.prototype.hasOwnProperty.call(updateData, 'end')) {
        const startDate = updateData.start || req.body.start;
        const endDate = updateData.end || req.body.end;
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            if (endDateTime <= startDateTime) {
                return res.status(400).json({ error: "End date must be after start date" });
            }
        }
    }
	
    // Disallow empty updates
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
    }

    try {
        // Fetch the original event to check for recurrence
        const originalEvent = await CalendarEvent.findOne({ _id: eventId, userId });
        if (!originalEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if trying to update recurrence fields on a recurring event
        const recurrenceFields = ['frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 
                                  'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
        const isRecurrenceChange = recurrenceFields.some(field => 
            Object.prototype.hasOwnProperty.call(req.body, field)
        );
        
        const hasOriginalRecurrence = originalEvent.frequencyType !== FREQUENCY_TYPE.NONE;
        
        if (isRecurrenceChange && hasOriginalRecurrence) {
            return res.status(400).json({ error: "Recurrence cannot be updated for a single event of the sequence" });
        }

        // Delete the existing event to create the recurrent events if needed
        await CalendarEvent.findOneAndDelete({ _id: eventId, userId });

        const eventsToCreate = generateRecurringEvents(originalEvent.toObject());

        const groupId = new mongoose.Types.ObjectId().toString();

        // If multiple events are generated, assign them a common groupId
        if (eventsToCreate.length > 1) {
            eventsToCreate.forEach(event => {
                event.groupId = groupId;
            });
        }

        // Save all events
        const saved = await CalendarEvent.insertMany(eventsToCreate);
        res.status(200).json({ message: "Event updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/all/:id', dbLimiter, authMiddleware, async function(req, res) {
    const userId = req.userId;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }

    const allowedFields = ['title', 'start', 'end', 'calendarId', 'description', 'color', 
        'useCalendarColor', 'label', 'frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 
        'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updateData[field] = req.body[field];
        }
    }

    // If calendarId is being updated, validate it
    if (Object.prototype.hasOwnProperty.call(updateData, 'calendarId')) {
        if (!mongoose.Types.ObjectId.isValid(updateData.calendarId)) {
            return res.status(400).json({ error: "Invalid calendarId" });
        }
    }

    // Validate that end date is after start date
    if (Object.prototype.hasOwnProperty.call(updateData, 'start') || Object.prototype.hasOwnProperty.call(updateData, 'end')) {
        const startDate = updateData.start || req.body.start;
        const endDate = updateData.end || req.body.end;
        if (startDate && endDate) {
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            if (endDateTime <= startDateTime) {
                return res.status(400).json({ error: "End date must be after start date" });
            }
        }
    }
	
    // Disallow empty updates
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
    }

    try {
        // Find the original event to get its groupId and start date
        const originalEvent = await CalendarEvent.findOne({ _id: eventId, userId });
        if (!originalEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if recurrence fields are being modified
        const recurrenceFields = ['frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 
                                  'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
        const isRecurrenceModified = recurrenceFields.some(field => 
            Object.prototype.hasOwnProperty.call(updateData, field)
        );

        if (isRecurrenceModified) {
            // Delete all events from this event onwards in the same group
            await CalendarEvent.deleteMany({ 
                groupId: originalEvent.groupId, 
                userId,
                start: { $gte: originalEvent.start }
            });

            // Create the updated base event
            const updatedBaseEvent = { ...originalEvent.toObject(), ...updateData };
            
            // Generate new recurring events based on new rule
            const newEvents = generateRecurringEvents(updatedBaseEvent);
            
            // Assign groupId if multiple events
            if (newEvents.length > 1) {
                newEvents.forEach(event => {
                    event.groupId = originalEvent.groupId;
                });
            }

            // Insert new events
            const result = await CalendarEvent.insertMany(newEvents);

            res.json({ 
                message: `Event and ${result.length - 1} recurring event(s) created successfully`,
                events: result
            });
        } else {
            // No recurrence change, just update normally
            let updateQuery;
            
            if (originalEvent.groupId) {
                // Update all events in the group from this event onwards
                updateQuery = { 
                    groupId: originalEvent.groupId, 
                    userId,
                    start: { $gte: originalEvent.start }
                };
            } else {
                // Single non-recurring event, update only this event
                updateQuery = {
                    _id: eventId,
                    userId
                };
            }
            
            const result = await CalendarEvent.updateMany(updateQuery, { $set: updateData });

            res.json({ 
                message: `${result.modifiedCount} event(s) updated successfully`,
                modifiedCount: result.modifiedCount
            });
        }
    } catch (error) {
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
