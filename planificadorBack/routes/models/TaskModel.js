const mongoose = require("mongoose");
const {FREQUENCY_TYPE} = require("./enums/enums");

const taskModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    estimatedTime: {
        type: Number,
        required: true,
    },
    finishDate: {
        type: Date,
        required: true,
    },
    givenDate: {
        type: Date,
        required: true,
    },
    frequencyType : {
        type : String,
        enum : Object.values(FREQUENCY_TYPE),
    },
    frequencyEndDate : {
        type: Date,
    },
    frequencyOccurrencesLeft : {
        type: Number,
    },
    frequencyInterval: {
        type: Number,
    },
    frequencyDaysOfWeek: {
        type: [Number],
    },
    frequencyEndType: {
        type: String,
        enum: ["never", "on", "after"],
    },
    completed: {
        type: Boolean,
        default: false,
    },
    generatedFromTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
    },
});

const TaskModel = mongoose.model("Task", taskModel);
module.exports = TaskModel;