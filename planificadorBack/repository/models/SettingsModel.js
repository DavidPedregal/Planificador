const mongoose = require("mongoose");
 
const SettingsModel = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    systemColor: { type: String, default: "#7c6ff740" },
    theme: { type: String, default: "dark" },
    defaultCalendarView: { type: String, default: "timeGridWeek", enum: ["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"] },
    startHour: { type: Number, default: 8 },
    endHour: { type: Number, default: 20 },
});

const Settings = mongoose.model("Settings", SettingsModel);
module.exports = Settings;