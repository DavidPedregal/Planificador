const Task = require("./models/TaskModel");
const mongoose = require("mongoose");
const { RepositoryError } = require('../errors/AppError');

const getAllTasks = async (userId) => 
    Task.find({ userId }).sort({ finishDate: 1 });

const getTaskById = async (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return Task.findOne({ _id: taskId, userId });
}

const getTasksToPlan = async (userId) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return Task.find({ userId, finishDate: { $gte: startOfToday }, plannable: true, completed: false });
};

const createTasks = (tasks) =>
    Task.insertMany(tasks);

const updateTask = async (userId, taskId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Task.findOneAndUpdate(
        { _id: taskId, userId },
        { $set: updateData },
        { returnDocument: 'after' }
    );
};

const updateForwardTask = async (userId, taskId, groupId, updateData, originalFinishDate) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    const updateQuery = groupId
        ? { groupId: groupId, userId, finishDate: { $gte: originalFinishDate } }
        : { _id: taskId, userId };

    const result = await Task.updateMany(updateQuery, { $set: updateData });
    return result;
};

const updateAllTasksInGroup = async (userId, taskId, groupId, updateData) => {
    const updateQuery = groupId
        ? { groupId: groupId, userId }
        : { _id: taskId, userId };

    const result = await Task.updateMany(updateQuery, { $set: updateData });
    return result;
};

const toggleTaskCompletion = async (userId, taskId) => {
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

const deleteTask = async (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return Task.deleteOne({ _id: taskId, userId });
};

const deleteForwardTasks = async (userId, taskId, groupId, finishDate) => {
    const deleteQuery = groupId
        ? { groupId: groupId, userId, finishDate: { $gte: finishDate } }
        : { _id: taskId, userId };

    const result = await Task.deleteMany(deleteQuery);
    return result;
};

const deleteAllTasksInGroup = async (userId, groupId) => {
    return await Task.deleteMany({ groupId, userId });
};

module.exports = {
    getAllTasks,
    getTaskById,
    getTasksToPlan,
    createTasks,
    updateTask,
    updateForwardTask,
    updateAllTasksInGroup,
    deleteTask,
    deleteForwardTasks,
    deleteAllTasksInGroup,
    toggleTaskCompletion
}

