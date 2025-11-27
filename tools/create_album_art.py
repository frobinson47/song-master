import os
import sys
import base64
from openai import OpenAI

base_prompt = "You are an AI that generates album cover art based on textual descriptions in portrait aspect ratio. Create a visually striking and unique album cover art image based on the following description: "

def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_image.py \"<prompt>\" <output_file>")
        sys.exit(1)

    prompt = sys.argv[1]
    output_file = sys.argv[2]

    # Load API key from environment variable
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENROUTER_API_KEY environment variable")

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    # Request image
    response = client.chat.completions.create(
        model="google/gemini-3-pro-image-preview",
        messages=[{"role": "user", "content": base_prompt + prompt}],
        extra_body={"modalities": ["image", "text"]},
    )

    message = response.choices[0].message

    if not message.images:
        print("No image returned!")
        sys.exit(1)

    # Extract base64 image
    image_data_url = message.images[0]["image_url"]["url"]
    base64_data = image_data_url.split(",", 1)[1]  # strip "data:image/jpeg;base64,"

    # Decode + write to file
    with open(output_file, "wb") as f:
        f.write(base64.b64decode(base64_data))

    print(f"Image saved to {output_file}")


if __name__ == "__main__":
    main()