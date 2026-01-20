import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional
import sys
import os

# Add parent directory to path to import song_master
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from song_master import generate_song


class SongGenerator:
    """Async wrapper for synchronous LangGraph song generation."""

    def __init__(self, max_workers: int = 3):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    async def generate_async(
        self,
        user_input: str,
        use_local: bool,
        song_name: Optional[str],
        persona: Optional[str],
        progress_callback: Callable[[str, int, str], None],
    ) -> dict:
        """
        Run generate_song() in a thread pool with progress callbacks.

        Args:
            user_input: Song prompt
            use_local: Whether to use local LLM
            song_name: Optional song title
            persona: Optional persona
            progress_callback: Function called with (step_name, step_index, message)

        Returns:
            dict with keys: filename, lyrics, metadata, album_art
        """
        loop = asyncio.get_event_loop()

        # Wrap the synchronous function
        def _run_generation():
            return generate_song(user_input, use_local, song_name, persona, progress_callback)

        # Run in executor to avoid blocking event loop
        result = await loop.run_in_executor(self.executor, _run_generation)
        return result

    def shutdown(self):
        """Shutdown the thread pool."""
        self.executor.shutdown(wait=True)
