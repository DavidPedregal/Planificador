const SubjectRepo = require('../repository/subjectRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const getSubjectsForUser = async (userId) => {
    return await SubjectRepo.findAllSubjectsForUser(userId);
}

const createSubject = async (userId,subjectData) => {
    if (typeof subjectData.name !== 'string') {
        throw new ValidationError('Subject name is required');
    }
    const normalizedName = subjectData.name.trim();
    if (normalizedName === '') {
        throw new ValidationError('Subject name is required');
    }
    const existing = await SubjectRepo.findSubjectByNameForUser(userId, normalizedName);
    if (existing) {
        throw new ValidationError('Subject name must be unique');
    }
    return await SubjectRepo.createSubject({ name: normalizedName, userId });
};

const deleteSubject = async (userId, subjectId) => {
    const existing = await SubjectRepo.findSubjectForUser(userId, subjectId);
    if (!existing) {
        throw new NotFoundError('Subject not found');
    }
    await SubjectRepo.deleteSubject(userId, subjectId);
};

const updateSubject = async (userId, subjectId, updateData) => {
    if (typeof updateData.name !== 'string') {
        throw new ValidationError('Subject name is required');
    }
    const normalizedName = updateData.name.trim();
    if (normalizedName === '') {
        throw new ValidationError('Subject name is required');
    }
    const existing = await SubjectRepo.findSubjectByNameForUser(userId, normalizedName);
    if (existing && existing._id.toString() !== subjectId) {
        throw new ValidationError('Subject name must be unique');
    }
    const updated = await SubjectRepo.updateSubject(userId, subjectId, {name: normalizedName});
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