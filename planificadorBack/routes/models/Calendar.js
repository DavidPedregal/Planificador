const mongoose = require("mongoose");

const calendar = new mongoose.Schema({
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

const Calendar = mongoose.model("Calendar", calendar);
module.exports =  Calendar;