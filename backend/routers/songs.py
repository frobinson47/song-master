from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
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
    Uses AI to analyze the song and create a complete, detailed scene blueprint.
    """
    # Get the song to extract metadata
    song = await file_service.get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Extract first 1000 characters of lyrics
    lyrics_preview = song.lyrics[:1000] if len(song.lyrics) > 1000 else song.lyrics

    # Import AI functions
    from ai_functions import get_llm
    import json
    import re

    # Build the prompt for the AI to generate the complete blueprint
    ai_prompt = f"""Based on the following song data, generate a high-fidelity image blueprint in JSON format for album cover artwork.

TITLE: {song.metadata.title}
ARTIST: [Your Fictional Artist Name]
SUMMARY: {song.metadata.description}
PRODUCTION STYLE: {', '.join(song.metadata.suno_styles) if song.metadata.suno_styles else 'modern production'}
LYRICS: {lyrics_preview}

Analyze the song's theme, mood, imagery, and style. Then output a complete JSON scene blueprint with ALL fields filled in thoughtfully based on the song's content. Be specific and creative.

Output ONLY the JSON object in this exact format:

{{
  "spec_version": "scene-blueprint-2.0",
  "global_scene": {{
    "environment": {{
      "location_type": "[indoor|outdoor|vehicle|mixed - choose based on song theme]",
      "setting_description": "[Detailed 2-3 sentence description of the visual scene that captures the song's essence]",
      "time_of_day": "[dawn|morning|noon|afternoon|dusk|night|timeless - choose based on mood]",
      "weather": {{
        "condition": "[clear|overcast|rain|fog|snow|storm|dust|indoors - choose based on song mood]",
        "intensity": "[none|light|medium|heavy]"
      }}
    }},
    "lighting": {{
      "overall_mood": "[naturalistic|cinematic|noir|high_key|low_key - choose based on song style]"
    }},
    "camera": {{
      "framing": "[wide|medium|close|macro - choose what fits the album cover aesthetic]",
      "angle": "[eye_level|low_angle|high_angle|overhead|dutch - choose for dramatic effect]"
    }},
    "style": {{
      "render_type": "[photoreal|illustration|graphic|mixed - choose based on genre]"
    }}
  }},
  "objects": [
    {{
      "name": "[specific object name]",
      "description": "[detailed visual description]",
      "position": "[foreground|midground|background]",
      "importance": "[primary|secondary|tertiary]"
    }}
  ],
  "people": [
    {{
      "role": "[main subject|supporting character|crowd]",
      "description": "[detailed appearance, clothing, pose, expression]",
      "position": "[specific position in frame]",
      "action": "[what they're doing]"
    }}
  ],
  "typography": {{
    "enabled": true,
    "title": {{
      "text": "{song.metadata.title}"
    }},
    "artist": {{
      "text": "[Your Artist Name]"
    }}
  }}
}}

Ensure the JSON is complete, valid, and captures all visual, spatial, semantic, and atmospheric elements that would make a compelling album cover for this song."""

    try:
        # Get LLM and generate the blueprint
        llm = get_llm(use_local=False)
        ai_response = llm.invoke(ai_prompt)

        print(f"AI Response received (first 500 chars): {str(ai_response)[:500]}")

        # Convert response to string if it's not already
        response_text = str(ai_response)

        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            print(f"Extracted JSON from code block")
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                print(f"Extracted JSON directly")
            else:
                # Last resort: try the whole response
                json_str = response_text.strip()
                print(f"Using entire response as JSON")

        if not json_str or json_str == '':
            raise ValueError("No JSON content found in AI response")

        # Parse the JSON
        print(f"Attempting to parse JSON (first 200 chars): {json_str[:200]}")
        scene_blueprint = json.loads(json_str)

        # Format JSON for output (only JSON, no header)
        copy_ready_prompt = json.dumps(scene_blueprint, indent=2)

        # Save the blueprint to the markdown file
        try:
            filepath = os.path.join("songs", song_id)
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8", errors='replace') as f:
                    content = f.read()

                # Remove existing image blueprint section if present
                content = re.sub(r'\n## Image Blueprint\n.*?(?=\n##|\Z)', '', content, flags=re.DOTALL)

                # Append the new blueprint section
                blueprint_section = f"\n\n## Image Blueprint\n\n{copy_ready_prompt}\n"

                # Write back to file
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content + blueprint_section)

                print(f"Saved image blueprint to {song_id}")
        except Exception as save_error:
            print(f"Warning: Failed to save blueprint to file: {save_error}")
            # Don't fail the request if saving fails

        return {
            "status": "success",
            "scene_blueprint": scene_blueprint,
            "copy_ready_prompt": copy_ready_prompt,
            "saved_to_file": True
        }

    except Exception as e:
        error_msg = str(e)
        print(f"Error generating image blueprint: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate image blueprint: {error_msg}")


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


@router.post("/{song_id}/upload-art")
async def upload_album_art(song_id: str, file: UploadFile = File(...)):
    """
    Upload custom album art for a song.
    Accepts an image file and saves it as the song's album art.
    """
    import shutil

    # Verify song exists
    song = await file_service.get_song_by_id(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Determine file extension
    ext = '.jpg'
    if 'png' in file.content_type:
        ext = '.png'
    elif 'jpeg' in file.content_type or 'jpg' in file.content_type:
        ext = '.jpg'
    elif 'webp' in file.content_type:
        ext = '.webp'

    # Create filename: remove .md extension and add _cover.jpg
    base_name = song_id.replace('.md', '')
    art_filename = f"{base_name}_cover{ext}"
    art_path = os.path.join("songs", art_filename)

    # Save the uploaded file
    try:
        with open(art_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    # Return the new album art URL
    return {
        "status": "success",
        "album_art_url": f"/songs/{art_filename}",
        "message": "Album art uploaded successfully"
    }
