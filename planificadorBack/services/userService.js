const UserRepo = require('../repository/userRepository');
const CalendarRepo = require('../repository/calendarRepository');
const EventRepo = require('../repository/eventRepository');
const TaskRepo = require('../repository/taskRepository');
const PlanRepo = require('../repository/planRepository');
const SubjectRepo = require('../repository/subjectRepository');
const SettingsRepo = require('../repository/settingsRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

module.exports = {
    login,
    deleteAccount
};

async function login(userData) {
    if (!userData.email) throw new ValidationError('Email is required.');

    const user = await UserRepo.findByEmail(userData.email);
    if (!user) {
        const newUser = await UserRepo.create(
            {
                email: userData.email, 
                name: userData.given_name,
            });
        await createDefaultCalendarsForUser(newUser._id);
        return newUser;
    }
    return user;
};

async function deleteAccount(userId) {
    await Promise.all([
        EventRepo.deleteAllByUserId(userId),
        TaskRepo.deleteAllByUserId(userId),
        PlanRepo.deleteAllByUserId(userId),
        SubjectRepo.deleteAllByUserId(userId),
        SettingsRepo.deleteSettings(userId),
        CalendarRepo.deleteAllByUserId(userId),
    ]);
    await UserRepo.deleteById(userId);
};

async function createDefaultCalendarsForUser(userId) {
    await CalendarRepo.createCalendar({ userId, name: "Default", color: "#ff0000", isSystem: false });
    await CalendarRepo.createCalendar({ userId, name: "calendar.planned", color: "#505050", isSystem: true });
    await CalendarRepo.createCalendar({ userId, name: "calendar.plannable", color: "#bbbbbb", isSystem: true });
};