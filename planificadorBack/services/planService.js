const PlanRepo = require('../repository/planRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const getPlanForUser = async (userId) => {
    return await PlanRepo.findPlanForUser(userId);
}

const addPlan = async (planEvents) => {
    return await PlanRepo.addPlan(planEvents);
};

const deletePlan = async (userId) =>
    PlanRepo.deletePlan(userId);

const deletePlanEvent = async (userId, planEventId) => {
    const existing = await PlanRepo.findPlanEventForUser(userId, planEventId);
    if (!existing) {
        throw new NotFoundError('Plan event not found')
    }
    await PlanRepo.deletePlanEvent(userId, planEventId);
}

const updatePlanEvent = async (userId, planEventId, updateData) => {
    if (!updateData.status) {
        throw new ValidationError('Plan event status is required');
    }

    const statusOptions = ['uncompleted','completed','pending'];
    let isStatusValid = false;
    for (const option of statusOptions) {
        if (updateData.status === option)
            isStatusValid = true;
    }

    if (!isStatusValid) {
        throw new ValidationError('Plan event status is invalid');
    }

    if (updateData.status === 'completed' && (!updateData.userTime || updateData.userTime <= 0) ) {
        throw new ValidationError('User time is required when completing a plan event');
    }

    const updated = await PlanRepo.updatePlanEvent(userId, planEventId, {status: updateData.status, userTime: updateData.userTime});
    if (!updated) {
        throw new NotFoundError('Plan not found');
    }
    return updated;
};

module.exports = {
    getPlanForUser,
    addPlan,
    deletePlan,
    deletePlanEvent,
    updatePlanEvent
}