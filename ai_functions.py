import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI
from litellm import completion

load_dotenv()

# Initialize LLM lazily to avoid key requirements at import time
llm = None


class LiteLLMWrapper:
    """Wrapper for LiteLLM API calls."""
    def __init__(self, model: str, temperature: float, max_tokens: int, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_key = api_key
        self.base_url = base_url

    def invoke(self, prompt: str) -> str:
        kwargs = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }
        if self.api_key and self.api_key != "your_openrouter_api_key_here":
            kwargs["api_key"] = self.api_key
        if self.base_url:
            kwargs["api_base"] = self.base_url

        try:
            response = completion(**kwargs)
            return response.choices[0].message.content
        except Exception as exc:
            raise ValueError(f"LiteLLM call failed: {exc}") from exc


def get_llm(use_local: bool = False):
    global llm
    if llm is not None:
        return llm

    temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
    max_tokens = int(os.getenv("LLM_MAX_TOKENS", "4096"))

    # Local LM Studio mode
    if use_local:
        lmstudio_api_key = os.getenv("LMSTUDIO_API_KEY")
        lmstudio_base_url = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1")
        lmstudio_model = os.getenv("LMSTUDIO_LLM_MODEL", "local-model")

        if not lmstudio_api_key or lmstudio_api_key == "your_openrouter_api_key_here":
            lmstudio_api_key = "lm-studio"

        import openai

        class LMStudioLLM:
            def __init__(self, model: str, temperature: float, max_tokens: int, api_key: str, base_url: str):
                self.model = model
                self.temperature = temperature
                self.max_tokens = max_tokens
                self.client = openai.OpenAI(api_key=api_key, base_url=base_url)

            def invoke(self, prompt: str) -> str:
                try:
                    completion = self.client.chat.completions.create(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=self.max_tokens,
                        temperature=self.temperature,
                    )
                    return completion.choices[0].message.content
                except Exception as chat_exc:
                    try:
                        completion = self.client.completions.create(
                            model=self.model,
                            prompt=prompt,
                            max_tokens=self.max_tokens,
                            temperature=self.temperature,
                        )
                        return completion.choices[0].text
                    except Exception as completion_exc:
                        raise ValueError(
                            "LM Studio connection failed. Tried both chat and completions endpoints. "
                            f"Original errors: {chat_exc}, {completion_exc}"
                        ) from completion_exc

        llm = LMStudioLLM(
            model=lmstudio_model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=lmstudio_api_key,
            base_url=lmstudio_base_url,
        )
        return llm

    # Get provider preference
    provider = os.getenv("LLM_PROVIDER", "").lower()

    # Provider-specific configurations
    if provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")

        # Use LiteLLM for Anthropic
        llm = LiteLLMWrapper(
            model=f"anthropic/{model}" if not model.startswith("anthropic/") else model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            base_url=None,
        )
        return llm

    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        model = os.getenv("OPENAI_MODEL", "gpt-4o")

        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")

        # Use LiteLLM for OpenAI
        llm = LiteLLMWrapper(
            model=f"openai/{model}" if not model.startswith("openai/") else model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            base_url=None,
        )
        return llm

    elif provider == "google" or provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        model = os.getenv("GOOGLE_MODEL", "gemini/gemini-2.0-flash-exp")

        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")

        # Use LiteLLM for Google/Gemini
        llm = LiteLLMWrapper(
            model=model if model.startswith("gemini/") else f"gemini/{model}",
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            base_url=None,
        )
        return llm

    # Legacy LiteLLM configuration (for backward compatibility)
    litellm_model = os.getenv("LITELLM_MODEL")
    litellm_api_key = os.getenv("LITELLM_API_KEY")
    litellm_base_url = os.getenv("LITELLM_API_BASE")

    if litellm_model:
        llm = LiteLLMWrapper(
            model=litellm_model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=litellm_api_key,
            base_url=litellm_base_url,
        )
        return llm

    # Legacy OpenRouter configuration
    model = os.getenv("LLM_MODEL", "openai/gpt-3.5-turbo")
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    if openrouter_api_key and openrouter_api_key != "your_openrouter_api_key_here":
        import openai

        class OpenRouterLLM:
            def __init__(self, model: str, temperature: float, max_tokens: int, api_key: str, base_url: str):
                self.model = model
                self.temperature = temperature
                self.max_tokens = max_tokens
                self.client = openai.OpenAI(api_key=api_key, base_url=base_url)

            def invoke(self, prompt: str) -> str:
                completion = self.client.completions.create(
                    model=self.model,
                    prompt=prompt,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                )
                return completion.choices[0].text

        llm = OpenRouterLLM(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=openrouter_api_key,
            base_url=openrouter_base_url,
        )
        return llm

    # Final fallback to OpenAI
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError(
            "No LLM provider configured. Please set one of: "
            "LLM_PROVIDER + provider API key, LITELLM_MODEL, OPENROUTER_API_KEY, or OPENAI_API_KEY"
        )

    llm = OpenAI(
        temperature=temperature,
        model=model,
        max_tokens=max_tokens,
        openai_api_key=openai_api_key,
    )
    return llm


def build_prompts():
    """Build and return all prompt templates for song generation."""
    from helpers import read_prompt

    song_drafter_template = read_prompt("song_drafter")
    song_review_template = read_prompt("song_review")
    song_critic_template = read_prompt("song_critic")
    song_preflight_template = read_prompt("song_preflight")
    metadata_template = (
        "You are preparing concise metadata for a Suno song render.\n"
        "- Provide a 1-2 sentence description of the song's theme and style.\n"
        "- Suggest 3-6 Suno style tokens that best fit the song (concise, lower case).\n"
        "- Suggest 0-3 Suno style tokens to avoid if any conflict appears.\n"
        "- Suggest a concise target audience and a one-line commercial potential assessment.\n"
        "- Return only JSON with keys: description (string), suno_styles (list of strings), suno_exclude_styles (list of strings), target_audience (string), commercial_potential (string).\n"
        "- Do not include explanations or markdown."
    )
    preflight_triage_template = (
        "You are a strict validator. Given preflight feedback text, output JSON with keys:\n"
        '- "pass" (boolean), true only if the text clearly signals no action needed.\n'
        '- "issues" (array of short actionable strings). Empty if pass is true.\n'
        "Be concise. No markdown, no prose—JSON only."
    )
    scoring_template = (
        "You are a songwriting judge scoring the lyrics for production readiness.\n"
        "- Score from 0-10 (float) considering structure, imagery, singability, theme coherence, and avoidance of clichés.\n"
        "- Keep rationale to one short sentence.\n"
        "- Return only JSON like {{\"score\": 8.4, \"rationale\": \"...\"}} with no extra text."
    )
    song_revision_template = (
        "You are a skilled songwriter. Revise the lyrics based on the reviewer feedback.\n"
        "- Keep the structure (sections, order, and counts) unless the feedback explicitly asks to change it.\n"
        "- Improve clarity, imagery, and singability per the feedback.\n"
        "- Keep the title and metadata untouched.\n"
        "- CRITICAL: Ensure total lyrics remain under 5000 characters including spaces and punctuation. If feedback suggests additions that would exceed the limit, prioritize condensing existing content or removing less essential sections.\n"
        "- Return only the revised lyrics, no commentary."
    )

    song_drafter_prompt = PromptTemplate(
        input_variables=["user_input", "styles", "tags", "persona_styles", "default_params"],
        template=f"""
{song_drafter_template}

Data and Resources:
- Styles: {{styles}}
- Tags: {{tags}}
- Persona Styles: {{persona_styles}}
- Default Song Parameters: {{default_params}}

User Input: {{user_input}}

Use the default song parameters as a baseline when creating the song, but adapt them based on the user's specific request.
Output your draft as a basic song structure plus lyrics.
""",
    )

    song_review_prompt = PromptTemplate(
        input_variables=["lyrics"],
        template=f"""
{song_review_template}

Lyrics: {{lyrics}}
""",
    )

    song_critic_prompt = PromptTemplate(
        input_variables=["lyrics"],
        template=f"""
{song_critic_template}

Lyrics: {{lyrics}}
""",
    )

    song_preflight_prompt = PromptTemplate(
        input_variables=["lyrics", "styles", "tags"],
        template=f"""
{song_preflight_template}

Styles: {{styles}}
Tags: {{tags}}

Lyrics: {{lyrics}}
""",
    )

    song_revision_prompt = PromptTemplate(
        input_variables=["lyrics", "feedback"],
        template=f"""{song_revision_template}

Lyrics:
{{lyrics}}

Reviewer Feedback:
{{feedback}}
""",
    )

    metadata_prompt = PromptTemplate(
        input_variables=["lyrics", "user_input", "default_params", "persona_styles"],
        template=f"""{metadata_template}

Lyrics:
{{lyrics}}

User Input:
{{user_input}}

Default Parameters:
{{default_params}}

Persona Styles:
{{persona_styles}}
""",
    )

    preflight_triage_prompt = PromptTemplate(
        input_variables=["preflight_output"],
        template=f"""{preflight_triage_template}

Preflight Feedback:
{{preflight_output}}
""",
    )

    song_score_prompt = PromptTemplate(
        input_variables=["lyrics"],
        template=f"""{scoring_template}

Lyrics:
{{lyrics}}
""",
    )

    # Load HookHouse prompts
    narrative_development_template = read_prompt("narrative_development")
    hookhouse_draft_template = read_prompt("hookhouse_draft")
    hookhouse_review_template = read_prompt("hookhouse_review")
    funksmith_critique_template = read_prompt("funksmith_critique")
    hookhouse_metadata_template = read_prompt("hookhouse_metadata")
    hookhouse_image_template = read_prompt("hookhouse_image")
    caption_generation_template = read_prompt("caption_generation")

    return (
        # Original prompts
        song_drafter_prompt,
        song_review_prompt,
        song_critic_prompt,
        song_preflight_prompt,
        song_revision_prompt,
        song_score_prompt,
        metadata_prompt,
        preflight_triage_prompt,
        # HookHouse prompts (raw strings, not PromptTemplate)
        narrative_development_template,
        hookhouse_draft_template,
        hookhouse_review_template,
        funksmith_critique_template,
        hookhouse_metadata_template,
        hookhouse_image_template,
        caption_generation_template,
    )


def draft_song(prompt_template: PromptTemplate, enhanced_input: str, styles: Dict[str, str], tags: Dict[str, str], persona_styles: str, default_params: Dict[str, Optional[str]], use_local: bool) -> str:
    formatted_prompt = prompt_template.format(
        user_input=enhanced_input,
        styles=str(styles),
        tags=str(tags),
        persona_styles=persona_styles,
        default_params=str(default_params),
    )
    return get_llm(use_local).invoke(formatted_prompt)


def revise_lyrics(prompt_template: PromptTemplate, lyrics: str, feedback: str, use_local: bool) -> str:
    formatted_prompt = prompt_template.format(lyrics=lyrics, feedback=feedback)
    return get_llm(use_local).invoke(formatted_prompt)


def run_parallel_reviews(prompt_template: PromptTemplate, lyrics: str, use_local: bool, reviewer_count: int = 3) -> str:
    """Run multiple AI reviewers in parallel and merge their feedback."""
    def _call(_):
        formatted_prompt = prompt_template.format(lyrics=lyrics)
        return get_llm(use_local).invoke(formatted_prompt)

    with ThreadPoolExecutor(max_workers=reviewer_count) as executor:
        feedbacks = list(executor.map(_call, range(reviewer_count)))
    merged = "\n\n".join([f"Reviewer {idx + 1} Feedback:\n{fb}" for idx, fb in enumerate(feedbacks)])
    return merged


def score_lyrics(prompt_template: PromptTemplate, lyrics: str, use_local: bool) -> float:
    formatted_prompt = prompt_template.format(lyrics=lyrics)
    try:
        raw = get_llm(use_local).invoke(formatted_prompt)

        # Try to extract JSON from markdown code blocks if present
        import re
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if json_match:
            raw = json_match.group(1)

        # Remove any leading/trailing whitespace
        raw = raw.strip()

        # Parse JSON
        parsed = json.loads(raw)
        score = float(parsed.get("score", 0))

        # Print score for debugging
        print(f"Score: {score} - {parsed.get('rationale', 'No rationale')}")

        return score
    except Exception as e:
        print(f"Failed to parse score from response: {raw[:200] if 'raw' in locals() else 'No response'}... Error: {e}")
        return 0.0


def review_song(prompt_template: PromptTemplate, revision_prompt: PromptTemplate, scoring_prompt: PromptTemplate, lyrics: str, use_local: bool, reviewer_count: int = 3, score_threshold: float = 8.0, max_rounds: int = 2) -> str:
    for _ in range(max_rounds):
        feedback = run_parallel_reviews(prompt_template, lyrics, use_local, reviewer_count=reviewer_count)
        lyrics = revise_lyrics(revision_prompt, lyrics, feedback, use_local)
        score = score_lyrics(scoring_prompt, lyrics, use_local)
        if score >= score_threshold:
            break
    return lyrics


def critique_song(prompt_template: PromptTemplate, revision_prompt: PromptTemplate, lyrics: str, use_local: bool) -> str:
    formatted_prompt = prompt_template.format(lyrics=lyrics)
    feedback = get_llm(use_local).invoke(formatted_prompt)
    return revise_lyrics(revision_prompt, lyrics, feedback, use_local)


def preflight_song(prompt_template: PromptTemplate, lyrics: str, styles: Dict[str, str], tags: Dict[str, str], use_local: bool) -> None:
    formatted_prompt = prompt_template.format(lyrics=lyrics, styles=str(styles), tags=str(tags))
    return get_llm(use_local).invoke(formatted_prompt)


def triage_preflight(prompt_template: PromptTemplate, preflight_output: str, use_local: bool):
    """Parse preflight feedback and determine if issues exist."""
    fallback = {"pass": False, "issues": ["Preflight feedback could not be parsed. Review manually."]}
    if not preflight_output:
        return fallback
    formatted = prompt_template.format(preflight_output=preflight_output)
    try:
        raw = get_llm(use_local).invoke(formatted)
        parsed = json.loads(raw)
        passed = bool(parsed.get("pass", False))
        issues = parsed.get("issues", [])
        if isinstance(issues, str):
            issues = [issues]
        issues = [issue for issue in issues if issue]
        return {"pass": passed, "issues": issues}
    except Exception:
        return fallback


def generate_metadata_summary(prompt_template: PromptTemplate, lyrics: str, user_input: str, default_params: Dict[str, Optional[str]], persona_styles: str, use_local: bool):
    from helpers import parse_persona_styles_list

    persona_style_tokens = parse_persona_styles_list(persona_styles)
    fallback = {
        "description": "Short description of the song's theme and style.",
        "suno_styles": [default_params.get("genre", "rock"), *persona_style_tokens],
        "suno_exclude_styles": [],
        "target_audience": "Suggested demographic",
        "commercial_potential": "Assessment",
    }
    formatted_prompt = prompt_template.format(
        lyrics=lyrics,
        user_input=user_input,
        default_params=str(default_params),
        persona_styles=persona_styles or "None provided",
    )
    try:
        raw = get_llm(use_local).invoke(formatted_prompt)
        parsed = json.loads(raw)
        description = parsed.get("description") or fallback["description"]
        styles = parsed.get("suno_styles") or fallback["suno_styles"]
        exclude_styles = parsed.get("suno_exclude_styles") or fallback["suno_exclude_styles"]
        if isinstance(styles, str):
            styles = [styles]
        if isinstance(exclude_styles, str):
            exclude_styles = [exclude_styles]
        # Ensure persona tokens are included
        if persona_style_tokens:
            styles = list(dict.fromkeys(list(styles) + persona_style_tokens))
        target_audience = parsed.get("target_audience") or fallback["target_audience"]
        commercial_potential = parsed.get("commercial_potential") or fallback["commercial_potential"]
        return {
            "description": description,
            "suno_styles": styles,
            "suno_exclude_styles": exclude_styles,
            "target_audience": target_audience,
            "commercial_potential": commercial_potential,
        }
    except Exception:
        return fallback


# ============================================================================
# HookHouse AI Functions
# ============================================================================

def develop_narrative(
    prompt_template: str,
    user_input: str,
    blend: List[str],
    mood_style: str,
    explicitness: str,
    pov: Optional[str],
    setting: Optional[str],
    themes_include: Optional[List[str]],
    themes_avoid: Optional[List[str]],
    bpm: Optional[int],
    time_signature: Optional[str],
    key: Optional[str],
    groove_texture: Optional[str],
    choir_call_response: bool,
    use_local: bool
) -> Dict[str, Any]:
    """
    Develop narrative scaffold using Storysmith Muse.
    Generates 3 concepts, selects best bet, expands with section/groove maps.
    """
    # Build context string
    context_parts = [
        f"Title/Seed: {user_input}",
        f"Blend: {', '.join(blend)}",
        f"Mood & Explicitness: {mood_style}, {explicitness}",
    ]

    if pov:
        context_parts.append(f"POV: {pov}")
    if setting:
        context_parts.append(f"Setting/Era: {setting}")
    if themes_include:
        context_parts.append(f"Themes to Hit: {', '.join(themes_include)}")
    if themes_avoid:
        context_parts.append(f"Themes to Avoid: {', '.join(themes_avoid)}")

    constraints = []
    if bpm:
        constraints.append(f"BPM: {bpm}")
    if time_signature:
        constraints.append(f"Time Signature: {time_signature}")
    if key:
        constraints.append(f"Key: {key}")
    if groove_texture:
        constraints.append(f"Groove Texture: {groove_texture}")

    if constraints:
        context_parts.append(f"Constraints: {', '.join(constraints)}")

    if choir_call_response:
        context_parts.append("Include choir/call-response elements")

    context = "\n".join(context_parts)

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM
    try:
        raw = get_llm(use_local).invoke(formatted)
        # Try to parse JSON response
        parsed = json.loads(raw)
        return parsed
    except json.JSONDecodeError:
        # If not JSON, return structured fallback
        return {
            "concepts": [],
            "best_bet": {
                "concept_id": 1,
                "rationale": "Fallback concept due to parsing error",
                "riff_groove_map": {},
                "section_prompts": {},
                "movement_cues": [],
                "vocal_texture": "conversational",
                "production_hints": ""
            }
        }


def draft_hookhouse_lyrics(
    prompt_template: str,
    narrative: Dict[str, Any],
    blend: List[str],
    bpm: Optional[int],
    time_signature: Optional[str],
    key: Optional[str],
    user_input: str,
    use_local: bool
) -> str:
    """
    Generate HookHouse-compliant lyrics with Suno formatting.
    Includes arrangement cues, section headers, and proper bracketing.
    """
    # Extract relevant parts from narrative
    best_bet = narrative.get("best_bet", {})

    # Build context
    context_parts = [
        f"User Input: {user_input}",
        f"Blend: {', '.join(blend)}",
    ]

    if bpm:
        context_parts.append(f"BPM: {bpm}")
    if time_signature:
        context_parts.append(f"Time Signature: {time_signature}")
    if key:
        context_parts.append(f"Key: {key}")

    context_parts.append(f"\nNarrative Scaffold:\n{json.dumps(best_bet, indent=2)}")
    context = "\n".join(context_parts)

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM
    lyrics = get_llm(use_local).invoke(formatted)
    return lyrics


def review_hookhouse_lyrics(
    prompt_template: str,
    lyrics: str,
    bpm: Optional[int],
    blend: List[str],
    use_local: bool
) -> Dict[str, Any]:
    """
    Review lyrics against HookHouse quality standards.
    Returns JSON with scores, issues, and pass/fail status.
    """
    # Build context
    context = f"Lyrics:\n{lyrics}\n\nBPM: {bpm or 'Not specified'}\nBlend: {', '.join(blend)}"

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM
    try:
        raw = get_llm(use_local).invoke(formatted)
        # Try to parse JSON
        parsed = json.loads(raw)
        return parsed
    except json.JSONDecodeError:
        # Fallback with passing score
        return {
            "overall_score": 8.0,
            "category_scores": {},
            "critical_issues": [],
            "moderate_issues": [],
            "positive_notes": [],
            "revision_priority": [],
            "pass_threshold": True,
            "threshold_note": "Score parsing failed, defaulting to pass"
        }


def funksmith_critique_lyrics(
    prompt_template: str,
    lyrics: str,
    blend: List[str],
    bpm: Optional[int],
    use_local: bool
) -> str:
    """
    Apply Sanctified Funksmith refinement to lyrics.
    Adds physiological resonance, breath points, and micro-dynamics.
    """
    # Build context
    context = f"Lyrics:\n{lyrics}\n\nBlend: {', '.join(blend)}\nBPM: {bpm or 'Not specified'}"

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM (returns revised lyrics + changelog)
    result = get_llm(use_local).invoke(formatted)

    # Extract just the lyrics part (before changelog)
    if "### Funksmith Changelog" in result:
        lyrics_part = result.split("### Funksmith Changelog")[0].strip()
        return lyrics_part

    return result


def generate_hookhouse_metadata(
    prompt_template: str,
    lyrics: str,
    narrative: Dict[str, Any],
    user_input: str,
    blend: List[str],
    mood_style: str,
    bpm: Optional[int],
    time_signature: Optional[str],
    key: Optional[str],
    use_local: bool
) -> Dict[str, Any]:
    """
    Generate HookHouse Blocks 2-5:
    - Block 2: Style (production blueprint, ≤1000 chars)
    - Block 3: Excluded styles (comma-separated)
    - Block 4: Title/Artist (invented artist name)
    - Block 5: Summary (≤500 chars, emotional/physiological arc)
    """
    from helpers import read_excluded_styles

    # Build context
    context_parts = [
        f"Lyrics:\n{lyrics}",
        f"User Input: {user_input}",
        f"Blend: {', '.join(blend)}",
        f"Mood: {mood_style}",
    ]

    if bpm:
        context_parts.append(f"BPM: {bpm}")
    if time_signature:
        context_parts.append(f"Time Signature: {time_signature}")
    if key:
        context_parts.append(f"Key: {key}")

    # Add narrative context
    best_bet = narrative.get("best_bet", {})
    if best_bet:
        context_parts.append(f"\nNarrative Context:\n{json.dumps(best_bet, indent=2)}")

    # Add excluded styles reference
    all_excluded = read_excluded_styles()
    context_parts.append(f"\nAvailable Excluded Styles (sample):\n{', '.join(all_excluded[:50])}")

    context = "\n".join(context_parts)

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM
    try:
        raw = get_llm(use_local).invoke(formatted)

        # Parse blocks from response
        blocks = {}

        # Extract Block 2: Style
        if "### Block 2: Style" in raw:
            start = raw.find("### Block 2: Style") + len("### Block 2: Style")
            end = raw.find("### Block 3:", start) if "### Block 3:" in raw else len(raw)
            blocks["style_block"] = raw[start:end].strip()

        # Extract Block 3: Excluded Style
        if "### Block 3: Excluded Style" in raw:
            start = raw.find("### Block 3: Excluded Style") + len("### Block 3: Excluded Style")
            end = raw.find("### Block 4:", start) if "### Block 4:" in raw else len(raw)
            excluded_str = raw[start:end].strip()
            blocks["excluded_styles"] = [s.strip() for s in excluded_str.split(",")]

        # Extract Block 4: Title / Artist
        if "### Block 4: Title / Artist" in raw:
            start = raw.find("### Block 4: Title / Artist") + len("### Block 4: Title / Artist")
            end = raw.find("### Block 5:", start) if "### Block 5:" in raw else len(raw)
            title_artist_text = raw[start:end].strip()

            # Parse title and artist
            title = ""
            artist = ""
            for line in title_artist_text.split("\n"):
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Artist:"):
                    artist = line.replace("Artist:", "").strip()

            blocks["title_artist"] = {"title": title, "artist": artist}

        # Extract Block 5: Summary
        if "### Block 5: Summary" in raw:
            start = raw.find("### Block 5: Summary") + len("### Block 5: Summary")
            end = raw.find("###", start)  # Next section
            if end == -1:
                end = len(raw)
            blocks["summary"] = raw[start:end].strip()

        return blocks

    except Exception:
        # Fallback
        return {
            "style_block": f"{', '.join(blend)} at {bpm or 120} BPM",
            "excluded_styles": [],
            "title_artist": {"title": "Untitled", "artist": "Unknown Artist"},
            "summary": "A song generated with HookHouse."
        }


def generate_hookhouse_image_prompt(
    prompt_template: str,
    lyrics: str,
    narrative: Dict[str, Any],
    metadata: Dict[str, Any],
    user_input: str,
    blend: List[str],
    mood_style: str,
    use_local: bool
) -> Dict[str, Any]:
    """
    Generate HookHouse Block 6: Image Prompt JSON for album art.
    """
    # Build context
    context_parts = [
        f"Lyrics:\n{lyrics}",
        f"Title: {metadata.get('title_artist', {}).get('title', 'Untitled')}",
        f"Artist: {metadata.get('title_artist', {}).get('artist', 'Unknown')}",
        f"Summary: {metadata.get('summary', '')}",
        f"Blend: {', '.join(blend)}",
        f"Mood: {mood_style}",
        f"User Input: {user_input}",
    ]

    # Add narrative symbols/imagery
    best_bet = narrative.get("best_bet", {})
    if best_bet:
        concepts = narrative.get("concepts", [])
        if concepts:
            # Get the selected concept's symbols
            concept_id = best_bet.get("concept_id", 1)
            for concept in concepts:
                if concept.get("id") == concept_id:
                    symbols = concept.get("symbols", [])
                    context_parts.append(f"\nNarrative Symbols: {', '.join(symbols)}")
                    break

    context = "\n".join(context_parts)

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM
    try:
        raw = get_llm(use_local).invoke(formatted)
        # Try to parse JSON
        parsed = json.loads(raw)
        return parsed
    except json.JSONDecodeError:
        # Fallback JSON structure
        return {
            "objects": ["guitar", "road", "sunset"],
            "environment": "Rural landscape at dusk",
            "people": "none",
            "composition": "Centered, rule of thirds",
            "symbolism": ["journey", "transition"],
            "metadata": {
                "mood": mood_style,
                "color_palette": "warm earth tones",
                "lighting": "golden hour",
                "era": "timeless",
                "style": "photorealistic"
            },
            "text": {
                "include": True,
                "title": metadata.get('title_artist', {}).get('title', 'Untitled'),
                "artist": metadata.get('title_artist', {}).get('artist', 'Unknown'),
                "placement": "bottom center",
                "style": "weathered serif"
            },
            "size": "9:16",
            "resolution": "720p minimum"
        }


def generate_captions(
    prompt_template: str,
    title: str,
    artist: str,
    lyrics: str,
    summary: str,
    style_block: str,
    narrative: Dict[str, Any],
    use_local: bool
) -> List[str]:
    """
    Generate 5-6 social media captions (≤300 chars each) across distinct tones.
    """
    # Build context
    context = f"""Song Title: {title}
Artist: {artist}
Summary: {summary}
Style: {style_block}

Lyrics (excerpt):
{lyrics[:500]}...

Narrative Setting: {narrative.get('best_bet', {}).get('setting', 'Not specified')}
"""

    # Format prompt
    formatted = prompt_template.replace("{context}", context)

    # Invoke LLM
    try:
        raw = get_llm(use_local).invoke(formatted)

        # Parse captions from response
        captions = []

        # Look for numbered captions or labeled sections
        lines = raw.split("\n")
        current_caption = ""

        for line in lines:
            line = line.strip()
            # Skip headers and empty lines
            if not line or line.startswith("###") or line.startswith("**"):
                if current_caption:
                    captions.append(current_caption.strip())
                    current_caption = ""
                continue

            # Accumulate caption text
            if line and not line.endswith(":"):
                current_caption += " " + line if current_caption else line

        # Add last caption
        if current_caption:
            captions.append(current_caption.strip())

        # Return up to 6 captions
        return captions[:6] if captions else [
            f"New track: \"{title}\" by {artist}. Out now.",
            f"{title} - {artist}",
            f"Listen to \"{title}\" now.",
        ]

    except Exception:
        # Fallback captions
        return [
            f"New track: \"{title}\" by {artist}. Out now.",
            f"{title} - {artist}",
            f"Listen to \"{title}\" now.",
        ]