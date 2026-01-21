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


@router.post("/{song_id}/regenerate-art")
async def regenerate_art(song_id: str):
    """
    Regenerate album art for an existing song.
    """
    # Get the song to extract metadata
    song = await file_service.get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Import the album art generation function
    from tools.create_album_art import generate_album_art_image

    # Prepare the album art prompt from song metadata
    # Use the full user prompt for better image quality (matches original generation)
    album_art_prompt = (
        f"Album cover for song '{song.metadata.title}' with theme {song.metadata.user_prompt}. "
        "Do not include any text, lettering, or typography on the image."
    )

    # Generate output filename (match the naming convention used in song generation)
    songs_dir = Path("songs")
    base_name = song_id.replace(".md", "")
    art_filename = f"{base_name}_cover.jpg"
    art_filepath = songs_dir / art_filename

    try:
        # Run the generation in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            generate_album_art_image,
            album_art_prompt,
            str(art_filepath)
        )

        # Update the song markdown file with new album art path
        await file_service.update_album_art_path(song_id, f"/songs/{art_filename}")

        return {"status": "success", "message": "Album art regenerated successfully", "art_url": f"/songs/{art_filename}"}

    except Exception as e:
        error_msg = str(e)
        print(f"Error regenerating album art: {error_msg}")

        # Check for common errors and provide helpful messages
        if "401" in error_msg or "Incorrect API key" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid OpenAI API key. Please update your OPENAI_API_KEY in the .env file.")
        elif "rate_limit" in error_msg.lower():
            raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded. Please try again in a moment.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to generate album art: {error_msg}")


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
