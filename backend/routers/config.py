from fastapi import APIRouter, HTTPException
from backend.models.requests import UpdateProviderRequest
from backend.models.responses import ProviderConfigResponse
import os
from dotenv import load_dotenv, set_key

router = APIRouter()


@router.get("/", response_model=ProviderConfigResponse)
async def get_config():
    """Get current provider configuration."""
    load_dotenv()

    current_provider = os.getenv("LLM_PROVIDER", "anthropic")

    # Map of available models per provider
    available_models = {
        "anthropic": [
            "claude-haiku-4-5-20251001",
            "claude-sonnet-4-5-20250929",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
        ],
        "openai": ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "o1", "o3-mini"],
        "google": ["gemini/gemini-2.5-flash", "gemini/gemini-2.0-flash-exp", "gemini/gemini-1.5-pro", "gemini/gemini-1.5-flash"],
    }

    # Get current model based on provider
    current_model = ""
    if current_provider == "anthropic":
        current_model = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
    elif current_provider == "openai":
        current_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    elif current_provider == "google":
        current_model = os.getenv("GOOGLE_MODEL", "gemini/gemini-2.5-flash")

    return ProviderConfigResponse(
        current_provider=current_provider,
        available_providers=["anthropic", "openai", "google"],
        current_model=current_model,
        available_models=available_models,
    )


@router.put("/")
async def update_config(request: UpdateProviderRequest):
    """
    Update provider configuration.
    Modifies .env file to persist changes.
    """
    env_file = ".env"

    # Update LLM_PROVIDER
    set_key(env_file, "LLM_PROVIDER", request.provider)

    # Update model if provided
    if request.model:
        if request.provider == "anthropic":
            set_key(env_file, "ANTHROPIC_MODEL", request.model)
        elif request.provider == "openai":
            set_key(env_file, "OPENAI_MODEL", request.model)
        elif request.provider == "google":
            set_key(env_file, "GOOGLE_MODEL", request.model)

    # Update API key if provided
    if request.api_key:
        if request.provider == "anthropic":
            set_key(env_file, "ANTHROPIC_API_KEY", request.api_key)
        elif request.provider == "openai":
            set_key(env_file, "OPENAI_API_KEY", request.api_key)
        elif request.provider == "google":
            set_key(env_file, "GOOGLE_API_KEY", request.api_key)

    # Reload environment variables
    load_dotenv(override=True)

    # Reset LLM singleton to force re-initialization
    import ai_functions

    ai_functions.llm = None

    return {"status": "updated", "provider": request.provider}
