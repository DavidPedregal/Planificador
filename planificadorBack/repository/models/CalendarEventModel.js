const mongoose = require("mongoose");

const calendarEventModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
    },
    useCalendarColor: {
        type: Boolean,
        required: true,
        default: true,
    },
    color: {
        type: String,
        default: "#000000",
    },
    calendarId : {
        type: String,
        required: true,
    },
    label : {
        type: String,
    },
    start : {
        type: Date,
        required: true,
    },
    end : {
        type: Date,
        required: true,
    },
    groupId: {
        type: String,
    },
});

const CalendarEvent = mongoose.model("Event", calendarEventModel);
module.exports = CalendarEvent;