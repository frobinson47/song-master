"""
Personas router - handles persona listing and retrieval
"""
import os
from typing import List
from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["personas"])


@router.get("/", response_model=List[dict])
async def list_personas():
    """
    List all available personas from the personas/ directory.
    Returns persona metadata (id, name, description).
    """
    personas_dir = "personas"
    personas = []

    # Default "None" persona
    personas.append({
        "id": "",
        "name": "None",
        "description": "No persona - use default settings"
    })

    if not os.path.exists(personas_dir):
        return personas

    # Read all .md files in personas directory
    for filename in sorted(os.listdir(personas_dir)):
        if not filename.endswith('.md'):
            continue

        persona_id = filename[:-3]  # Remove .md extension
        filepath = os.path.join(personas_dir, filename)

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

                # Extract description from file content
                # Expected format: first line is title/name, rest is description
                lines = [line.strip() for line in content.split('\n') if line.strip()]

                # Use persona_id as name (capitalize and replace underscores)
                name = persona_id.replace('_', ' ').title()

                # Description is the content of the file (style tokens)
                description = content.strip()

                personas.append({
                    "id": persona_id,
                    "name": name,
                    "description": description
                })
        except Exception as e:
            # Skip files that can't be read
            print(f"Warning: Could not read persona file {filename}: {e}")
            continue

    return personas


@router.get("/{persona_id}", response_model=dict)
async def get_persona(persona_id: str):
    """
    Get a specific persona by ID.
    """
    if not persona_id:
        raise HTTPException(status_code=400, detail="Persona ID is required")

    filepath = f"personas/{persona_id}.md"

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

            name = persona_id.replace('_', ' ').title()
            description = content.strip()

            return {
                "id": persona_id,
                "name": name,
                "description": description
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading persona: {e}")
