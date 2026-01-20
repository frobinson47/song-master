from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class JobResponse(BaseModel):
    job_id: str
    status: str  # "queued", "running", "completed", "failed", "cancelled"
    websocket_url: str


class ProgressUpdate(BaseModel):
    job_id: str
    step: str  # Current step name
    step_index: int  # 0-8
    total_steps: int  # 9
    message: str  # Human-readable message
    percentage: float  # 0-100
    timestamp: datetime


class SongMetadata(BaseModel):
    title: str
    description: str
    filename: str
    created_at: datetime
    album_art_url: Optional[str]
    suno_styles: List[str]
    user_prompt: str


class SongDetailResponse(BaseModel):
    metadata: SongMetadata
    lyrics: str
    raw_markdown: str


class ProviderConfigResponse(BaseModel):
    current_provider: str
    available_providers: List[str]
    current_model: str
    available_models: Dict[str, List[str]]  # {provider: [models]}
