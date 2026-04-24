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
    return {"scheduled": []}  # mock for now