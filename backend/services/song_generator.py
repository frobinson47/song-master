import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, List, Optional
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
        # HookHouse parameters
        use_hookhouse: bool = True,
        blend: Optional[List[str]] = None,
        mood_style: str = "dark",
        explicitness: str = "mature",
        pov: Optional[str] = None,
        setting: Optional[str] = None,
        themes_include: Optional[List[str]] = None,
        themes_avoid: Optional[List[str]] = None,
        bpm: Optional[int] = None,
        time_signature: Optional[str] = None,
        key: Optional[str] = None,
        groove_texture: Optional[str] = None,
        choir_call_response: bool = False,
    ) -> dict:
        """
        Run generate_song() in a thread pool with progress callbacks.

        Args:
            user_input: Song prompt
            use_local: Whether to use local LLM
            song_name: Optional song title
            persona: Optional persona
            progress_callback: Function called with (step_name, step_index, message)
            use_hookhouse: Use HookHouse workflow (default: True)
            blend: Musical blend (2-3 styles)
            mood_style: Mood style (dark or clean)
            explicitness: Explicitness (explicit or mature)
            pov: Point of view
            setting: Setting/time period/location
            themes_include: Themes to include
            themes_avoid: Themes to avoid
            bpm: Beats per minute
            time_signature: Time signature
            key: Musical key
            groove_texture: Groove/texture description
            choir_call_response: Include choir/call-response

        Returns:
            dict with keys: filename, lyrics, metadata, album_art, and HookHouse fields if enabled
        """
        loop = asyncio.get_event_loop()

        # Create a synchronous wrapper for the async callback
        # This allows the synchronous generate_song() to call it from a worker thread
        def sync_progress_callback(step: str, step_index: int, message: str):
            # Schedule the async callback on the event loop from the worker thread
            future = asyncio.run_coroutine_threadsafe(
                progress_callback(step, step_index, message), loop
            )
            # Don't wait for completion to avoid blocking the generation

        # Wrap the synchronous function
        def _run_generation():
            return generate_song(
                user_input=user_input,
                use_local=use_local,
                song_name=song_name,
                persona=persona,
                progress_callback=sync_progress_callback,
                use_hookhouse=use_hookhouse,
                blend=blend,
                mood_style=mood_style,
                explicitness=explicitness,
                pov=pov,
                setting=setting,
                themes_include=themes_include,
                themes_avoid=themes_avoid,
                bpm=bpm,
                time_signature=time_signature,
                key=key,
                groove_texture=groove_texture,
                choir_call_response=choir_call_response,
            )

        # Run in executor to avoid blocking event loop
        result = await loop.run_in_executor(self.executor, _run_generation)
        return result

    def shutdown(self):
        """Shutdown the thread pool."""
        self.executor.shutdown(wait=True)
