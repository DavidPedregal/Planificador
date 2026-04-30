const Subject = require("./models/SubjectModel");
const mongoose = require("mongoose");
const { RepositoryError } = require('../errors/AppError');

const findSubjectForUser = async (userId, subjectId) => {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Subject.findOne({ _id: subjectId, userId });
}

const findAllSubjectsForUser = (userId) => 
    Subject.find({ userId });
    
const createSubject = (subjectData) => 
    new Subject(subjectData).save();

const deleteSubject = async (userId, subjectId) => {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Subject.deleteOne({ _id: subjectId, userId });
};

const updateSubject = async (userId, subjectId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Subject.findOneAndUpdate(
        { _id: subjectId, userId },
        { $set: updateData },
        { returnDocument: 'after' }
    );
};

module.exports = {
    findSubjectForUser,
    findAllSubjectsForUser,
    createSubject,
    deleteSubject,
    updateSubject
}