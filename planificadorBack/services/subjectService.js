import * as SubjectRepo from '../repository/subjectRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';

export const getSubjectsForUser = async (userId) => {
    return await SubjectRepo.findAllSubjectsForUser(userId);
}

export const createSubject = async (userId,subjectData) => {
    if (!subjectData.name || subjectData.name.trim() === '') {
        throw new ValidationError('Subject name is required');
    }
    return await SubjectRepo.createSubject({ ...subjectData, userId });
};

export const deleteSubject = async (userId, subjectId) => {
    const existing = await SubjectRepo.findSubjectForUser(userId, subjectId);
    if (!existing) {
        throw new NotFoundError('Subject not found');
    }
    await SubjectRepo.deleteSubject(userId, subjectId);
};

export const updateSubject = async (userId, subjectId, updateData) => {
    if (!updateData.name || updateData.name.trim() === '') {
        throw new ValidationError('Subject name is required');
    }

    const updated = await SubjectRepo.updateSubject(userId, subjectId, updateData);
    if (!updated) {
        throw new NotFoundError('Subject not found');
    }
    return updated;
};