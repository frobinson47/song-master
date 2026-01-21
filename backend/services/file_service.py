import os
import re
from datetime import datetime
from typing import List, Optional
from backend.models.responses import SongMetadata, SongDetailResponse


class FileService:
    """Service for reading/managing song files."""

    def __init__(self, songs_dir: str = "songs"):
        self.songs_dir = songs_dir

    async def list_songs(
        self, search: Optional[str] = None, persona: Optional[str] = None, limit: int = 50, offset: int = 0
    ) -> List[SongMetadata]:
        """List all songs with optional filtering."""
        songs = []

        if not os.path.exists(self.songs_dir):
            return []

        files = [f for f in os.listdir(self.songs_dir) if f.endswith(".md")]
        files.sort(reverse=True)  # Newest first

        for filename in files[offset:]:
            if len(songs) >= limit:
                break

            metadata = await self._parse_song_metadata(filename)
            if not metadata:
                continue

            # Apply filters
            if search and search.lower() not in metadata.title.lower() and search.lower() not in metadata.description.lower():
                continue

            if persona and persona.lower() not in metadata.user_prompt.lower():
                continue

            songs.append(metadata)

        return songs

    async def get_song_by_id(self, song_id: str) -> Optional[SongDetailResponse]:
        """Get full song details."""
        filepath = os.path.join(self.songs_dir, song_id)

        if not os.path.exists(filepath):
            return None

        with open(filepath, "r", encoding="utf-8", errors='replace') as f:
            content = f.read()

        metadata = await self._parse_song_metadata(song_id)
        if not metadata:
            return None

        # Extract lyrics section
        lyrics_match = re.search(r"### Song Lyrics:\s*\n(.*)", content, re.DOTALL)
        lyrics = lyrics_match.group(1).strip() if lyrics_match else ""

        return SongDetailResponse(metadata=metadata, lyrics=lyrics, raw_markdown=content)

    async def _parse_song_metadata(self, filename: str) -> Optional[SongMetadata]:
        """Parse metadata from song markdown file."""
        filepath = os.path.join(self.songs_dir, filename)

        try:
            with open(filepath, "r", encoding="utf-8", errors='replace') as f:
                content = f.read()

            # Extract title (first ## heading)
            title_match = re.search(r"^## (.+)$", content, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else "Unknown"

            # Extract description (line after title)
            desc_match = re.search(r"^## .+\n### (.+)$", content, re.MULTILINE)
            description = desc_match.group(1).strip() if desc_match else ""

            # Extract Suno Styles
            styles_match = re.search(r"## Suno Styles\s*\n(.+?)(?:\n\n|\n##)", content, re.DOTALL)
            suno_styles = styles_match.group(1).strip().split(", ") if styles_match else []

            # Extract user prompt
            prompt_match = re.search(r"- \*\*User Prompt\*\*: (.+)", content)
            user_prompt = prompt_match.group(1).strip() if prompt_match else ""

            # Parse creation date from filename (YYYYMMDD_Title.md)
            date_match = re.match(r"(\d{8})_", filename)
            created_at = datetime.strptime(date_match.group(1), "%Y%m%d") if date_match else datetime.now()

            # Check for album art
            album_art_filename = filename.replace(".md", "_cover.jpg")
            album_art_path = os.path.join(self.songs_dir, album_art_filename)
            album_art_url = f"/songs/{album_art_filename}" if os.path.exists(album_art_path) else None

            return SongMetadata(
                title=title,
                description=description,
                filename=filename,
                created_at=created_at,
                album_art_url=album_art_url,
                suno_styles=suno_styles,
                user_prompt=user_prompt,
            )

        except Exception as e:
            print(f"Error parsing {filename}: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def delete_song(self, song_id: str) -> bool:
        """Delete a song and its album art."""
        filepath = os.path.join(self.songs_dir, song_id)

        if not os.path.exists(filepath):
            return False

        # Delete markdown file
        os.remove(filepath)

        # Delete album art if exists
        album_art_path = filepath.replace(".md", "_cover.jpg")
        if os.path.exists(album_art_path):
            os.remove(album_art_path)

        return True
