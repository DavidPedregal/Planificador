const Subject = require("./models/SubjectModel");
const mongoose = require("mongoose");
import { RepositoryError } from '../errors/AppError';

export const findSubjectForUser = (userId, subjectId) => {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Subject.findOne({ _id: subjectId, userId });
}

export const findAllSubjectsForUser = (userId) => 
    Subject.find({ userId });
    
export const createSubject = (subjectData) => 
    new Subject(subjectData).save();

export const deleteSubject = async (userId, subjectId) => {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Subject.deleteOne({ _id: subjectId, userId });
};

export const updateSubject = async (userId, subjectId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Subject.findOneAndUpdate(
        { _id: subjectId, userId },
        { $set: updateData },
        { new: true }
    );
};