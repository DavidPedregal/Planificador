const UserRepo = require('../repository/userRepository');
const CalendarRepo = require('../repository/calendarRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

module.exports = {
    login
};

async function login(userData) {
    if (!userData.email) throw new ValidationError('Email is required.');

    const user = await UserRepo.findByEmail(userData.email);
    if (!user) {
        const newUser = await UserRepo.create(
            {
                email: userData.email, 
                fullName: userData.name, 
                name: userData.given_name,
                familyName: userData.family_name,
                profilePicture: userData.picture
            });
        await createDefaultCalendarsForUser(newUser._id);
        return newUser;
    }
    return user;
};

async function createDefaultCalendarsForUser(userId) {
    await CalendarRepo.createCalendar({ userId, name: "Default", color: "#ff0000", isSystem: false });
    await CalendarRepo.createCalendar({ userId, name: "calendar.planned", color: "#505050", isSystem: true });
    await CalendarRepo.createCalendar({ userId, name: "calendar.plannable", color: "#bbbbbb", isSystem: true });
};