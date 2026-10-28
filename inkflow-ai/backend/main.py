import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api import generate, rag, memory, skills, projects, files
from config import settings

app = FastAPI(
    title="InkFlow AI API Backend",
    description="3-Column AI Content Service with File & Folder Upload Manager",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(files.router)
app.include_router(generate.router)
app.include_router(rag.router)
app.include_router(memory.router)
app.include_router(skills.router)

@app.on_event("startup")
def startup_event():
    print(f"🚀 Initializing SQLite database at: {settings.sqlite_db_path}")
    init_db()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "InkFlow AI 2.1",
        "data_dir": settings.DATA_DIR,
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY)
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
