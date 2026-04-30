// tests/service/userService.test.js
const UserRepo = require('../../repository/userRepository');
const CalendarRepo = require('../../repository/calendarRepository');
const { login } = require('../../services/userService');
const { ValidationError } = require('../../errors/AppError');

jest.mock('../../repository/userRepository');
jest.mock('../../repository/calendarRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockGooglePayload = {
    email: 'test@test.com',
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/pic.jpg'
};

const mockDbUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@test.com',
    fullName: 'Test User',
    name: 'Test',
    familyName: 'User',
    profilePicture: 'https://example.com/pic.jpg'
};

describe('userService', () => {
    describe('login', () => {
        it('should throw ValidationError if email is missing', async () => {
            const { email, ...withoutEmail } = mockGooglePayload;
            await expect(login(withoutEmail)).rejects.toThrow(ValidationError);
        });

        describe('existing user', () => {
            it('should return the user without creating a new one', async () => {
                UserRepo.findByEmail.mockResolvedValue(mockDbUser);

                const result = await login(mockGooglePayload);

                expect(result).toEqual(mockDbUser);
                expect(UserRepo.create).not.toHaveBeenCalled();
            });

            it('should not create default calendars for existing user', async () => {
                UserRepo.findByEmail.mockResolvedValue(mockDbUser);

                await login(mockGooglePayload);

                expect(CalendarRepo.createCalendar).not.toHaveBeenCalled();
            });
        });

        describe('new user', () => {
            beforeEach(() => {
                UserRepo.findByEmail.mockResolvedValue(null);
                UserRepo.create.mockResolvedValue(mockDbUser);
                CalendarRepo.createCalendar.mockResolvedValue({});
            });

            it('should create the user with the correct fields from Google payload', async () => {
                await login(mockGooglePayload);

                expect(UserRepo.create).toHaveBeenCalledWith({
                    email: mockGooglePayload.email,
                    fullName: mockGooglePayload.name,
                    name: mockGooglePayload.given_name,
                    familyName: mockGooglePayload.family_name,
                    profilePicture: mockGooglePayload.picture
                });
            });

            it('should create exactly 3 default calendars', async () => {
                await login(mockGooglePayload);
                expect(CalendarRepo.createCalendar).toHaveBeenCalledTimes(3);
            });

            it('should create the Default calendar', async () => {
                await login(mockGooglePayload);
                expect(CalendarRepo.createCalendar).toHaveBeenCalledWith(
                    expect.objectContaining({ name: "Default", isSystem: false })
                );
            });

            it('should create the Planned system calendar', async () => {
                await login(mockGooglePayload);
                expect(CalendarRepo.createCalendar).toHaveBeenCalledWith(
                    expect.objectContaining({ name: 'Planned', isSystem: true })
                );
            });

            it('should create the Plannable system calendar', async () => {
                await login(mockGooglePayload);
                expect(CalendarRepo.createCalendar).toHaveBeenCalledWith(
                    expect.objectContaining({ name: 'Plannable', isSystem: true })
                );
            });

            it('should return the newly created user', async () => {
                const result = await login(mockGooglePayload);
                expect(result).toEqual(mockDbUser);
            });
        });
    });
});