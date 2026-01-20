from fastapi import APIRouter, HTTPException, Query
from backend.models.responses import SongMetadata, SongDetailResponse
from backend.services.file_service import FileService
from typing import List, Optional

router = APIRouter()
file_service = FileService()


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
