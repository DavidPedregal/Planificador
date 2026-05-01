from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class PlanRequest(BaseModel):
    tasks: list[dict]
    events: list[dict]


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/plan")
async def plan(body: PlanRequest):
    return {
        "scheduled": [
            {
                "taskId": "507f1f77bcf86cd799439012",
                "title": "Matemáticas",
                "start": "2026-05-05T09:00:00Z",
                "end": "2026-05-05T11:00:00Z",
                "scheduledTime": 120
            },
            {
                "taskId": "507f1f77bcf86cd799439013",
                "title": "Historia",
                "start": "2026-05-06T10:00:00Z",
                "end": "2026-05-06T11:00:00Z",
                "scheduledTime": 60
            }
        ]
    }