const PlanEvent = require("./models/PlanEventModel");
const mongoose = require("mongoose");
const { RepositoryError } = require('../errors/AppError');

const findPlanEventForUser = async (userId, planEventId) => {
    if (!mongoose.Types.ObjectId.isValid(planEventId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return PlanEvent.findOne({ _id: planEventId, userId });
}

const findPlanForUser = (userId) => 
    PlanEvent.find({ userId });
    
const addPlan = (PlanEventData) => 
    PlanEvent.insertMany(PlanEventData);

const deletePlanEvent = async (userId, planEventId) => {
    if (!mongoose.Types.ObjectId.isValid(planEventId)) {
        throw new RepositoryError('Invalid ID format');
    }
    return PlanEvent.deleteOne({ _id: planEventId, userId });
};

const deletePlan = async (userId) =>
    PlanEvent.deleteMany({ userId, status: { $ne: 'completed' } });

const updatePlanEvent = async (userId, planEventId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(planEventId)) {
        throw new RepositoryError('Invalid ID format');
    }

    return PlanEvent.findOneAndUpdate(
        { _id: planEventId, userId },
        { $set: updateData },
        { returnDocument: 'after' }
    );
};

module.exports = {
    findPlanEventForUser,
    findPlanForUser,
    addPlan,
    deletePlan,
    deletePlanEvent,
    updatePlanEvent
}