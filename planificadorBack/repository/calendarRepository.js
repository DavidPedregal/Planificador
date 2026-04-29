const Calendar = require("./models/CalendarModel");
const mongoose = require("mongoose");
import { RepositoryError } from '../errors/AppError';

export const findCalendarForUser = (userId, calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Calendar.findOne({ _id: calendarId, userId });
}

export const findCustomCalendarsForUser = (userId) => 
    Calendar.find({ userId, isSystem: false });
    
export const findSystemCalendarsForUser = (userId) =>
    Calendar.find({ userId, isSystem: true });

export const createCalendar = (calendarData) => 
    new Calendar(calendarData).save();

export const deleteCalendar = async (userId, calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Calendar.deleteOne({ _id: calendarId, userId });
};

export const updateCalendar = async (userId, calendarId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Calendar.findOneAndUpdate(
        { _id: calendarId, userId },
        { $set: updateData },
        { new: true }
    );
};
