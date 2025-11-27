import argparse
import json
import os
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI
from litellm import completion
from tqdm import tqdm

load_dotenv()

# Initialize LLM lazily to avoid key requirements at import time
llm = None


class LiteLLMWrapper:
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

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("Neither OPENROUTER_API_KEY nor OPENAI_API_KEY found in environment variables")

    llm = OpenAI(
        temperature=temperature,
        model=model,
        max_tokens=max_tokens,
        openai_api_key=openai_api_key,
    )
    return llm


def read_styles() -> Dict[str, str]:
    consolidated_path = os.path.join("styles", "styles.json")
    if not os.path.exists(consolidated_path):
        raise FileNotFoundError(f"Missing consolidated styles file at {consolidated_path}")

    with open(consolidated_path, "r") as file:
        raw_styles = json.load(file)

    styles: Dict[str, str] = {}
    for key in ("artist_styles", "core_styles", "example_styles"):
        entries = raw_styles.get(key, [])
        styles[key] = "\n".join(entries) if isinstance(entries, list) else str(entries)

    styles["suno_genres"] = json.dumps(raw_styles.get("suno_genres", {}), separators=(",", ":"))
    return styles


def read_tags() -> Dict[str, str]:
    tags: Dict[str, str] = {}
    for filename in os.listdir("tags"):
        if filename.endswith(".txt"):
            with open(f"tags/{filename}", "r") as file:
                tags[filename] = file.read()
    return tags


def read_persona(persona_name: str) -> str:
    persona_file = f"personas/{persona_name.lower().replace(' ', '_')}.md"
    if not os.path.exists(persona_file):
        return ""

    with open(persona_file, "r") as file:
        content = file.read()
    if "Persona styles" not in content:
        return ""

    start = content.find("Persona styles") + len("Persona styles")
    end = content.find("\n\n", start)
    return content[start:end].strip()

def read_prompt(prompt_name: str) -> str:
    prompt_file = f"prompts/{prompt_name}.txt"
    if not os.path.exists(prompt_file):
        return ""
    with open(prompt_file, "r") as file:
        return file.read()


def get_default_song_params() -> Dict[str, Optional[str]]:
    return {
        "genre": os.getenv("DEFAULT_SONG_GENRE", "rock"),
        "persona": os.getenv("DEFAULT_PERSONA"),
        "tempo": os.getenv("DEFAULT_TEMPO", "120"),
        "key": os.getenv("DEFAULT_KEY", "C"),
        "instruments": os.getenv("DEFAULT_INSTRUMENTS", "guitar,bass,drums"),
        "mood": os.getenv("DEFAULT_MOOD", "happy"),
    }


def parse_persona(user_input: str, cli_persona: Optional[str]) -> Optional[str]:
    if cli_persona:
        return cli_persona
    lowered = user_input.lower()
    if "persona:" not in lowered:
        return None
    start = lowered.find("persona:") + len("persona:")
    end = user_input.find(" ", start)
    return user_input[start:].strip() if end == -1 else user_input[start:end].strip()


def build_prompts():
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

    song_score_prompt = PromptTemplate(
        input_variables=["lyrics"],
        template=f"""{scoring_template}

Lyrics:
{{lyrics}}
""",
    )

    return (
        song_drafter_prompt,
        song_review_prompt,
        song_critic_prompt,
        song_preflight_prompt,
        song_revision_prompt,
        song_score_prompt,
        metadata_prompt,
    )


def enhance_user_input(user_input: str, song_name: Optional[str]) -> str:
    if not song_name:
        return user_input
    return f"Song Title: {song_name}\n\n{user_input}"


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
        parsed = json.loads(raw)
        return float(parsed.get("score", 0))
    except Exception:
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
    get_llm(use_local).invoke(formatted_prompt)


def extract_title(lyrics: str, provided_title: Optional[str]) -> str:
    if provided_title:
        return provided_title
    if "## Song Title" in lyrics:
        start = lyrics.find("## Song Title") + len("## Song Title")
        end = lyrics.find("\n", start)
        return lyrics[start:end].strip()
    return "Unknown Song"


def generate_album_art(title: str, user_input: str) -> str:
    artwork_prompt = (
        f"Album cover for song '{title}' with theme {user_input}. "
        "Do not include any text, lettering, or typography on the image."
    )
    output_file = f"songs/{title.replace(' ', '_')}_cover.jpg"
    os.makedirs("songs", exist_ok=True)
    subprocess.run(["python", "tools/create_album_art.py", artwork_prompt, output_file], check=False)
    return output_file


def parse_persona_styles_list(persona_styles: str):
    if not persona_styles:
        return []
    # Split on commas or newlines; keep concise tokens
    raw_tokens = []
    for line in persona_styles.splitlines():
        raw_tokens.extend([part.strip() for part in line.split(",")])
    return [token for token in raw_tokens if token]


def generate_metadata_summary(prompt_template: PromptTemplate, lyrics: str, user_input: str, default_params: Dict[str, Optional[str]], persona_styles: str, use_local: bool):
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


def save_song(title: str, user_input: str, lyrics: str, default_params: Dict[str, Optional[str]], metadata: Dict[str, object]) -> str:
    description = metadata.get("description", "Short description of the song's theme and style.")
    suno_styles = metadata.get("suno_styles", [default_params.get("genre", "rock")])
    suno_exclude_styles = metadata.get("suno_exclude_styles", [])
    styles_line = ", ".join(suno_styles) if isinstance(suno_styles, list) else str(suno_styles)
    exclude_line = ", ".join(suno_exclude_styles) if isinstance(suno_exclude_styles, list) else str(suno_exclude_styles)
    target_audience = metadata.get("target_audience", "Suggested demographic")
    commercial_potential = metadata.get("commercial_potential", "Assessment")

    final_md = f"""
## {title}
### {description}

## Suno Styles
{styles_line}

## Suno Exclude-styles
{exclude_line if exclude_line else "None"}

## Additional Metadata
- **Emotional Arc**: {default_params['mood']}
- **Target Audience**: {target_audience}
- **Commercial Potential**: {commercial_potential}
- **Technical Notes**: BPM: {default_params['tempo']}, Key: {default_params['key']}, Instruments: {default_params['instruments']}
- **User Prompt**: {user_input}

### Song Lyrics:
{lyrics}
"""
    os.makedirs("songs", exist_ok=True)
    date = datetime.now().strftime("%Y%m%d")
    filename = f"songs/{date}_{title.replace(' ', '_')}.md"
    with open(filename, "w") as file:
        file.write(final_md)
    return filename


@dataclass
class SongResources:
    styles: Dict[str, str]
    tags: Dict[str, str]
    persona_styles: str
    default_params: Dict[str, Optional[str]]


def load_resources(persona_name: Optional[str]) -> SongResources:
    styles = read_styles()
    tags = read_tags()
    persona_styles = read_persona(persona_name) if persona_name else ""
    default_params = get_default_song_params()
    return SongResources(styles=styles, tags=tags, persona_styles=persona_styles, default_params=default_params)


def progress_steps(use_local: bool):
    if use_local:
        return [
            "Parsing user input and persona",
            "Loading resources (styles, tags, personas, defaults)",
            "Generating initial song draft (local LLM)",
            "Reviewing and refining lyrics (3 iterations, local LLM)",
            "Applying critic feedback (local LLM)",
            "Running preflight checks (local LLM)",
            "Generating metadata summary",
            "Skipping album artwork (local mode)",
            "Formatting and saving final song",
        ]
    return [
        "Parsing user input and persona",
        "Loading resources (styles, tags, personas, defaults)",
        "Generating initial song draft",
        "Reviewing and refining lyrics (3 iterations)",
        "Applying critic feedback",
        "Running preflight checks",
        "Generating metadata summary",
        "Generating album artwork",
        "Formatting and saving final song",
    ]


def generate_song(user_input: str, use_local: bool = False, song_name: Optional[str] = None, persona: Optional[str] = None):
    drafter_prompt, review_prompt, critic_prompt, preflight_prompt, revision_prompt, scoring_prompt, metadata_prompt = build_prompts()
    steps = progress_steps(use_local)

    with tqdm(total=len(steps), desc="Creating your song", unit="step") as progress:
        progress.set_description(steps[0])
        time.sleep(0.2)
        persona_name = parse_persona(user_input, persona)
        progress.update(1)

        progress.set_description(steps[1])
        time.sleep(0.2)
        resources = load_resources(persona_name)
        progress.update(1)

        progress.set_description(steps[2])
        enhanced_input = enhance_user_input(user_input, song_name)
        lyrics = draft_song(
            prompt_template=drafter_prompt,
            enhanced_input=enhanced_input,
            styles=resources.styles,
            tags=resources.tags,
            persona_styles=resources.persona_styles,
            default_params=resources.default_params,
            use_local=use_local,
        )
        progress.write("✓ Draft generated.")
        progress.update(1)

        progress.set_description(steps[3])
        lyrics = review_song(review_prompt, revision_prompt, scoring_prompt, lyrics, use_local)
        progress.write("✓ Reviews completed, lyrics revised, and scored")
        progress.update(1)

        progress.set_description(steps[4])
        lyrics = critique_song(critic_prompt, revision_prompt, lyrics, use_local)
        progress.write("✓ Critic feedback applied and lyrics revised")
        progress.update(1)

        progress.set_description(steps[5])
        preflight_song(preflight_prompt, lyrics, resources.styles, resources.tags, use_local)
        progress.write("✓ Preflight checks completed")
        progress.update(1)

        progress.set_description(steps[6])
        metadata = generate_metadata_summary(
            metadata_prompt,
            lyrics,
            user_input,
            resources.default_params,
            resources.persona_styles,
            use_local,
        )
        progress.write("✓ Metadata summary generated")
        progress.update(1)

        progress.set_description(steps[7])
        title = extract_title(lyrics, song_name)
        if use_local:
            progress.write("✓ Album artwork skipped (local mode)")
        else:
            artwork_path = generate_album_art(title, user_input)
            progress.write(f"✓ Album artwork generated: {artwork_path}")
        progress.update(1)

        progress.set_description(steps[8])
        filename = save_song(title, user_input, lyrics, resources.default_params, metadata)
        progress.write(f"✓ Song saved to {filename}")
        progress.update(1)

        progress.set_description("Song creation complete!")
        time.sleep(0.2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a song using AI")
    parser.add_argument("prompt", help="The song description or request")
    parser.add_argument("--local", action="store_true", help="Use local LM Studio LLM and disable image generation")
    parser.add_argument("--name", type=str, default=None, help="Optional song name/title")
    parser.add_argument("--persona", type=str, default=None, help='Specify the persona to use (e.g., "antidote", "bleached_to_perfection")')

    args = parser.parse_args()
    generate_song(args.prompt, args.local, args.name, args.persona)
