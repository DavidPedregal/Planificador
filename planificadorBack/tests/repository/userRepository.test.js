const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserRepo = require('../../repository/userRepository');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await mongoose.connection.dropDatabase();
});

describe('userRepository', () => {
    const mockUser = {
        email: 'test@test.com',
        name: 'Test'
    };

    describe('create', () => {
        it('should create a user with all fields', async () => {
            const user = await UserRepo.create(mockUser);

            expect(user._id).toBeDefined();
            expect(user.email).toBe(mockUser.email);
            expect(user.name).toBe(mockUser.name);
            expect(user.createdAt).toBeDefined();
        });

        it('should fail if email is missing', async () => {
            const { email, ...withoutEmail } = mockUser;
            await expect(UserRepo.create(withoutEmail)).rejects.toThrow();
        });


        it('should fail if name is missing', async () => {
            const { name, ...withoutName } = mockUser;
            await expect(UserRepo.create(withoutName)).rejects.toThrow();
        });
    });

    describe('findByEmail', () => {
        it('should find an existing user by email', async () => {
            await UserRepo.create(mockUser);
            const found = await UserRepo.findByEmail(mockUser.email);

            expect(found).not.toBeNull();
            expect(found.email).toBe(mockUser.email);
        });

        it('should return null if user does not exist', async () => {
            const found = await UserRepo.findByEmail('noexiste@test.com');
            expect(found).toBeNull();
        });
    });
});