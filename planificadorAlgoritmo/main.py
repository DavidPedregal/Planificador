from fastapi import FastAPI
from models import PlanRequest, PlanResponse
from scheduler import schedule

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/plan", response_model=PlanResponse)
async def plan(body: PlanRequest):
    return schedule(body)