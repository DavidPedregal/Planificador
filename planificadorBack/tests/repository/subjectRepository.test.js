const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SubjectRepo = require('../../repository/subjectRepository');
const { AppError, RepositoryError } = require('../../errors/AppError');

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

const mockUserId = new mongoose.Types.ObjectId();
const mockSubject = { userId: mockUserId, name: 'Matemáticas' };

describe('subjectRepository', () => {
    describe('createSubject', () => {
        it('should create a subject', async () => {
            const subject = await SubjectRepo.createSubject(mockSubject);
            expect(subject._id).toBeDefined();
            expect(subject.name).toBe(mockSubject.name);
            expect(subject.userId.toString()).toBe(mockUserId.toString());
        });

        it('should fail if name is missing', async () => {
            await expect(SubjectRepo.createSubject({ userId: mockUserId })).rejects.toThrow();
        });
    });

    describe('findAllSubjectsForUser', () => {
        it('should return all subjects for a user', async () => {
            await SubjectRepo.createSubject(mockSubject);
            await SubjectRepo.createSubject(mockSubject);
            const subjects = await SubjectRepo.findAllSubjectsForUser(mockUserId);
            expect(subjects).toHaveLength(2);
        });

        it('should not return subjects from other users', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            await SubjectRepo.createSubject({ userId: otherUserId, name: 'Física' });
            const subjects = await SubjectRepo.findAllSubjectsForUser(mockUserId);
            expect(subjects).toHaveLength(0);
        });

        it('should return empty array if user has no subjects', async () => {
            const subjects = await SubjectRepo.findAllSubjectsForUser(mockUserId);
            expect(subjects).toHaveLength(0);
        });
    });

    describe('findSubjectForUser', () => {
        it('should find a subject by userId and subjectId', async () => {
            const created = await SubjectRepo.createSubject(mockSubject);
            const found = await SubjectRepo.findSubjectForUser(mockUserId, created._id.toString());
            expect(found).not.toBeNull();
            expect(found._id.toString()).toBe(created._id.toString());
        });

        it('should return null if subject belongs to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const created = await SubjectRepo.createSubject({ userId: otherUserId, name: 'Física' });
            const found = await SubjectRepo.findSubjectForUser(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should throw RepositoryError if subjectId format is invalid', async () => {
            await expect(
                SubjectRepo.findSubjectForUser(mockUserId, 'invalid_id')
            ).rejects.toMatchObject({
                code: 'REPOSITORY_ERROR',
                message: 'Invalid ID format'
            });
        });
    });

    describe('deleteSubject', () => {
        it('should delete a subject', async () => {
            const created = await SubjectRepo.createSubject(mockSubject);
            await SubjectRepo.deleteSubject(mockUserId, created._id.toString());
            const found = await SubjectRepo.findSubjectForUser(mockUserId, created._id.toString());
            expect(found).toBeNull();
        });

        it('should not delete a subject belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const created = await SubjectRepo.createSubject({ userId: otherUserId, name: 'Física' });
            await SubjectRepo.deleteSubject(mockUserId, created._id.toString());
            const found = await SubjectRepo.findSubjectForUser(otherUserId, created._id.toString());
            expect(found).not.toBeNull();
        });

        it('should throw RepositoryError if subjectId format is invalid', async () => {
            await expect(
                SubjectRepo.deleteSubject(mockUserId, 'invalid_id')
            ).rejects.toThrow(RepositoryError);
        });
    });

    describe('updateSubject', () => {
        it('should update the name of a subject', async () => {
            const created = await SubjectRepo.createSubject(mockSubject);
            const updated = await SubjectRepo.updateSubject(mockUserId, created._id.toString(), { name: 'Física' });
            expect(updated.name).toBe('Física');
        });

        it('should return null if subject does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const updated = await SubjectRepo.updateSubject(mockUserId, fakeId, { name: 'Física' });
            expect(updated).toBeNull();
        });

        it('should not update a subject belonging to another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const created = await SubjectRepo.createSubject({ userId: otherUserId, name: 'Física' });
            const updated = await SubjectRepo.updateSubject(mockUserId, created._id.toString(), { name: 'Hacked' });
            expect(updated).toBeNull();
        });

        it('should throw RepositoryError if subjectId format is invalid', async () => {
            await expect(
                SubjectRepo.updateSubject(mockUserId, 'invalid_id', { name: 'X' })
            ).rejects.toThrow(RepositoryError);
        });
    });
});