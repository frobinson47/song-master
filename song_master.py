"""
Song Master Script

This script generates songs using AI-powered agents in a structured workflow.
It supports both local and remote LLM usage, with options for personas, album art generation, and more.
"""

import argparse
import os
import sys
from typing import Callable, List, Optional

from dotenv import load_dotenv
from langgraph.graph import END, StateGraph
from tqdm import tqdm

from ai_functions import (
    build_prompts,
    critique_song,
    draft_song,
    generate_metadata_summary,
    preflight_song,
    revise_lyrics,
    run_parallel_reviews,
    score_lyrics,
    triage_preflight,
)
from helpers import (
    SongResources,
    SongState,
    enhance_user_input,
    extract_song_details_for_art,
    extract_title,
    generate_album_art,
    load_prompt_from_file,
    load_resources,
    parse_persona,
    save_song,
)

load_dotenv()


def generate_song(
    user_input: str,
    use_local: bool = False,
    song_name: Optional[str] = None,
    persona: Optional[str] = None,
    progress_callback: Optional[Callable[[str, int, str], None]] = None,
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
    choir_call_response: bool = False
):
    (
        drafter_prompt,
        review_prompt,
        critic_prompt,
        preflight_prompt,
        revision_prompt,
        scoring_prompt,
        metadata_prompt,
        preflight_triage_prompt,
        # HookHouse prompts
        narrative_prompt,
        hookhouse_draft_prompt,
        hookhouse_review_prompt,
        funksmith_prompt,
        hookhouse_metadata_prompt,
        hookhouse_image_prompt,
        caption_prompt,
    ) = build_prompts()

    persona_name = parse_persona(user_input, persona)
    resources = load_resources(persona_name)
    max_rounds = int(os.getenv("REVIEW_MAX_ROUNDS", "3"))
    score_threshold = float(os.getenv("REVIEW_SCORE_THRESHOLD", "8.5"))  # Higher threshold for HookHouse

    # Default blend if not provided (based on persona or generic)
    if not blend:
        if persona_name == "antidote":
            blend = ["Southern Rock", "Americana"]
        elif persona_name == "bleached_to_perfection":
            blend = ["Gospel", "Soul"]
        elif persona_name == "anagram":
            blend = ["Americana", "Singer-Songwriter"]
        else:
            blend = ["Rock", "Americana"]  # Default blend

    initial_state: SongState = {
        # Original fields
        "user_input": user_input,
        "song_name": song_name,
        "persona": persona,
        "persona_name": persona_name,
        "use_local": use_local,
        "resources": resources,
        "lyrics": "",
        "feedback": "",
        "score": 0.0,
        "round": 0,
        "max_rounds": max_rounds,
        "score_threshold": score_threshold,
        "preflight_passed": False,
        "preflight_issues": [],
        "metadata": {},
        "filename": None,
        "album_art": None,
        # HookHouse fields
        "blend": blend,
        "mood_style": mood_style,
        "explicitness": explicitness,
        "pov": pov,
        "setting": setting,
        "themes_include": themes_include or [],
        "themes_avoid": themes_avoid or [],
        "bpm": bpm,
        "time_signature": time_signature,
        "key": key,
        "groove_texture": groove_texture,
        "choir_call_response": choir_call_response,
        "narrative": None,
        "section_map": None,
        "groove_map": None,
        "review_issues": None,
        "style_block": None,
        "excluded_styles": None,
        "title_artist": None,
        "summary": None,
        "image_prompt_json": None,
        "captions": None,
    }

    def draft_node(state: SongState):
        """Generate initial song draft using AI."""
        enhanced_input = enhance_user_input(state["user_input"], state.get("song_name"))
        lyrics = draft_song(
            prompt_template=drafter_prompt,
            enhanced_input=enhanced_input,
            styles=state["resources"].styles,
            tags=state["resources"].tags,
            persona_styles=state["resources"].persona_styles,
            default_params=state["resources"].default_params,
            use_local=state["use_local"],
        )
        tqdm.write("[OK] Draft generated.")
        if progress_callback:
            progress_callback("draft", 2, "Draft generated")
        return {"lyrics": lyrics}

    def review_node(state: SongState):
        feedback = run_parallel_reviews(review_prompt, state["lyrics"], state["use_local"])
        revised_lyrics = revise_lyrics(revision_prompt, state["lyrics"], feedback, state["use_local"])
        score = score_lyrics(scoring_prompt, revised_lyrics, state["use_local"])
        tqdm.write(f"[OK] Review round {state['round'] + 1}: score {score:.2f}")
        if progress_callback:
            progress_callback("review", 3, f"Review round {state['round'] + 1}: score {score:.2f}")
        return {"lyrics": revised_lyrics, "feedback": feedback, "score": score, "round": state["round"] + 1}

    def review_router(state: SongState):
        """Decide whether to continue reviewing or proceed to critic based on score and rounds."""
        if state["score"] < state["score_threshold"] and state["round"] < state["max_rounds"]:
            return "keep_reviewing"
        return "go_critic"

    def critic_node(state: SongState):
        revised = critique_song(critic_prompt, revision_prompt, state["lyrics"], state["use_local"])
        tqdm.write("[OK] Critic feedback applied.")
        if progress_callback:
            progress_callback("critic", 4, "Critic feedback applied")
        return {"lyrics": revised}

    def preflight_node(state: SongState):
        raw = preflight_song(preflight_prompt, state["lyrics"], state["resources"].styles, state["resources"].tags, state["use_local"])
        triaged = triage_preflight(preflight_triage_prompt, raw, state["use_local"])
        passed = bool(triaged.get("pass", False))
        issues = triaged.get("issues", [])
        if passed:
            tqdm.write("[OK] Preflight passed.")
        else:
            tqdm.write(f"[!] Preflight flagged {len(issues)} issue(s).")
        if progress_callback:
            progress_callback("preflight", 5, "Preflight checks completed")
        return {"preflight_passed": passed, "preflight_issues": issues}

    def preflight_router(state: SongState):
        if not state["preflight_passed"] and state["round"] < state["max_rounds"]:
            return "needs_fix"
        return "ready_for_metadata"

    def targeted_revise_node(state: SongState):
        """Revise lyrics specifically to address preflight issues."""
        issues = state.get("preflight_issues", [])
        feedback = "Fix these preflight issues:\n" + "\n".join(f"- {issue}" for issue in issues)
        revised = revise_lyrics(revision_prompt, state["lyrics"], feedback, state["use_local"])
        tqdm.write("[OK] Applied targeted fixes from preflight.")
        if progress_callback:
            progress_callback("targeted_revise", 5, "Applied targeted fixes")
        return {"lyrics": revised, "feedback": feedback, "round": state["round"] + 1}

    def metadata_node(state: SongState):
        metadata = generate_metadata_summary(
            metadata_prompt,
            state["lyrics"],
            state["user_input"],
            state["resources"].default_params,
            state["resources"].persona_styles,
            state["use_local"],
        )
        tqdm.write("[OK] Metadata summary generated.")
        if progress_callback:
            progress_callback("metadata", 6, "Metadata summary generated")
        return {"metadata": metadata}

    def album_art_node(state: SongState):
        """Generate album artwork if not in local mode."""
        if state["use_local"]:
            tqdm.write("[OK] Album artwork skipped (local mode).")
            if progress_callback:
                progress_callback("album_art", 7, "Album artwork skipped (local mode)")
            return {"album_art": None}
        title = extract_title(state["lyrics"], state.get("song_name"))
        artwork_path = generate_album_art(title, state["user_input"])
        tqdm.write(f"[OK] Album artwork generated: {artwork_path}")
        if progress_callback:
            progress_callback("album_art", 7, "Album artwork generated")
        return {"album_art": artwork_path}

    def save_node(state: SongState):
        # Use HookHouse title if available, otherwise extract from lyrics
        if use_hookhouse and state.get("title_artist"):
            title = state["title_artist"].get("title", "Untitled")
        else:
            title = extract_title(state["lyrics"], state.get("song_name"))

        filename = save_song(title, state["user_input"], state["lyrics"], state["resources"].default_params, state["metadata"])
        tqdm.write(f"[OK] Song saved to {filename}")

        step_num = 8 if use_hookhouse else 8
        if progress_callback:
            progress_callback("save", step_num, f"Song saved to {filename}")
        return {"filename": filename}

    # ============================================================================
    # HookHouse Workflow Nodes
    # ============================================================================

    def narrative_node(state: SongState):
        """Develop narrative scaffold using Storysmith Muse."""
        from ai_functions import develop_narrative

        tqdm.write(f"[DEBUG] HookHouse workflow starting with blend: {state['blend']}")
        tqdm.write(f"[DEBUG] Mood: {state['mood_style']}, Explicitness: {state['explicitness']}")

        narrative = develop_narrative(
            narrative_prompt,
            state["user_input"],
            state["blend"],
            state["mood_style"],
            state["explicitness"],
            state.get("pov"),
            state.get("setting"),
            state.get("themes_include"),
            state.get("themes_avoid"),
            state.get("bpm"),
            state.get("time_signature"),
            state.get("key"),
            state.get("groove_texture"),
            state.get("choir_call_response", False),
            state["use_local"]
        )

        # Extract section map and groove map from best bet
        best_bet = narrative.get("best_bet", {})
        section_map = best_bet.get("section_prompts", {}).keys()
        groove_map = best_bet.get("riff_groove_map", {})

        tqdm.write("[OK] Narrative development completed.")
        tqdm.write(f"[DEBUG] Best bet title: {best_bet.get('title', 'N/A')}")
        if progress_callback:
            progress_callback("narrative", 1, "Narrative scaffold generated")

        return {
            "narrative": narrative,
            "section_map": list(section_map) if section_map else [],
            "groove_map": groove_map
        }

    def hookhouse_draft_node(state: SongState):
        """Generate HookHouse-compliant lyrics."""
        from ai_functions import draft_hookhouse_lyrics

        lyrics = draft_hookhouse_lyrics(
            hookhouse_draft_prompt,
            state["narrative"],
            state["blend"],
            state.get("bpm"),
            state.get("time_signature"),
            state.get("key"),
            state["user_input"],
            state["use_local"]
        )

        tqdm.write("[OK] HookHouse lyrics drafted.")
        if progress_callback:
            progress_callback("hookhouse_draft", 2, "Lyrics drafted with HookHouse rules")

        return {"lyrics": lyrics}

    def hookhouse_review_node(state: SongState):
        """Review lyrics against HookHouse quality standards."""
        from ai_functions import review_hookhouse_lyrics

        review = review_hookhouse_lyrics(
            hookhouse_review_prompt,
            state["lyrics"],
            state.get("bpm"),
            state["blend"],
            state["use_local"]
        )

        score = review.get("overall_score", 0.0)
        pass_threshold = review.get("pass_threshold", False)

        tqdm.write(f"[OK] HookHouse review: score {score:.2f}, pass: {pass_threshold}")
        if progress_callback:
            progress_callback("hookhouse_review", 3, f"Review score: {score:.2f}")

        return {
            "review_issues": review,
            "score": score,
            "round": state["round"] + 1
        }

    def hookhouse_review_router(state: SongState):
        """Decide whether to continue reviewing or proceed to Funksmith."""
        review = state.get("review_issues", {})
        pass_threshold = review.get("pass_threshold", False)

        if not pass_threshold and state["round"] < state["max_rounds"]:
            return "needs_revision"
        return "go_funksmith"

    def hookhouse_revise_node(state: SongState):
        """Revise lyrics based on HookHouse review feedback."""
        from ai_functions import revise_lyrics

        review = state.get("review_issues", {})
        critical_issues = review.get("critical_issues", [])
        moderate_issues = review.get("moderate_issues", [])
        revision_priority = review.get("revision_priority", [])

        # Build feedback from issues
        feedback_parts = []
        if revision_priority:
            feedback_parts.append("Priority fixes:\n" + "\n".join(f"- {p}" for p in revision_priority))
        if critical_issues:
            feedback_parts.append("\nCritical issues:\n" + "\n".join(
                f"- Line {issue.get('line_number', '?')}: {issue.get('issue', '')} → {issue.get('suggestion', '')}"
                for issue in critical_issues
            ))
        if moderate_issues:
            feedback_parts.append("\nModerate issues:\n" + "\n".join(
                f"- Line {issue.get('line_number', '?')}: {issue.get('issue', '')}"
                for issue in moderate_issues
            ))

        feedback = "\n".join(feedback_parts) if feedback_parts else "Improve based on review feedback."

        revised = revise_lyrics(revision_prompt, state["lyrics"], feedback, state["use_local"])

        tqdm.write(f"[OK] HookHouse revision round {state['round']} applied.")
        if progress_callback:
            progress_callback("hookhouse_revise", 3, f"Revision round {state['round']} applied")

        return {"lyrics": revised, "feedback": feedback}

    def funksmith_node(state: SongState):
        """Apply Sanctified Funksmith refinement."""
        from ai_functions import funksmith_critique_lyrics

        revised = funksmith_critique_lyrics(
            funksmith_prompt,
            state["lyrics"],
            state["blend"],
            state.get("bpm"),
            state["use_local"]
        )

        tqdm.write("[OK] Funksmith refinement applied.")
        if progress_callback:
            progress_callback("funksmith", 4, "Funksmith refinement complete")

        return {"lyrics": revised}

    def hookhouse_metadata_node(state: SongState):
        """Generate HookHouse Blocks 2-5 metadata."""
        from ai_functions import generate_hookhouse_metadata

        tqdm.write(f"[DEBUG] Generating metadata with blend: {state['blend']}")

        metadata_blocks = generate_hookhouse_metadata(
            hookhouse_metadata_prompt,
            state["lyrics"],
            state["narrative"],
            state["user_input"],
            state["blend"],
            state["mood_style"],
            state.get("bpm"),
            state.get("time_signature"),
            state.get("key"),
            state["use_local"]
        )

        # Store blocks in state
        style_block = metadata_blocks.get("style_block", "")
        excluded_styles = metadata_blocks.get("excluded_styles", [])
        title_artist = metadata_blocks.get("title_artist", {"title": "Untitled", "artist": "Unknown"})
        summary = metadata_blocks.get("summary", "")

        tqdm.write(f"[DEBUG] Style block length: {len(style_block)} chars")
        tqdm.write(f"[DEBUG] Style block preview: {style_block[:200] if style_block else 'EMPTY'}")
        tqdm.write(f"[DEBUG] Excluded styles count: {len(excluded_styles)}")
        tqdm.write(f"[DEBUG] Title/Artist: {title_artist}")
        tqdm.write(f"[DEBUG] Summary length: {len(summary)} chars")

        # Also update metadata for compatibility with save_song
        metadata = {
            "description": summary,
            "suno_styles": style_block,
            "suno_exclude_styles": excluded_styles,
            "target_audience": state["narrative"].get("best_bet", {}).get("target_audience", "General audience"),
            "commercial_potential": "Generated with HookHouse"
        }

        tqdm.write("[OK] HookHouse metadata generated.")
        if progress_callback:
            progress_callback("hookhouse_metadata", 5, "Metadata (Blocks 2-5) generated")

        return {
            "style_block": style_block,
            "excluded_styles": excluded_styles,
            "title_artist": title_artist,
            "summary": summary,
            "metadata": metadata
        }

    def hookhouse_image_node(state: SongState):
        """Generate HookHouse Block 6: Image Prompt JSON."""
        from ai_functions import generate_hookhouse_image_prompt

        image_prompt_json = generate_hookhouse_image_prompt(
            hookhouse_image_prompt,
            state["lyrics"],
            state["narrative"],
            {
                "title_artist": state.get("title_artist"),
                "summary": state.get("summary"),
                "style_block": state.get("style_block")
            },
            state["user_input"],
            state["blend"],
            state["mood_style"],
            state["use_local"]
        )

        tqdm.write("[OK] Image prompt JSON generated.")
        if progress_callback:
            progress_callback("hookhouse_image", 6, "Image prompt (Block 6) generated")

        return {"image_prompt_json": image_prompt_json}

    def caption_node(state: SongState):
        """Generate social media captions."""
        from ai_functions import generate_captions

        title_artist = state.get("title_artist", {"title": "Untitled", "artist": "Unknown"})

        captions = generate_captions(
            caption_prompt,
            title_artist.get("title", "Untitled"),
            title_artist.get("artist", "Unknown"),
            state["lyrics"],
            state.get("summary", ""),
            state.get("style_block", ""),
            state["narrative"],
            state["use_local"]
        )

        tqdm.write(f"[OK] Generated {len(captions)} social media captions.")
        if progress_callback:
            progress_callback("captions", 7, f"Generated {len(captions)} captions")

        return {"captions": captions}

    # ============================================================================
    # Graph Construction
    # ============================================================================

    graph = StateGraph(SongState)

    if use_hookhouse:
        # HookHouse Workflow
        graph.add_node("narrative", narrative_node)
        graph.add_node("hookhouse_draft", hookhouse_draft_node)
        graph.add_node("hookhouse_review", hookhouse_review_node)
        graph.add_node("hookhouse_revise", hookhouse_revise_node)
        graph.add_node("funksmith", funksmith_node)
        graph.add_node("preflight", preflight_node)
        graph.add_node("hookhouse_metadata", hookhouse_metadata_node)
        graph.add_node("album_art", album_art_node)  # Add actual image generation
        graph.add_node("save", save_node)

        # Wire HookHouse workflow
        graph.set_entry_point("narrative")
        graph.add_edge("narrative", "hookhouse_draft")
        graph.add_edge("hookhouse_draft", "hookhouse_review")
        graph.add_conditional_edges(
            "hookhouse_review",
            hookhouse_review_router,
            {"needs_revision": "hookhouse_revise", "go_funksmith": "funksmith"}
        )
        graph.add_edge("hookhouse_revise", "hookhouse_review")
        graph.add_edge("funksmith", "preflight")
        graph.add_edge("preflight", "hookhouse_metadata")
        graph.add_edge("hookhouse_metadata", "album_art")  # Generate actual image
        graph.add_edge("album_art", "save")  # Skip JSON prompt and captions for now
        graph.add_edge("save", END)
    else:
        # Original Workflow
        graph.add_node("draft", draft_node)
        graph.add_node("review", review_node)
        graph.add_node("critic", critic_node)
        graph.add_node("preflight", preflight_node)
        graph.add_node("targeted_revise", targeted_revise_node)
        graph.add_node("metadata", metadata_node)
        graph.add_node("album_art", album_art_node)
        graph.add_node("save", save_node)

        # Wire original workflow
        graph.set_entry_point("draft")
        graph.add_edge("draft", "review")
        graph.add_conditional_edges("review", review_router, {"keep_reviewing": "review", "go_critic": "critic"})
        graph.add_edge("critic", "preflight")
        graph.add_conditional_edges("preflight", preflight_router, {"needs_fix": "targeted_revise", "ready_for_metadata": "metadata"})
        graph.add_edge("targeted_revise", "review")
        graph.add_edge("metadata", "album_art")
        graph.add_edge("album_art", "save")
        graph.add_edge("save", END)

    # Compile and execute the graph
    app = graph.compile()
    with tqdm(total=None, desc="Creating your song (agentic)", unit="step") as _:
        final_state = app.invoke(initial_state)

    # Return the final state as a dict for API usage
    result = {
        "filename": final_state.get("filename"),
        "lyrics": final_state.get("lyrics"),
        "metadata": final_state.get("metadata"),
        "album_art": final_state.get("album_art")
    }

    # Include HookHouse-specific fields if using HookHouse workflow
    if use_hookhouse:
        result.update({
            "narrative": final_state.get("narrative"),
            "style_block": final_state.get("style_block"),
            "excluded_styles": final_state.get("excluded_styles"),
            "title_artist": final_state.get("title_artist"),
            "summary": final_state.get("summary"),
            "image_prompt_json": final_state.get("image_prompt_json"),
            "captions": final_state.get("captions"),
        })

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a song using AI")
    parser.add_argument("prompt", nargs="?", help="The song description or request")
    parser.add_argument(
        "--prompt-file",
        type=str,
        default=None,
        help="Path to a .txt file containing the song description or request",
    )
    parser.add_argument("--local", action="store_true", help="Use local LM Studio LLM and disable image generation")
    parser.add_argument("--name", type=str, default=None, help="Optional song name/title")
    parser.add_argument(
        "--persona",
        type=str,
        default=None,
        help='Specify the persona by name (e.g., "antidote") or by path to a persona .md file',
    )
    parser.add_argument(
        "--regen-cover",
        type=str,
        default=None,
        help="Path to an existing song markdown file to regenerate album art and exit",
    )

    # HookHouse arguments
    parser.add_argument(
        "--no-hookhouse",
        action="store_true",
        help="Use original workflow instead of HookHouse",
    )
    parser.add_argument(
        "--blend",
        type=str,
        nargs="+",
        default=None,
        help='Musical blend (2-3 styles, e.g., "Southern Rock" "Gospel")',
    )
    parser.add_argument(
        "--mood",
        type=str,
        choices=["dark", "clean"],
        default="dark",
        help="Mood style: dark or clean (default: dark)",
    )
    parser.add_argument(
        "--explicit",
        type=str,
        choices=["explicit", "mature"],
        default="mature",
        help="Explicitness: explicit or mature (default: mature)",
    )
    parser.add_argument(
        "--pov",
        type=str,
        default=None,
        help='Point of view (e.g., "first-person", "third-person")',
    )
    parser.add_argument(
        "--setting",
        type=str,
        default=None,
        help="Setting/time period/location",
    )
    parser.add_argument(
        "--themes-include",
        type=str,
        nargs="+",
        default=None,
        help="Themes to include",
    )
    parser.add_argument(
        "--themes-avoid",
        type=str,
        nargs="+",
        default=None,
        help="Themes to avoid",
    )
    parser.add_argument(
        "--bpm",
        type=int,
        default=None,
        help="Beats per minute",
    )
    parser.add_argument(
        "--time-sig",
        type=str,
        default=None,
        help='Time signature (e.g., "4/4", "3/4")',
    )
    parser.add_argument(
        "--key",
        type=str,
        default=None,
        help='Musical key (e.g., "C", "Am")',
    )
    parser.add_argument(
        "--groove",
        type=str,
        default=None,
        help="Groove/texture description",
    )
    parser.add_argument(
        "--choir",
        action="store_true",
        help="Include choir/call-response elements",
    )

    args = parser.parse_args()

    if args.regen_cover:
        try:
            title, user_prompt = extract_song_details_for_art(args.regen_cover)
        except (FileNotFoundError, ValueError) as regen_err:
            parser.error(str(regen_err))
            sys.exit(2)
        artwork_path = generate_album_art(title, user_prompt or "Use the song metadata to inspire the cover art.")
        print(f"Album art regenerated: {artwork_path}")
        sys.exit(0)

    # Load prompt from file or argument
    try:
        prompt_text = load_prompt_from_file(args.prompt_file) if args.prompt_file else args.prompt
    except FileNotFoundError as prompt_err:
        parser.error(str(prompt_err))
        sys.exit(2)

    if not prompt_text:
        parser.error("You must provide a prompt as an argument or via --prompt-file")
        sys.exit(2)

    # Generate the song
    generate_song(
        user_input=prompt_text,
        use_local=args.local,
        song_name=args.name,
        persona=args.persona,
        use_hookhouse=not args.no_hookhouse,
        blend=args.blend,
        mood_style=args.mood,
        explicitness=args.explicit,
        pov=args.pov,
        setting=args.setting,
        themes_include=args.themes_include,
        themes_avoid=args.themes_avoid,
        bpm=args.bpm,
        time_signature=args.time_sig,
        key=args.key,
        groove_texture=args.groove,
        choir_call_response=args.choir,
    )
