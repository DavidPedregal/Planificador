const mongoose = require('mongoose');
const PlanEvent = require('../repository/models/PlanEventModel');

const buildDateMatch = (from, to) => {
    if (!from && !to) return {};
    const range = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    return { start: range };
};

// Shared stages: match completed events → join Task → join Subject
const buildBasePipeline = (userId, from, to) => [
    {
        $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: 'completed',
            ...buildDateMatch(from, to),
        },
    },
    {
        $lookup: {
            from: 'tasks',
            localField: 'taskId',
            foreignField: '_id',
            as: 'task',
        },
    },
    { $unwind: { path: '$task', preserveNullAndEmptyArrays: true } },
    {
        $lookup: {
            from: 'subjects',
            localField: 'task.subjectId',
            foreignField: '_id',
            as: 'subject',
        },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
];

// Returns [{ name, minutes }] — actual time spent per subject
const getSubjectTimeStatistics = async (userId, from, to) => {
    return PlanEvent.aggregate([
        ...buildBasePipeline(userId, from, to),
        {
            $group: {
                _id: { $ifNull: ['$subject._id', null] },
                name: { $first: { $ifNull: ['$subject.name', null] } },
                minutes: { $sum: { $ifNull: ['$userTime', 0] } },
            },
        },
        { $match: { minutes: { $gt: 0 } } },
        { $sort: { minutes: -1 } },
        { $project: { _id: 0, name: 1, minutes: 1 } },
    ]);
};

// Returns [{ name, planned, actual }] — scheduled vs actual time per subject
const getComparisonTimeStatistics = async (userId, from, to) => {
    return PlanEvent.aggregate([
        ...buildBasePipeline(userId, from, to),
        {
            $group: {
                _id: { $ifNull: ['$subject._id', null] },
                name: { $first: { $ifNull: ['$subject.name', null] } },
                planned: { $sum: { $ifNull: ['$scheduledTime', 0] } },
                actual:  { $sum: { $ifNull: ['$userTime', 0] } },
            },
        },
        { $sort: { planned: -1 } },
        { $project: { _id: 0, name: 1, planned: 1, actual: 1 } },
    ]);
};

module.exports = { 
    getSubjectTimeStatistics, 
    getComparisonTimeStatistics 
};
