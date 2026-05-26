const Settings = require("./models/SettingsModel");
const { RepositoryError } = require('../errors/AppError');

const findSettingsForUser = async (userId) => {
    return Settings.findOne({ userId });
};

const createSettings = (settingsData) => {
    return new Settings(settingsData).save();
};

const updateSettings = async (userId, updateData) => {
    return Settings.findOneAndUpdate({ userId }, { $set: updateData }, { returnDocument: 'after' });
};

const deleteSettings = async (userId) => {
    return Settings.deleteOne({ userId });
};

module.exports = {
    findSettingsForUser,
    createSettings,
    updateSettings,
    deleteSettings
};