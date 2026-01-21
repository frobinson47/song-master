from fastapi import APIRouter, HTTPException, Query, Depends
from backend.models.responses import SongMetadata, SongDetailResponse, JobResponse
from backend.services.file_service import FileService
from backend.services.job_manager import JobManager
from backend.services.song_generator import SongGenerator
from typing import List, Optional
import os
import asyncio
from pathlib import Path

router = APIRouter()
file_service = FileService()


def get_job_manager():
    """Dependency injection for job manager."""
    from backend.main import app
    return app.state.job_manager


def get_song_generator():
    """Dependency injection for song generator."""
    from backend.main import app
    return app.state.song_generator


@router.get("/", response_model=List[SongMetadata])
async def list_songs(
    search: Optional[str] = Query(None, description="Search in title/description"),
    persona: Optional[str] = Query(None, description="Filter by persona"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """
    Get list of all generated songs with metadata.
    Supports search and filtering.
    """
    songs = await file_service.list_songs(search=search, persona=persona, limit=limit, offset=offset)
    return songs


@router.get("/{song_id}", response_model=SongDetailResponse)
async def get_song(song_id: str):
    """
    Get full details of a specific song including lyrics.
    song_id is the filename (e.g., "20240115_My_Song.md")
    """
    song = await file_service.get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song


@router.delete("/{song_id}")
async def delete_song(song_id: str):
    """Delete a song file."""
    success = await file_service.delete_song(song_id)
    if not success:
        raise HTTPException(status_code=404, detail="Song not found")
    return {"status": "deleted"}


@router.post("/{song_id}/generate-image-prompt")
async def generate_image_prompt(song_id: str):
    """
    Generate a high-fidelity image blueprint in JSON format for creating album art.
    Returns structured data capturing visual, spatial, semantic, and atmospheric information.
    """
    # Get the song to extract metadata
    song = await file_service.get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Extract first 1000 characters of lyrics
    lyrics_preview = song.lyrics[:1000] if len(song.lyrics) > 1000 else song.lyrics

    # Build the detailed prompt header
    prompt_header = f"""Based on song data, generate a high-fidelity image blueprint in JSON format.

TITLE: {song.metadata.title}
ARTIST: [Your Fictional Artist Name]
SUMMARY: {song.metadata.description}
PRODUCTION STYLE: {', '.join(song.metadata.suno_styles) if song.metadata.suno_styles else 'modern production'}
LYRICS: {lyrics_preview}

This JSON should be structured to capture all interpretable visual, spatial, semantic, and atmospheric data. Output the JSON as a single structured object."""

    # Create the detailed scene blueprint
    scene_blueprint = {
        "spec_version": "scene-blueprint-2.0",
        "global_scene": {
            "environment": {
                "location_type": "mixed",
                "setting_description": f"Album cover scene for {song.metadata.title}. {song.metadata.description}",
                "time_of_day": "contextual",
                "weather": {
                    "condition": "contextual",
                    "intensity": "medium"
                }
            },
            "lighting": {
                "overall_mood": "cinematic"
            },
            "camera": {
                "framing": "medium",
                "angle": "eye_level"
            },
            "style": {
                "render_type": "photoreal"
            }
        },
        "objects": [],
        "people": [],
        "typography": {
            "enabled": True,
            "title": {
                "text": song.metadata.title
            },
            "artist": {
                "text": "[Your Artist Name]"
            }
        }
    }

    # Combine header and blueprint into copy-ready format
    copy_ready_prompt = f"{prompt_header}\n\n{str(scene_blueprint)}"

    return {
        "status": "success",
        "prompt_header": prompt_header,
        "scene_blueprint": scene_blueprint,
        "copy_ready_prompt": copy_ready_prompt
    }


@router.post("/{song_id}/regenerate-lyrics", response_model=JobResponse)
async def regenerate_lyrics(
    song_id: str,
    job_manager: JobManager = Depends(get_job_manager),
    generator: SongGenerator = Depends(get_song_generator),
):
    """
    Regenerate lyrics for an existing song.
    This triggers a new song generation job with the original prompt.
    """
    # Get the song to extract the original user prompt
    song = await file_service.get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    if not song.metadata.user_prompt:
        raise HTTPException(
            status_code=400,
            detail="Cannot regenerate: original prompt not found in song metadata"
        )

    # Import dependencies
    from backend.routers.websocket import manager as ws_manager
    from backend.models.responses import ProgressUpdate
    from datetime import datetime

    # Create a new job
    job_id = job_manager.create_job(
        user_input=song.metadata.user_prompt,
        use_local=False,
        song_name=None,  # Let it generate a new name
        persona=None  # Use original persona if we tracked it
    )

    # Define progress callback
    async def progress_callback(step: str, step_index: int, message: str):
        # Calculate percentage (9 total steps)
        percentage = round((step_index / 9) * 100, 2)

        update = ProgressUpdate(
            job_id=job_id,
            step=step,
            step_index=step_index,
            total_steps=9,
            message=message,
            percentage=percentage,
            timestamp=datetime.utcnow(),
        )
        await ws_manager.send_progress(job_id, update)

    # Start the job
    await job_manager.start_job(job_id, generator, progress_callback)

    # Return job info
    websocket_url = f"ws://localhost:8000/ws/{job_id}"
    return JobResponse(job_id=job_id, status="running", websocket_url=websocket_url)
