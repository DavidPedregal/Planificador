const mongoose = require("mongoose");
const {FREQUENCY_TYPE} = require("./enums/enums");

const calendarEvent = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: true,
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
    frequency : {
        type: Number,
    },
    frequencyType : {
        type : String,
        enum : Object.values(FREQUENCY_TYPE),
    },
    frequencyFinishDate : {
        type: Date,
    },
    frequencyOccurrencesLeft : {
        type: Number,
    }
}, { timestamps: true });

const CalendarEvent = mongoose.model("Event", calendarEvent);
module.exports = CalendarEvent;