const { FREQUENCY_TYPE } = require("../../repository/models/enums/enums");
const mongoose = require("mongoose");

/**
 * Generate recurring tasks based on the recurrence rule
 * @param {Object} baseTask - The base task to generate recurrences from
 * @returns {Array} Array of task objects to be created
 */
function generateRecurringTasks(baseTask) {
    const tasks = [baseTask];
    
    // If no frequency type or it's "none", return just the base task
    if (!baseTask.frequencyType || baseTask.frequencyType === FREQUENCY_TYPE.NONE) {
        return tasks;
    }

    let currentFinishDate = new Date(baseTask.finishDate);
    let currentGivenDate = new Date(baseTask.givenDate);
    let occurrencesLeft = baseTask.frequencyOccurrencesLeft;
    const endDate = baseTask.frequencyEndDate ? new Date(baseTask.frequencyEndDate) : null;
    const interval = baseTask.frequencyInterval || 1;
    const frequencyType = baseTask.frequencyType;
    const endType = baseTask.frequencyEndType;
    const daysOfWeek = baseTask.frequencyDaysOfWeek || [];

    // Helper function to create next task
    function createNextTask(finishDate, givenDate, occurrencesLeftValue) {
        const task = {
            ...baseTask,
            finishDate: new Date(finishDate),
            givenDate: new Date(givenDate),
            _id: undefined // Let MongoDB generate new IDs
        };
        
        // Update frequencyOccurrencesLeft if provided
        if (occurrencesLeftValue !== undefined) {
            task.frequencyOccurrencesLeft = occurrencesLeftValue;
        }
        
        delete task.__v; // Remove version field if exists
        return task;
    }

    // Generate recurrences based on frequency type
    while (true) {
        let nextFinishDate = new Date(currentFinishDate);
        let nextGivenDate = new Date(currentGivenDate);
        
        // Calculate next occurrence based on frequency type
        if (frequencyType === FREQUENCY_TYPE.DAYS) {
            nextFinishDate.setDate(nextFinishDate.getDate() + interval);
            nextGivenDate.setDate(nextGivenDate.getDate() + interval);
        } else if (frequencyType === FREQUENCY_TYPE.WEEKS) {
            if (daysOfWeek.length > 0) {
                // For weekly with specific days
                let found = false;
                
                // Find next occurrence on the specified days
                for (let i = 1; i <= 7; i++) {
                    const checkDate = new Date(nextFinishDate);
                    checkDate.setDate(checkDate.getDate() + i);
                    const checkDay = checkDate.getDay();
                    
                    if (daysOfWeek.includes(checkDay)) {
                        nextFinishDate = checkDate;
                        nextGivenDate = new Date(checkDate);
                        const timeDiff = new Date(baseTask.finishDate) - new Date(baseTask.givenDate);
                        nextGivenDate.setTime(nextGivenDate.getTime() - timeDiff);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    break; // This shouldn't happen with valid input
                }
            } else {
                nextFinishDate.setDate(nextFinishDate.getDate() + (interval * 7));
                nextGivenDate.setDate(nextGivenDate.getDate() + (interval * 7));
            }
        } else if (frequencyType === FREQUENCY_TYPE.MONTHS) {
            nextFinishDate.setMonth(nextFinishDate.getMonth() + interval);
            nextGivenDate.setMonth(nextGivenDate.getMonth() + interval);
        } else if (frequencyType === FREQUENCY_TYPE.YEARS) {
            nextFinishDate.setFullYear(nextFinishDate.getFullYear() + interval);
            nextGivenDate.setFullYear(nextGivenDate.getFullYear() + interval);
        }

        // Check if we should continue generating
        let shouldContinue = true;

        if (endType === "after" && occurrencesLeft !== undefined) {
            occurrencesLeft--;
            if (occurrencesLeft <= 0) {
                shouldContinue = false;
            }
        } else if (endType === "on" && endDate) {
            if (nextFinishDate > endDate) {
                shouldContinue = false;
            }
        }

        if (!shouldContinue) {
            break;
        }

        tasks.push(createNextTask(nextFinishDate, nextGivenDate, occurrencesLeft));
        currentFinishDate = nextFinishDate;
        currentGivenDate = nextGivenDate;
    }

    return tasks;
}


/**
 * Validates the task data and returns a structured object with validation results.
 * @param {Object} data 
 * @param {boolean} checkRecurrence 
 * @returns object with properties: valid (boolean), error (string|null), data (object)
 */
function validateData(data, checkRecurrence = false) {
    const allowedFields = ['title', 'description', 'estimatedTime', 'finishDate', 'givenDate', 'subjectId', 'plannable', 'includeReviews'];
    const recurrenceFields = ['frequencyType', 'frequencyEndDate', 'frequencyOccurrencesLeft', 'frequencyInterval', 'frequencyDaysOfWeek', 'frequencyEndType'];
    const updateData = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = data[field];
        }
    }

    if (checkRecurrence) {
        for (const field of recurrenceFields) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                updateData[field] = data[field];
            }
        }
    }

    if (data.subjectId) {
        if (!mongoose.Types.ObjectId.isValid(data.subjectId)) {
            return {
                valid: false,
                error: "Invalid subject ID"
            };
        }
    }

    return {
        valid: true,
        error: null,
        data: updateData
    };
}

/**
 * Compares the new task data with the original task and returns an object containing only the fields that have changed.
 * @param {Object} newData 
 * @param {Object} originalEvent 
 * @returns Object with only the changed fields and their new values
 */
function getChangedFields(newData, originalEvent) {
    // Detectar únicamente los campos que han cambiado
    if (!newData.subjectId){
        newData.subjectId = null; 
    }
    const allowedFields = ['title', 'description', 'estimatedTime', 'subjectId', 'plannable', 'includeReviews'];
    const changedFields = {};
    for (const field of allowedFields) {
        if (!Object.prototype.hasOwnProperty.call(newData, field)) continue;
        const incoming = String(newData[field]);
        const original = String(originalEvent[field]);
        if (incoming !== original) {
            changedFields[field] = newData[field];
        }
    }
    const dateFields = new Set(['finishDate', 'givenDate']);

    for (const field of dateFields) {
        if (!Object.prototype.hasOwnProperty.call(newData, field)) continue;
        
        const incoming = new Date(newData[field]).toISOString();
        const original = new Date(originalEvent[field]).toISOString();

        if (incoming !== original) {
            changedFields[field] = newData[field];
        }
    }
    return changedFields;
}

/**
 * Calculates the review duration based on the actual time taken, repetition count (n), and easiness factor (ef) using a decay function.
 * @param {number} actualTime - The actual time taken for the review in minutes
 * @param {number} n - The repetition count (1 for first review, 2 for second, etc.)
 * @param {number} ef - The easiness factor for the item
 * @return {number} The calculated review duration in minutes, with a minimum threshold applied
 */
function calculateReviewDuration(actualTime, n, ef) {
    const MIN_REVIEW_MINUTES = 15;
    const DECAY_RATE = 0.5;

    const factor = Math.pow(ef, -(n - 1) * DECAY_RATE);
    return Math.max(MIN_REVIEW_MINUTES, Math.round(actualTime * factor));
}

/**
 * Calculates the next review date based on the last interval, repetition count (n), and easiness factor (ef) using the SM-2 algorithm.
 * @param {number} lastInterval - The number of days since the last review
 * @param {number} n - The repetition count (1 for first review, 2 for second, etc.)
 * @param {number} ef - The easiness factor for the item
 * @return {Object} An object containing the next interval in days (daysSM2) and the margin for scheduling flexibility (margen)
 */
function calculateNextReviewDate(lastInterval, n, ef) {
    // Intervalo según SM-2
    let daysSM2;
    if (n === 1) daysSM2 = 1;
    else if (n === 2) daysSM2 = 6;
    else daysSM2 = Math.round(lastInterval * ef);

    const margin = Math.max(1, Math.round(daysSM2 * 0.2));

    return { interval: daysSM2, margin };
}

module.exports = {
    validateData,
    generateRecurringTasks,
    getChangedFields,
    calculateReviewDuration,
    calculateNextReviewDate
}