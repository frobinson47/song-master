from fastapi import APIRouter, Depends, HTTPException
from backend.models.requests import GenerateSongRequest
from backend.models.responses import JobResponse, ProgressUpdate
from backend.services.song_generator import SongGenerator
from backend.services.job_manager import JobManager
from backend.routers.websocket import manager as ws_manager
from datetime import datetime

router = APIRouter()

# Singleton instances (will be initialized in main.py)
song_generator = None
job_manager_instance = None


def get_job_manager():
    """Dependency injection for job manager."""
    from backend.main import app

    return app.state.job_manager


def get_song_generator():
    """Dependency injection for song generator."""
    from backend.main import app

    return app.state.song_generator


@router.post("/", response_model=JobResponse)
async def generate_song_endpoint(
    request: GenerateSongRequest,
    job_manager: JobManager = Depends(get_job_manager),
    generator: SongGenerator = Depends(get_song_generator),
):
    """
    Start a new song generation job.
    Returns job_id and websocket URL for progress tracking.
    """
    # Create job
    job_id = job_manager.create_job(
        user_input=request.user_input,
        song_name=request.song_name,
        persona=request.persona,
        use_local=request.use_local,
        # HookHouse parameters
        use_hookhouse=request.use_hookhouse,
        blend=request.blend,
        mood_style=request.mood_style,
        explicitness=request.explicitness,
        pov=request.pov,
        setting=request.setting,
        themes_include=request.themes_include,
        themes_avoid=request.themes_avoid,
        bpm=request.bpm,
        time_signature=request.time_signature,
        key=request.key,
        groove_texture=request.groove_texture,
        choir_call_response=request.choir_call_response,
    )

    # Define progress callback that sends to WebSocket
    # HookHouse has 8 steps, original has 9 (album art vs. image prompt)
    total_steps = 8 if request.use_hookhouse else 9

    async def progress_callback(step: str, step_index: int, message: str):
        update = ProgressUpdate(
            job_id=job_id,
            step=step,
            step_index=step_index,
            total_steps=total_steps,
            message=message,
            percentage=round((step_index / total_steps) * 100, 2),
            timestamp=datetime.utcnow(),
        )
        await ws_manager.send_progress(job_id, update)

    # Start job asynchronously
    await job_manager.start_job(job_id, generator, progress_callback)

    return JobResponse(job_id=job_id, status="running", websocket_url=f"ws://localhost:8000/ws/{job_id}")


@router.get("/{job_id}/status")
async def get_job_status(job_id: str, job_manager: JobManager = Depends(get_job_manager)):
    """Get current status of a generation job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.job_id,
        "status": job.status,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
        "result": job.result,
        "error": job.error,
    }


@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str, job_manager: JobManager = Depends(get_job_manager)):
    """Cancel a running generation job."""
    success = await job_manager.cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Job not found or already completed")
    return {"status": "cancelled"}
