const mongoose = require("mongoose");

const subjectModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: true,
    },
});

const SubjectModel = mongoose.model("Subject", subjectModel);
module.exports = SubjectModel;