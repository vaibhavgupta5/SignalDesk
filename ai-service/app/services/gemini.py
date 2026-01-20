import asyncio
import json
from typing import Optional

from app.config.settings import settings


async def query_gemini(
    prompt: str,
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> dict:
    """
    Query Gemini API with the given prompt.
    
    Args:
        prompt: The system/user prompt
        model: Model name (defaults to settings.MODEL)
        temperature: Creativity level (0.0-1.0)
        max_tokens: Max response length
    
    Returns:
        dict with 'response' (str) and 'confidence' fields
    """
    model = model or settings.MODEL
    
    # TODO: Implement actual HTTP client to Gemini API
    # Example structure (requires google-generativeai or httpx):
    #
    # import anthropic
    # client = anthropic.Anthropic(api_key=settings.GEMINI_KEY)
    # msg = await client.messages.create(
    #     model=model,
    #     max_tokens=max_tokens,
    #     system="You are a stateless reasoning layer...",
    #     messages=[{"role": "user", "content": prompt}]
    # )
    # response_text = msg.content[0].text
    # return {"response": response_text, "confidence": 0.85}
    
    # Placeholder: return mock response
    await asyncio.sleep(0.1)  # Simulate API latency
    return {
        "response": f"(Gemini mock response to: {prompt[:50]}...)",
        "confidence": 0.5,
        "model": model,
        "note": "PLACEHOLDER - requires Gemini API credentials and httpx integration"
    }


async def parse_json_response(response_text: str) -> Optional[dict]:
    """
    Parse JSON from Gemini response text.
    Handles cases where JSON is embedded in markdown code blocks.
    """
    try:
        # Try direct JSON parse
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Try extracting from markdown code block
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            if end > start:
                json_str = response_text[start:end].strip()
                return json.loads(json_str)
        # Try extracting from plain code block
        if "```" in response_text:
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            if end > start:
                json_str = response_text[start:end].strip()
                return json.loads(json_str)
        return None
