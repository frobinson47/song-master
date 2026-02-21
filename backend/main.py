from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from backend.routers import generation, songs, config, websocket, personas
from backend.services.job_manager import JobManager
from backend.services.song_generator import SongGenerator


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    app.state.job_manager = JobManager()
    app.state.song_generator = SongGenerator(max_workers=int(os.getenv("MAX_CONCURRENT_JOBS", "3")))
    yield
    # Shutdown: Cancel all running jobs
    await app.state.job_manager.cleanup()
    app.state.song_generator.shutdown()


app = FastAPI(
    title="Song Master API",
    description="AI-powered song generation with LangGraph",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend access
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://songmaster.fmr.local").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (songs directory for markdown/album art)
if os.path.exists("songs"):
    app.mount("/songs", StaticFiles(directory="songs"), name="songs")

# Register routers
app.include_router(generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(songs.router, prefix="/api/songs", tags=["songs"])
app.include_router(config.router, prefix="/api/config", tags=["config"])
app.include_router(personas.router, prefix="/api/personas", tags=["personas"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "Song Master API - Visit /docs for API documentation"}
