from fastapi import FastAPI
import uvicorn
from app.api import classify, extract, contradict, summarize, health
from app.config.logging import configure_logging

configure_logging()

app = FastAPI(title="SignalDesk AI")

app.include_router(classify.router, prefix="/ai")
app.include_router(extract.router, prefix="/ai")
app.include_router(contradict.router, prefix="/ai")
app.include_router(summarize.router, prefix="/ai")
app.include_router(health.router, prefix="/ai")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
