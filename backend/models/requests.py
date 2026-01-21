from pydantic import BaseModel, Field
from typing import List, Optional


class GenerateSongRequest(BaseModel):
    # Original parameters
    user_input: str = Field(..., min_length=1, description="Song description/prompt")
    song_name: Optional[str] = Field(None, description="Optional song title")
    persona: Optional[str] = Field(None, description="Persona name or file path")
    use_local: bool = Field(False, description="Use local LM Studio model")

    # HookHouse parameters
    use_hookhouse: bool = Field(True, description="Use HookHouse workflow (default: True)")
    blend: Optional[List[str]] = Field(None, description="Musical blend (2-3 styles)")
    mood_style: str = Field("dark", description="Mood style: dark or clean")
    explicitness: str = Field("mature", description="Explicitness: explicit or mature")
    pov: Optional[str] = Field(None, description="Point of view (e.g., first-person)")
    setting: Optional[str] = Field(None, description="Setting/time period/location")
    themes_include: Optional[List[str]] = Field(None, description="Themes to include")
    themes_avoid: Optional[List[str]] = Field(None, description="Themes to avoid")
    bpm: Optional[int] = Field(None, ge=40, le=200, description="Beats per minute (40-200)")
    time_signature: Optional[str] = Field(None, description="Time signature (e.g., 4/4)")
    key: Optional[str] = Field(None, description="Musical key (e.g., C, Am)")
    groove_texture: Optional[str] = Field(None, description="Groove/texture description")
    choir_call_response: bool = Field(False, description="Include choir/call-response elements")


class UpdateProviderRequest(BaseModel):
    provider: str = Field(..., description="Provider: anthropic, openai, google")
    api_key: Optional[str] = Field(None, description="API key (optional, if changing)")
    model: Optional[str] = Field(None, description="Model name (optional)")
