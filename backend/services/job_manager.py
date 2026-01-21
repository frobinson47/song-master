import uuid
import asyncio
from typing import Dict, List, Optional, Callable
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job:
    def __init__(
        self,
        job_id: str,
        user_input: str,
        song_name: Optional[str],
        persona: Optional[str],
        use_local: bool,
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
    ):
        self.job_id = job_id
        self.user_input = user_input
        self.song_name = song_name
        self.persona = persona
        self.use_local = use_local
        # HookHouse fields
        self.use_hookhouse = use_hookhouse
        self.blend = blend
        self.mood_style = mood_style
        self.explicitness = explicitness
        self.pov = pov
        self.setting = setting
        self.themes_include = themes_include
        self.themes_avoid = themes_avoid
        self.bpm = bpm
        self.time_signature = time_signature
        self.key = key
        self.groove_texture = groove_texture
        self.choir_call_response = choir_call_response
        # Status fields
        self.status = JobStatus.QUEUED
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.result: Optional[dict] = None
        self.error: Optional[str] = None
        self.task: Optional[asyncio.Task] = None
        self.progress_callbacks: list[Callable] = []


class JobManager:
    """Manages concurrent song generation jobs with cancellation support."""

    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self._lock = asyncio.Lock()

    def create_job(
        self,
        user_input: str,
        song_name: Optional[str],
        persona: Optional[str],
        use_local: bool,
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
    ) -> str:
        """Create a new job and return job_id."""
        job_id = str(uuid.uuid4())
        job = Job(
            job_id,
            user_input,
            song_name,
            persona,
            use_local,
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
        self.jobs[job_id] = job
        return job_id

    def get_job(self, job_id: str) -> Optional[Job]:
        """Get job by ID."""
        return self.jobs.get(job_id)

    async def start_job(self, job_id: str, generator, progress_callback: Callable):
        """Start executing a job."""
        async with self._lock:
            job = self.jobs.get(job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            job.status = JobStatus.RUNNING
            job.started_at = datetime.utcnow()

            # Create task
            job.task = asyncio.create_task(self._run_job(job, generator, progress_callback))

    async def _run_job(self, job: Job, generator, progress_callback: Callable):
        """Execute the actual generation."""
        try:
            result = await generator.generate_async(
                user_input=job.user_input,
                use_local=job.use_local,
                song_name=job.song_name,
                persona=job.persona,
                progress_callback=progress_callback,
                # HookHouse parameters
                use_hookhouse=job.use_hookhouse,
                blend=job.blend,
                mood_style=job.mood_style,
                explicitness=job.explicitness,
                pov=job.pov,
                setting=job.setting,
                themes_include=job.themes_include,
                themes_avoid=job.themes_avoid,
                bpm=job.bpm,
                time_signature=job.time_signature,
                key=job.key,
                groove_texture=job.groove_texture,
                choir_call_response=job.choir_call_response,
            )
            job.result = result
            job.status = JobStatus.COMPLETED
            # Send completion message through WebSocket
            await self._notify_completion(job.job_id, result.get("filename", ""))
        except asyncio.CancelledError:
            job.status = JobStatus.CANCELLED
            job.error = "Job cancelled by user"
            # Send error through WebSocket
            await self._notify_error(job.job_id, job.error)
        except Exception as e:
            job.status = JobStatus.FAILED
            job.error = str(e)
            # Send error through WebSocket
            await self._notify_error(job.job_id, job.error)
        finally:
            job.completed_at = datetime.utcnow()

    async def _notify_completion(self, job_id: str, filename: str):
        """Send completion notification through WebSocket"""
        try:
            from backend.routers.websocket import manager as ws_manager
            from backend.models.responses import ProgressUpdate

            # Send 100% completion message
            completion_update = ProgressUpdate(
                job_id=job_id,
                step="complete",
                step_index=9,
                total_steps=9,
                message=f"Song generation complete!",
                percentage=100.0,
                timestamp=datetime.utcnow(),
            )
            await ws_manager.send_progress(job_id, completion_update)
        except Exception:
            pass  # If WebSocket fails, job still completed successfully

    async def _notify_error(self, job_id: str, error: str):
        """Send error notification through WebSocket"""
        try:
            from backend.routers.websocket import manager as ws_manager
            await ws_manager.send_error(job_id, error)
        except Exception:
            pass  # If WebSocket fails, error is still stored in job.error

    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a running job."""
        job = self.jobs.get(job_id)
        if not job or not job.task:
            return False

        job.task.cancel()
        return True

    async def cleanup(self):
        """Cancel all running jobs on shutdown."""
        for job in self.jobs.values():
            if job.task and not job.task.done():
                job.task.cancel()
