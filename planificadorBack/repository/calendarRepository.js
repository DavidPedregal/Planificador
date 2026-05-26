const Calendar = require("./models/CalendarModel");
const mongoose = require("mongoose");
const { RepositoryError } = require('../errors/AppError');

const findCalendarForUser = async (userId, calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Calendar.findOne({ _id: calendarId, userId });
}

const findCustomCalendarsForUser = (userId) => 
    Calendar.find({ userId, isSystem: false });
    
const findSystemCalendarsForUser = (userId) =>
    Calendar.find({ userId, isSystem: true });

const createCalendar = (calendarData) => 
    new Calendar(calendarData).save();

const deleteCalendar = async (userId, calendarId) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Calendar.deleteOne({ _id: calendarId, userId });
};

const updateCalendar = async (userId, calendarId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Calendar.findOneAndUpdate(
        { _id: calendarId, userId },
        { $set: updateData },
        { returnDocument: 'after' }
    );
};

const deleteAllByUserId = (userId) =>
    Calendar.deleteMany({ userId });

module.exports = {
    findCalendarForUser,
    findCustomCalendarsForUser,
    findSystemCalendarsForUser,
    createCalendar,
    deleteCalendar,
    updateCalendar,
    deleteAllByUserId
};