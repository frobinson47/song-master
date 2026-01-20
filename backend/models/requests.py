from pydantic import BaseModel, Field
from typing import Optional


class GenerateSongRequest(BaseModel):
    user_input: str = Field(..., min_length=1, description="Song description/prompt")
    song_name: Optional[str] = Field(None, description="Optional song title")
    persona: Optional[str] = Field(None, description="Persona name or file path")
    use_local: bool = Field(False, description="Use local LM Studio model")


class UpdateProviderRequest(BaseModel):
    provider: str = Field(..., description="Provider: anthropic, openai, google")
    api_key: Optional[str] = Field(None, description="API key (optional, if changing)")
    model: Optional[str] = Field(None, description="Model name (optional)")
