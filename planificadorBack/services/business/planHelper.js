function mapSlots(slots) {
    return slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
    }));
}; 

function mapTasks(tasks) {
    return tasks.map(task => ({
        taskId: task._id.toString(),
        title: task.title,
        estimatedTime: task.estimatedTime,
        finishDate: task.finishDate.toISOString(),
        givenDate: task.givenDate.toISOString(),
        includeReviews: task.includeReviews ?? false,
        isReview: task.isReview ?? false,
    }));
}

function mapPreviousPlan(previousPlan) {
    return previousPlan.map(block => ({
        taskId: block.taskId.toString(),
        start: block.start.toISOString(),
        end: block.end.toISOString(),
        scheduledTime: block.scheduledTime,
        status: block.status
    }));
}

function mapPlanData(planData, calendarId, userId, taskIsReviewMap = {}) {
    return planData.map(block => ({
        userId: userId,
        title: block.title,
        calendarId: calendarId,
        taskId: block.taskId,
        start: new Date(block.start),
        end: new Date(block.end),
        status: 'pending',
        scheduledTime: block.scheduledTime,
        isReview: taskIsReviewMap[block.taskId] ?? false,
    }));
}

module.exports = {
    mapSlots,
    mapTasks,
    mapPreviousPlan,
    mapPlanData
}