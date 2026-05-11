const PlanRepo = require('../repository/planRepository');
const EventService = require('../services/eventService.js');
const TaskService = require('../services/taskService.js');
const CalendarService = require('../services/calendarService.js');
const { mapPreviousPlan, mapSlots, mapTasks, mapPlanData } = require('./business/planHelper.js');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const getPlanForUser = async (userId) => {
    return await PlanRepo.findPlanForUser(userId);
}

const getPlanEventForUser = async (userId, planEventId) => {
    const planEvent = await PlanRepo.findPlanEventForUser(userId, planEventId);
    if (!planEvent) {
        throw new NotFoundError('Plan event not found');
    }
    return planEvent;
};

const getDataToPlan = async (userId) => {
    const previousPlan = await getPlanForUser(userId);
    const plannableSlots = await EventService.getPlannableEventsForUser(userId);
    const tasks = await TaskService.getTasksToPlan(userId);

    const mappedPreviousPlan = mapPreviousPlan(previousPlan);
    const mappedPlannableSlots = mapSlots(plannableSlots);
    const mappedTasks = mapTasks(tasks);

    return { mappedPreviousPlan, mappedPlannableSlots, mappedTasks };
};

const addPlan = async (planEvents, userId) => {
    if (!planEvents) { return; }
    const systemCalendars = await CalendarService.getSystemCalendarsForUser(userId);
    const plannedCalendar = systemCalendars.find(cal => cal.name === "Planned");

    if (!plannedCalendar) {
        throw new NotFoundError('Planned calendar not found for user');
    }
    
    const mappedPlanData = mapPlanData(planEvents, plannedCalendar._id, userId);
    return await PlanRepo.addPlan(mappedPlanData);
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
    getPlanEventForUser,
    getDataToPlan,
    addPlan,
    deletePlan,
    deletePlanEvent,
    updatePlanEvent
}