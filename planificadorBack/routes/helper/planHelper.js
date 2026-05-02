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
        includeReviews: task.includeReviews ?? false
    }));
}

function mapPreviousPlan(previousPlan) {
    return previousPlan.map(block => ({
        taskId: block.taskId.toString(),
        start: block.start.toISOString(),
        end: block.end.toISOString(),
        scheduledTime: block.scheduledTime
    }));
}

module.exports = {
    mapSlots,
    mapTasks,
    mapPreviousPlan

}