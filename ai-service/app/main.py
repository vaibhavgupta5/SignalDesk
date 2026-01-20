from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from app.api import classify, action, contradict, summarize, ask, health
from app.config.logging import configure_logging

configure_logging()

app = FastAPI(title="SignalDesk AI")

# Implement CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/ai")
app.include_router(action.router, prefix="/ai")
app.include_router(contradict.router, prefix="/ai")
app.include_router(summarize.router, prefix="/ai")
app.include_router(ask.router, prefix="/ai")
app.include_router(health.router, prefix="/ai")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
