const SubjectRepo = require('../../repository/subjectRepository');
const SubjectService = require('../../services/subjectService');
const { ValidationError, NotFoundError } = require('../../errors/AppError');

jest.mock('../../repository/subjectRepository');

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';
const mockSubjectId = '507f1f77bcf86cd799439012';
const mockSubject = { _id: mockSubjectId, userId: mockUserId, name: 'Matemáticas' };

describe('subjectService', () => {
    describe('getSubjectsForUser', () => {
        it('should return all subjects for a user', async () => {
            SubjectRepo.findAllSubjectsForUser.mockResolvedValue([mockSubject]);
            const result = await SubjectService.getSubjectsForUser(mockUserId);
            expect(result).toEqual([mockSubject]);
            expect(SubjectRepo.findAllSubjectsForUser).toHaveBeenCalledWith(mockUserId);
        });

        it('should return empty array if user has no subjects', async () => {
            SubjectRepo.findAllSubjectsForUser.mockResolvedValue([]);
            const result = await SubjectService.getSubjectsForUser(mockUserId);
            expect(result).toHaveLength(0);
        });
    });

    describe('createSubject', () => {
        it('should create a subject with valid data', async () => {
            SubjectRepo.findSubjectByNameForUser.mockResolvedValue(null);
            SubjectRepo.createSubject.mockResolvedValue(mockSubject);
            const result = await SubjectService.createSubject(mockUserId, { name: 'Matemáticas' });
            expect(result).toEqual(mockSubject);
            expect(SubjectRepo.findSubjectByNameForUser).toHaveBeenCalledWith(mockUserId, 'Matemáticas');
            expect(SubjectRepo.createSubject).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Matemáticas', userId: mockUserId })
            );
        });

        it('should throw ValidationError if name is missing', async () => {
            await expect(SubjectService.createSubject(mockUserId, {})).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if name is empty string', async () => {
            await expect(SubjectService.createSubject(mockUserId, { name: '' })).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if name is only whitespace', async () => {
            await expect(SubjectService.createSubject(mockUserId, { name: '   ' })).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if a subject with the same name already exists', async () => {
            SubjectRepo.findSubjectByNameForUser.mockResolvedValue(mockSubject);
            await expect(
                SubjectService.createSubject(mockUserId, { name: 'Matemáticas' })
            ).rejects.toThrow(ValidationError);
            expect(SubjectRepo.createSubject).not.toHaveBeenCalled();
        });
    });

    describe('deleteSubject', () => {
        it('should delete a subject', async () => {
            SubjectRepo.findSubjectForUser.mockResolvedValue(mockSubject);
            SubjectRepo.deleteSubject.mockResolvedValue({});

            await SubjectService.deleteSubject(mockUserId, mockSubjectId);
            expect(SubjectRepo.deleteSubject).toHaveBeenCalledWith(mockUserId, mockSubjectId);
        });

        it('should throw NotFoundError if subject does not exist', async () => {
            SubjectRepo.findSubjectForUser.mockResolvedValue(null);
            await expect(SubjectService.deleteSubject(mockUserId, mockSubjectId)).rejects.toThrow(NotFoundError);
            expect(SubjectRepo.deleteSubject).not.toHaveBeenCalled();
        });
    });

    describe('updateSubject', () => {
        it('should update a subject with valid data', async () => {
            const updated = { ...mockSubject, name: 'Física' };
            SubjectRepo.updateSubject.mockResolvedValue(updated);

            const result = await SubjectService.updateSubject(mockUserId, mockSubjectId, { name: 'Física' });
            expect(result.name).toBe('Física');
        });

        it('should throw ValidationError if name is missing', async () => {
            await expect(SubjectService.updateSubject(mockUserId, mockSubjectId, {})).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if name is empty string', async () => {
            await expect(SubjectService.updateSubject(mockUserId, mockSubjectId, { name: '' })).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if name is only whitespace', async () => {
            await expect(SubjectService.updateSubject(mockUserId, mockSubjectId, { name: '   ' })).rejects.toThrow(ValidationError);
        });

        it('should throw NotFoundError if subject does not exist', async () => {
            SubjectRepo.updateSubject.mockResolvedValue(null);
            await expect(SubjectService.updateSubject(mockUserId, mockSubjectId, { name: 'Física' })).rejects.toThrow(NotFoundError);
        });
    });
});