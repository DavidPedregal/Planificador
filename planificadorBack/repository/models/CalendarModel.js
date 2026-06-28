const mongoose = require("mongoose");

const calendarModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    visible: {
        type: Boolean,
        default: true,
    },
    isSystem: {
        type: Boolean,
        default: false,
    }
});

const Calendar = mongoose.model("Calendar", calendarModel);
module.exports =  Calendar;