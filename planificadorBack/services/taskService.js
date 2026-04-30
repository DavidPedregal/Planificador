const TaskRepo = require('../repository/taskRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const { generateRecurringTasks, validateData, getChangedFields } = require('./helper/taskHelper');
const { randomUUID } = require('crypto');

const getAllTasks = async (userId) => 
    TaskRepo.getAllTasks(userId);

const getTaskById = async (userId, taskId) => {
    const task = await TaskRepo.getTaskById(userId, taskId);
    if (!task) {
        throw new NotFoundError("Task not found");
    }
    return task;
};

const createTasks = async (userId, taskData) => {
    const validation = validateData(taskData, true);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const baseTask = validation.data;
    baseTask.userId = userId;
    baseTask.subjectId = taskData.subjectId || null;

    const tasksToCreate = generateRecurringTasks(baseTask);
    if (tasksToCreate.length > 1) {
        const groupId = randomUUID();
        tasksToCreate.forEach(task => {
            task.groupId = groupId;
        });
    }

    return await TaskRepo.createTasks(tasksToCreate);
};

const updateTask = async (userId, taskId, updateData) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }
    
    const validation = validateData(updateData);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const changedFields = getChangedFields(validation.data, existingTask);
    if (Object.keys(changedFields).length === 0) {
        return existingTask; // No changes, return original task
    }

    return await TaskRepo.updateTask(userId, taskId, changedFields);
};

const updateForwardTask = async (userId, taskId, updateData) => {
    const validation = validateData(updateData);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const changedFields = getChangedFields(validation.data, existingTask);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const result = await TaskRepo.updateForwardTask(userId, taskId, existingTask.groupId, changedFields, existingTask.finishDate);
    return { message: "Task(s) updated successfully", modifiedCount: result.modifiedCount };
};

const updateAllTasksInGroup = async (userId, taskId, updateData) => {
    const validation = validateData(updateData, true);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const changedFields = getChangedFields(validation.data, existingTask);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const result = await TaskRepo.updateAllTasksInGroup(userId, taskId, existingTask.groupId, changedFields);
    return { message: "Task(s) updated successfully", modifiedCount: result.modifiedCount };
};

const toggleTaskCompletion = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const newStatus = !existingTask.completed;
    const updatedTask = await TaskRepo.toggleTaskCompletion(userId, taskId);
    return updatedTask;
};

const deleteTask = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }
    await TaskRepo.deleteTask(userId, taskId);
};

const deleteForwardTasks = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const result = await TaskRepo.deleteForwardTasks(userId, taskId, existingTask.groupId, existingTask.finishDate);
    return { message: "Task(s) deleted successfully", modifiedCount: result.deletedCount };
};

const deleteAllTasksInGroup = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const result = await TaskRepo.deleteAllTasksInGroup(userId, existingTask.groupId);
    return { message: "Task(s) deleted successfully", modifiedCount: result.deletedCount };
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTasks,
    updateTask,
    updateForwardTask,
    updateAllTasksInGroup,
    toggleTaskCompletion,
    deleteTask,
    deleteForwardTasks,
    deleteAllTasksInGroup
}