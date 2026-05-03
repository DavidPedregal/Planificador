from pydantic import BaseModel

class Task(BaseModel):
    taskId: str
    title: str
    estimatedTime: int  # minutos
    finishDate: str
    givenDate: str
    includeReviews: bool = False

class PlannableSlot(BaseModel):
    start: str
    end: str

class PlannedBlock(BaseModel):
    taskId: str
    start: str
    end: str
    scheduledTime: int  # minutos
    status: str = 'pending'  # pending, completed, uncompleted

class PlanRequest(BaseModel):
    tasks: list[Task]
    plannableSlots: list[PlannableSlot]
    previousPlan: list[PlannedBlock] = []

class ScheduledBlock(BaseModel):
    taskId: str
    title: str
    start: str
    end: str
    scheduledTime: int  # minutos

class Warning(BaseModel):
    taskId: str
    title: str
    message: str

class PlanResponse(BaseModel):
    scheduled: list[ScheduledBlock]
    warnings: list[Warning]