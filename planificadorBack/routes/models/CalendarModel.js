const mongoose = require("mongoose");

const calendarModel = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const Calendar = mongoose.model("Calendar", calendarModel);
module.exports =  Calendar;