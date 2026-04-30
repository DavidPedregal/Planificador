const User = require("./models/UserModel");
const mongoose = require("mongoose");
const { RepositoryError } = require('../errors/AppError');

const findByEmail = (email) =>
    User.findOne({ email });

const create = (userData) =>
    new User(userData).save();

module.exports = {
    findByEmail,
    create
};