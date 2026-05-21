const mongoose = require("mongoose");

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
    completed: {
        type: Boolean,
        default: false,
    },
    groupId: {
        type: String,
    },
    plannable: {
        type: Boolean,
    },
    includeReviews: {
        type: Boolean,
        default: false,
    },
    isReview: {
        type: Boolean,
        default: false,
    },
    reviewOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
    },
    ef : {
        type: Number,
        default: 2.5
    },
    interval: {
        type: Number,
        default: 0
    },
    iteration : {
        type: Number,
        default: 0
    }
});

const TaskModel = mongoose.model("Task", taskModel);
module.exports = TaskModel;