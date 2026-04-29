const mongoose = require("mongoose");
const { FREQUENCY_TYPE } = require("../../repository/models/enums/enums");

 /**
 * Validate event data for creation or update
 * @param {Object} data - The event data to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.isCreation - Whether this is for POST (creation) or PUT (update)
 * @param {Object} options.existingEvent - The original event (for updates)
 * @returns {Object} { valid: boolean, error: string|null, data: Object }
 */
export function validateEventData(data, options = {}) {
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
 * @param {Object} newData The new data provided
 * @param {Object} originalEvent The original data to check changes from
 * @returns An object containing only the fields changed with their new values.
 */
export function getChangedFields(newData, originalEvent) {
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
export function generateRecurringEvents(baseEvent) {
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