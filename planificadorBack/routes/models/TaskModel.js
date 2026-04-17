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
    completed: {
        type: Boolean,
        default: false,
    },
    groupId: {
        type: String,
    },
});

const TaskModel = mongoose.model("Task", taskModel);
module.exports = TaskModel;