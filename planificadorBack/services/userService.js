import * as UserRepo from '../repository/userRepository';
import * as CalendarRepo from '../repository/calendarRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';

export const login = async (userData) => {
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
    await CalendarRepo.createCalendar({ userId, name: "Default", color: "#ff0000" });
    await CalendarRepo.createCalendar({ userId, name: "Planned", color: "#505050", isSystem: true });
    await CalendarRepo.createCalendar({ userId, name: "Plannable", color: "#bbbbbb", isSystem: true });
};