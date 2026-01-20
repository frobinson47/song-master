import os
import sys
import base64
from openai import OpenAI

base_prompt = "You are an AI that generates album cover art based on textual descriptions in portrait aspect ratio. Create a visually striking and unique album cover art image based on the following description: "


def generate_with_openai(prompt: str, output_file: str, model: str = "dall-e-3") -> None:
    """Generate album art using OpenAI DALL-E."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENAI_API_KEY environment variable")

    client = OpenAI(api_key=api_key)

    # Generate image with DALL-E
    response = client.images.generate(
        model=model,
        prompt=base_prompt + prompt,
        size="1024x1792" if model == "dall-e-3" else "1024x1024",  # Portrait for DALL-E 3
        quality="hd" if model == "dall-e-3" else "standard",
        n=1,
    )

    # Download and save the image
    image_url = response.data[0].url
    import requests
    image_data = requests.get(image_url).content
    with open(output_file, "wb") as f:
        f.write(image_data)


def generate_with_google(prompt: str, output_file: str) -> None:
    """Generate album art using Google Imagen via Vertex AI or direct API."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("Missing GOOGLE_API_KEY environment variable")

    # Try using litellm for Google image generation
    try:
        from litellm import image_generation
        response = image_generation(
            model="vertex_ai/imagen-3-image-generation",
            prompt=base_prompt + prompt,
            api_key=api_key,
        )

        # Handle response based on litellm format
        if hasattr(response, 'data') and len(response.data) > 0:
            image_url = response.data[0].url
            import requests
            image_data = requests.get(image_url).content
            with open(output_file, "wb") as f:
                f.write(image_data)
        else:
            raise RuntimeError("No image returned from Google API")
    except ImportError:
        raise ValueError("LiteLLM not installed. Install with: pip install litellm")
    except Exception as e:
        raise RuntimeError(f"Google image generation failed: {e}")


def generate_with_openrouter(prompt: str, output_file: str, model: str = "google/gemini-3-pro-image-preview") -> None:
    """Generate album art using OpenRouter (supports multiple image models)."""
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENROUTER_API_KEY environment variable")

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    # Request image
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": base_prompt + prompt}],
        extra_body={"modalities": ["image", "text"]},
    )

    message = response.choices[0].message

    if not message.images:
        raise RuntimeError("No image returned from the API")

    # Extract base64 image
    image_data_url = message.images[0]["image_url"]["url"]
    base64_data = image_data_url.split(",", 1)[1]  # strip "data:image/jpeg;base64,"

    # Decode + write to file
    with open(output_file, "wb") as f:
        f.write(base64.b64decode(base64_data))


def generate_album_art_image(prompt: str, output_file: str) -> None:
    """
    Generate album cover art based on a textual prompt and save to a file.

    Args:
        prompt: The description for the album cover art.
        output_file: The path where the image will be saved.

    Raises:
        ValueError: If required API key is missing.
        RuntimeError: If no image is returned from the API.
    """
    # Get provider preference from environment
    provider = os.environ.get("IMAGE_PROVIDER", "openai").lower()
    model = os.environ.get("IMAGE_MODEL", "dall-e-3")

    if provider == "openai":
        generate_with_openai(prompt, output_file, model)
    elif provider == "google" or provider == "gemini":
        generate_with_google(prompt, output_file)
    elif provider == "openrouter":
        generate_with_openrouter(prompt, output_file, model)
    else:
        # Default fallback to OpenAI
        try:
            generate_with_openai(prompt, output_file, model)
        except ValueError:
            # If OpenAI fails, try OpenRouter as final fallback
            generate_with_openrouter(prompt, output_file)


def main():
    if len(sys.argv) < 3:
        print("Usage: python create_album_art.py \"<prompt>\" <output_file>")
        sys.exit(1)

    prompt = sys.argv[1]
    output_file = sys.argv[2]

    try:
        generate_album_art_image(prompt, output_file)
        print(f"Image saved to {output_file}")
    except Exception as e:
        print(f"Error generating album art: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()