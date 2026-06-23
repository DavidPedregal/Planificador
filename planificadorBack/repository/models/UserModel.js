const mongoose = require("mongoose");

const userModel = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const User = mongoose.model("UserModel", userModel);
module.exports =  User;