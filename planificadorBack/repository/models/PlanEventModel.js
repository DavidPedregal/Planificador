const mongoose = require("mongoose");
 
const PlanEventModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
    },
    calendarId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Calendar",
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
    },
    start : {
        type: Date,
        required: true,
    },
    end : {
        type: Date,
        required: true,
    },
    status : {
        type: String,
        enum: ['uncompleted','completed','pending'],
        default: 'pending',
    },
    scheduledTime: {
        type: Number,
        required: true, // minutos planificados en este bloque
    },
    userTime: {
        type: Number,
    },
    isReview: {
        type: Boolean,
        default: false,
    },
});

const PlanEvent = mongoose.model("PlanEvent", PlanEventModel);
module.exports = PlanEvent;