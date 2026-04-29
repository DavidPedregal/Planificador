const Task = require("./models/TaskModel");
const mongoose = require("mongoose");
import { RepositoryError } from '../errors/AppError';

export const getAllTasks = async (userId) => 
    Task.find({ userId }).sort({ finishDate: 1 });

export const getTaskById = (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Task.findOne({ _id: taskId, userId });
}

export const createTasks = (tasks) =>
    Task.insertMany(tasks);

export const updateTask = async (userId, taskId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Task.findOneAndUpdate(
        { _id: taskId, userId },
        { $set: updateData },
        { new: true }
    );
};

export const updateForwardTask = async (userId, taskId, updateData, originalFinishDate) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    const updateQuery = groupId
        ? { groupId: groupId, userId, finishDate: { $gte: originalFinishDate } }
        : { _id: taskId, userId };

    const result = await TaskModel.updateMany(updateQuery, { $set: updateData });
    return result;
};

export const updateAllTasksInGroup = async (userId, groupId, updateData) => {
    const updateQuery = groupId
        ? { groupId: groupId, userId }
        : { _id: taskId, userId };

    const result = await TaskModel.updateMany(updateQuery, { $set: updateData });
    return result;
};

export const toggleTaskCompletion = async (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
        throw new RepositoryError('Task not found');
    }

    task.completed = !task.completed;
    return task.save();
};

export const deleteTask = async (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Task.deleteOne({ _id: taskId, userId });
};

export const deleteForwardTasks = async (userId, groupId, finishDate) => {
    const deleteQuery = groupId
        ? { groupId: groupId, userId, finishDate: { $gte: finishDate } }
        : { _id: taskId, userId };

    const result = await TaskModel.deleteMany(deleteQuery);
    return result;
};

export const deleteAllTasksInGroup = async (userId, groupId) => {
    return await TaskModel.deleteMany({ groupId, userId });
};


