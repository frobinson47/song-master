# HookHouse v2.6.1 - Claude Desktop Manual Workflow

## Overview

HookHouse is a professional songwriting system that generates Suno-compliant lyrics with production blueprints, arrangement cues, and physiological resonance. This document guides you through manually executing the HookHouse workflow in Claude Desktop.

**You will need these 7 prompt files:**
- `narrative_development.md`
- `hookhouse_draft.md`
- `hookhouse_review.md`
- `funksmith_critique.md`
- `hookhouse_metadata.md`
- `hookhouse_image.md` (optional)
- `caption_generation.md` (optional)

---

## Before You Start

### Prepare Your Song Parameters

**Required:**
- **Song Description**: What kind of song do you want? (e.g., "A Southern gospel rock song about redemption and gravel roads")
- **Blend**: 2-3 musical styles (e.g., ["Southern Rock", "Gospel"])
- **Mood**: "dark" or "clean"

**Optional:**
- **BPM**: Beats per minute (e.g., 95)
- **Key**: Musical key (e.g., "C", "Am")
- **Time Signature**: (e.g., "4/4")
- **POV**: Point of view (e.g., "first-person")
- **Setting**: Location/time period
- **Themes to Include**: Specific themes
- **Themes to Avoid**: Things to stay away from

---

## STEP 1: Narrative Development

### Prompt to Claude:

```
I'm using the HookHouse songwriting system. Please read the attached narrative_development.md file and generate 3 narrative concepts based on these parameters:

Song Description: [YOUR DESCRIPTION]
Blend: [GENRE 1], [GENRE 2], [GENRE 3 if applicable]
Mood: [dark or clean]
BPM: [NUMBER or "Not specified"]
Key: [KEY or "Not specified"]
POV: [PERSPECTIVE or "Not specified"]
Setting: [SETTING or "Not specified"]

Return the output in the JSON format specified in the prompt.
```

### What You'll Get:

JSON with 3 narrative concepts, each containing:
- title
- backstory (2-3 sentences)
- characters (concrete descriptions)
- central_image (tactile, specific)
- emotional_arc (physiological journey)
- setting
- why_it_hits_now (cultural relevance)
- narrative_hook (opening line/image)

Plus a **best_bet** selection with the strongest concept.

### Action:
✅ **Save the entire JSON output** - you'll need the `best_bet` for the next step.

---

## STEP 2: HookHouse Draft

### Prompt to Claude:

```
Using the HookHouse draft prompt (hookhouse_draft.md), generate complete song lyrics based on:

Narrative Scaffold:
[PASTE THE ENTIRE "best_bet" JSON FROM STEP 1]

Blend: [GENRE 1], [GENRE 2]
BPM: [NUMBER]
Key: [KEY]
Time Signature: [TIME SIG]
User Input: [YOUR ORIGINAL SONG DESCRIPTION]

Generate the complete song with Suno formatting as specified in the prompt.
```

### What You'll Get:

Complete song lyrics with:
- `[arrangement_cues | ...]` block at the top
- Section headers: `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`, `[Outro]`
- Proper bracket formatting throughout
- Ends with `[end]` or `[fade out][end]`

### Action:
✅ **Save the complete lyrics** - you'll need them for review.

---

## STEP 3: HookHouse Review

### Prompt to Claude:

```
Using the HookHouse review prompt (hookhouse_review.md), review these lyrics:

Lyrics:
[PASTE THE COMPLETE LYRICS FROM STEP 2]

BPM: [NUMBER]
Blend: [GENRE 1], [GENRE 2]

Return the review in JSON format as specified.
```

### What You'll Get:

JSON review containing:
- `overall_score`: 0-10 rating
- `category_scores`: 10 different categories rated
- `critical_issues`: Array of problems (if any)
- `moderate_issues`: Minor issues
- `positive_notes`: What's working well
- `revision_priority`: What to fix first
- `pass_threshold`: true/false (pass if ≥8.5)

### Decision Point:

**If `overall_score` ≥ 8.5 AND `pass_threshold: true`:**
✅ Continue to Step 4

**If score < 8.5 OR critical issues exist:**
⚠️ Ask Claude to revise the lyrics based on the feedback, then re-run Step 3

### Action:
✅ Once passed, **save the reviewed lyrics** for Funksmith refinement.

---

## STEP 4: Funksmith Refinement

### Prompt to Claude:

```
Using the Funksmith critique prompt (funksmith_critique.md), refine these lyrics for physiological resonance, breath points, and groove:

Lyrics:
[PASTE THE REVIEWED LYRICS FROM STEP 3]

Blend: [GENRE 1], [GENRE 2]
BPM: [NUMBER]

Return the refined lyrics with arrangement cues and a detailed changelog.
```

### What You'll Get:

Two parts:

1. **Refined Lyrics** with:
   - Updated `[arrangement_cues]` with micro-dynamics
   - Improved breath points (slashes `/` indicating pauses)
   - Concrete sensory details
   - Natural, singable phrasing

2. **Funksmith Changelog** explaining:
   - Every line changed and why
   - Breath architecture improvements
   - Physiological resonance enhancements
   - Vocal texture cues

### Action:
✅ **Save both the refined lyrics AND the changelog** - these are your final lyrics.

---

## STEP 5: HookHouse Metadata (Blocks 2-5)

### Prompt to Claude:

```
Using the HookHouse metadata prompt (hookhouse_metadata.md), generate Blocks 2-5:

Lyrics:
[PASTE THE REFINED LYRICS FROM STEP 4]

User Input: [YOUR ORIGINAL SONG DESCRIPTION]
Blend: [GENRE 1], [GENRE 2]
Mood: [dark or clean]
BPM: [NUMBER]
Time Signature: [TIME SIG]
Key: [KEY]

Narrative Context:
[PASTE THE "best_bet" JSON FROM STEP 1]

Generate all 4 metadata blocks following the HookHouse format.
```

### What You'll Get:

Four blocks in markdown format:

**### Block 2: Style**
A flowing prose production blueprint (≤1000 characters) describing:
- BPM, time signature, key
- Intro sound/texture
- Verse production (drums, bass, guitar, vocal treatment)
- Pre-chorus dynamics
- Chorus arrangement
- Bridge texture
- Outro fade/resolution
- Overall arc

**### Block 3: Excluded Style**
Comma-separated list of 5-12 genres to exclude (e.g., "synthpop, EDM, techno, dubstep...")

**### Block 4: Title / Artist**
```
Title: [Song Title from Lyrics]
Artist: [Invented Artist Name fitting the genre]
```

**### Block 5: Summary**
A narrative arc summary (≤500 characters) describing:
- Emotional journey
- Physiological movement (breath, heartbeat, tension/release)
- Central imagery
- How the song ends

### Critical Validation:

**CHECK CHARACTER COUNTS:**
- Block 2 (Style): **MUST be ≤1000 characters**
- Block 5 (Summary): **MUST be ≤500 characters**

If over, ask Claude to trim at sentence boundaries.

### Action:
✅ **Save all 4 blocks** - these complete your HookHouse metadata.

---

## STEP 6 (OPTIONAL): Album Art Image Prompt

### Prompt to Claude:

```
Using the HookHouse image prompt (hookhouse_image.md), generate a JSON image prompt for album art:

Lyrics:
[PASTE REFINED LYRICS]

Title: [FROM BLOCK 4]
Artist: [FROM BLOCK 4]
Summary: [BLOCK 5]
Blend: [GENRES]
Mood: [dark or clean]
User Input: [ORIGINAL DESCRIPTION]

Return valid JSON only, no commentary.
```

### What You'll Get:

JSON with:
- `objects`: Array of 3-6 concrete items
- `environment`: Detailed setting description
- `people`: Character description or "none"
- `composition`: Camera angle/framing
- `symbolism`: Array of 2-4 symbolic elements
- `metadata`: mood, color_palette, lighting, era, style
- `text`: title, artist, placement, style
- `size`: "9:16"
- `resolution`: "720p minimum"

### Action:
✅ Save the JSON - use it to generate album art with DALL-E or other image generator.

---

## STEP 7 (OPTIONAL): Social Media Captions

### Prompt to Claude:

```
Using the caption generation prompt (caption_generation.md), create 6 promotional captions:

Song Title: [FROM BLOCK 4]
Artist Name: [FROM BLOCK 4]
Lyrics: [REFINED LYRICS]
Summary: [BLOCK 5]
Style: [BLOCK 2]
Narrative: [best_bet from Step 1]

Generate 6 captions (≤300 characters each) in the 6 different tones specified.
```

### What You'll Get:

6 captions for different contexts:
1. **Roots/Americana Authentic** - Plain speech, working-class voice
2. **Scene or Setting Hook** - Cinematic, evocative imagery
3. **Streaming/Promo Short** - Punchy CTA with genre tags
4. **Emotional Minimalist** - Sparse, poetic fragments
5. **Philosophical/Legacy Frame** - Universal themes, timeless
6. **Wildcard** - Humorous, regional, nostalgic, or creative angle

### Action:
✅ Save captions for social media posts, streaming descriptions, etc.

---

## FINAL ASSEMBLY

### Create Your Complete Song File

Combine everything into this markdown format:

```markdown
## [Song Title from Block 4]
### [Block 5 Summary - full 500 char text]

---

**Quality Checklist:**
- [x] Block 2: [XXX] characters (within 1000 limit), no artist names, full production blueprint
- [x] Block 3: [X] excluded styles, comma-separated, opposite of blend
- [x] Block 4: Title from lyrics, invented artist name fits genre
- [x] Block 5: [XXX] characters, emotional/physiological arc with concrete imagery
- [x] All blocks present and properly formatted

## Suno Styles
[Block 2 Style - paste full text, ≤1000 chars]

## Suno Exclude-styles
[Block 3 - comma-separated list]

## Additional Metadata
- **Emotional Arc**: [from narrative]
- **Target Audience**: [from narrative or "General audience"]
- **Commercial Potential**: Generated with HookHouse
- **Technical Notes**: BPM: [X], Key: [X], Instruments: [list]
- **User Prompt**: [Your original description]

### Song Lyrics:
[Paste complete refined lyrics from Step 4, including arrangement_cues block]

---

## Funksmith Changelog
[Paste complete changelog from Step 4]

---

## Album Art Prompt (Optional)
[Paste JSON from Step 6 if generated]

---

## Social Media Captions (Optional)
[Paste 6 captions from Step 7 if generated]
```

---

## Quality Checklist - Before You Finish

Verify your final output has:

### Suno Compliance
- [ ] All non-lyrical text wrapped in `[brackets]`
- [ ] Section headers present: `[Intro]`, `[Verse]`, `[Chorus]`, etc.
- [ ] `[arrangement_cues | ... ]` block at top of lyrics
- [ ] Lyrics end with `[end]` or `[fade out][end]`
- [ ] No naked descriptive text outside brackets

### HookHouse Blocks
- [ ] Block 2 (Style): ≤1000 characters, flowing prose, complete production blueprint
- [ ] Block 3 (Excluded): 5-12 comma-separated styles
- [ ] Block 4 (Title/Artist): Title from lyrics, invented artist name
- [ ] Block 5 (Summary): ≤500 characters, emotional/physiological arc

### Banned Language Check
- [ ] No AI-poetic clichés: "shimmering", "glistening", "luminous", "tapestry", "symphony"
- [ ] No generic metaphors: "heart on my sleeve", "soul on fire", "broken pieces"
- [ ] No empty intensifiers: "really", "truly", "honestly"
- [ ] Uses concrete, specific imagery instead

### Funksmith Refinements
- [ ] Natural breath points (slashes `/` in lyrics)
- [ ] Concrete sensory details in every section
- [ ] Singable phrases (passes "real singer test")
- [ ] Arrangement cues map micro-dynamics
- [ ] Changelog explains every refinement

### Narrative & Authenticity
- [ ] Emotional arc is clear and believable
- [ ] Central image is concrete and tactile
- [ ] Voice fits the genre/culture authentically
- [ ] Shows emotion through action/objects (not telling)

---

## Common Issues & Solutions

### Issue: Block 2 (Style) exceeds 1000 characters

**Solution:** Ask Claude to trim while preserving key details:
```
The Style block is [XXX] characters. Please trim it to ≤1000 characters by:
1. Cutting adjectives and adverbs
2. Merging sentences with em dashes
3. Removing "creates a sense of" phrases
4. Keeping all essential production details
```

### Issue: Block 5 (Summary) exceeds 500 characters

**Solution:** Ask Claude to condense:
```
The Summary is [XXX] characters. Please trim to ≤500 characters while keeping:
- The emotional/physiological arc
- Central concrete imagery
- How the song resolves
```

### Issue: Lyrics have AI-poetic clichés

**Solution:** Ask Claude to replace with concrete details:
```
Please replace these abstract phrases with concrete, tactile imagery:
- [LIST THE CLICHÉ LINES]
Use specific objects, actions, or sensations instead.
```

### Issue: Review score < 8.5

**Solution:** Use the review feedback:
```
Based on the critical_issues and revision_priority from the review:
[PASTE THE SPECIFIC ISSUES]

Please revise the lyrics to address these issues, then we'll re-review.
```

---

## Tips for Best Results

1. **Be specific in your song description** - Include setting, mood, POV, concrete details
2. **Choose complementary blend genres** - e.g., "Southern Rock + Gospel" works better than "Death Metal + Reggae"
3. **Trust the process** - Don't skip steps, each builds on the previous
4. **Review character counts** - Block 2 and Block 5 limits are strict for Suno compatibility
5. **Read lyrics aloud** - If it doesn't sound natural spoken, ask Funksmith to refine more
6. **Match wildcard caption to song tone** - Don't use humor if the song is dark/serious

---

## Example Session Flow

```
You: "I want a Southern gospel rock song about redemption on gravel roads"
[Run Step 1] → Get 3 narrative concepts, choose best_bet
[Run Step 2] → Get draft lyrics with arrangement cues
[Run Step 3] → Review scores 8.2 - needs work on banned language
[Revise & Re-review] → Now scores 8.6 - PASS
[Run Step 4] → Funksmith refines breath points, adds concrete details
[Run Step 5] → Generate metadata blocks (Style: 987 chars, Summary: 476 chars)
[Run Step 6] → Optional: Generate album art JSON
[Run Step 7] → Optional: Generate 6 social captions
[Assemble] → Create final markdown file

Total time: ~15-25 minutes for complete song with all optional steps
```

---

## Support Resources

**Banned Language Reference:** `prompts/banned_language.txt`
- Complete list of AI-poetic clichés to avoid

**Excluded Styles Reference:** `prompts/excluded_styles.txt`
- Full list of available style exclusions for Suno

**HookHouse Philosophy:**
- **Spoken-first**: Would this sound natural muttered in a bar?
- **Concrete over abstract**: Show with objects/actions, don't tell emotions
- **Groove-aware**: Does the rhythm suggest physical movement?
- **Physiologically resonant**: Does it mirror breath, heartbeat, tension/release?
- **Suno-compliant**: Proper bracket formatting for AI music generation

---

## Ready to Start?

Follow these steps in order:
1. Gather your song parameters
2. Run Step 1 (Narrative) → save best_bet
3. Run Step 2 (Draft) → save lyrics
4. Run Step 3 (Review) → verify score ≥8.5
5. Run Step 4 (Funksmith) → save refined lyrics + changelog
6. Run Step 5 (Metadata) → verify character limits
7. Optional: Run Steps 6-7 for album art and captions
8. Assemble final markdown file
9. Verify quality checklist
10. 🎸 You have a complete HookHouse song!

**Good luck with your songwriting!**
