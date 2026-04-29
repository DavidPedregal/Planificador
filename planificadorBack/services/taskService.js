import * as TaskRepo from '../repository/taskRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { generateRecurringTasks, validateData, getChangedFields } from './helper/taskHelper';
const { randomUUID } = require('crypto');

export const getAllTasks = async (userId) => 
    TaskRepo.getAllTasks(userId);

export const getTaskById = async (userId, taskId) => {
    const task = await TaskRepo.getTaskById(userId, taskId);
    if (!task) {
        throw new NotFoundError("Task not found");
    }
    return task;
};

export const createTasks = async (userId, taskData) => {
    const validation = validateData(taskData);
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

export const updateTask = async (userId, taskId, updateData) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }
    
    const validation = validateData(updateData);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const changedFields = getChangedFields(existingTask, validation.data);
    if (Object.keys(changedFields).length === 0) {
        return existingTask; // No changes, return original task
    }

    return await TaskRepo.updateTask(userId, taskId, changedFields);
};

export const updateforwardTask = async (userId, taskId, updateData) => {
    const validation = validateData(updateData);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const changedFields = getChangedFields(existingTask, validation.data);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const modifiedCount = await TaskRepo.updateForwardTask(userId, taskId, changedFields, existingTask.finishDate);
    return { message: "Task(s) forwarded successfully", modifiedCount };
};

export const updateAllTasksInGroup = async (userId, taskId, updateData) => {
    const validation = validateData(updateData, true);
    if (!validation.valid) {
        throw new ValidationError(validation.error);
    }

    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const changedFields = getChangedFields(existingTask, validation.data);
    if (Object.keys(changedFields).length === 0) {
        return { message: "No changes detected", modifiedCount: 0 };
    }

    const modifiedCount = await TaskRepo.updateAllTasksInGroup(userId, existingTask.groupId, changedFields);
    return { message: "Task(s) updated successfully", modifiedCount };
};

export const toggleTaskCompletion = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const newStatus = !existingTask.completed;
    const updatedTask = await TaskRepo.toggleTaskCompletion(userId, taskId);
    return updatedTask;
};

export const deleteTask = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }
    await TaskRepo.deleteTask(userId, taskId);
};

export const deleteForwardTasks = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const modifiedCount = await TaskRepo.deleteForwardTasks(userId, existingTask.groupId, existingTask.finishDate);
    return { message: "Task(s) deleted successfully", modifiedCount };
};

export const deleteAllTasksInGroup = async (userId, taskId) => {
    const existingTask = await TaskRepo.getTaskById(userId, taskId);
    if (!existingTask) {
        throw new NotFoundError("Task not found");
    }

    const modifiedCount = await TaskRepo.deleteAllTasksInGroup(userId, existingTask.groupId);
    return { message: "Task(s) deleted successfully", modifiedCount };
};