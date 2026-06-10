const SubjectRepo = require('../repository/subjectRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const getSubjectsForUser = async (userId) => {
    return await SubjectRepo.findAllSubjectsForUser(userId);
}

const createSubject = async (userId,subjectData) => {
    if (!subjectData.name || subjectData.name.trim() === '') {
        throw new ValidationError('Subject name is required');
    }
    const existing = await SubjectRepo.findSubjectByNameForUser(userId, subjectData.name);
    if (existing) {
        throw new ValidationError('Subject name must be unique');
    }
    return await SubjectRepo.createSubject({ ...subjectData, userId });
};

const deleteSubject = async (userId, subjectId) => {
    const existing = await SubjectRepo.findSubjectForUser(userId, subjectId);
    if (!existing) {
        throw new NotFoundError('Subject not found');
    }
    await SubjectRepo.deleteSubject(userId, subjectId);
};

const updateSubject = async (userId, subjectId, updateData) => {
    if (!updateData.name || updateData.name.trim() === '') {
        throw new ValidationError('Subject name is required');
    }

    const updated = await SubjectRepo.updateSubject(userId, subjectId, {name: updateData.name});
    if (!updated) {
        throw new NotFoundError('Subject not found');
    }
    return updated;
};

module.exports = {
    getSubjectsForUser,
    createSubject,
    deleteSubject,
    updateSubject
}