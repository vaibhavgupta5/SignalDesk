"""
Base LLM client for Gemini API calls.
All service-specific clients inherit from this.
"""

import json
import logging
from typing import Optional, Any, TypeVar, Generic
from pathlib import Path
from abc import ABC, abstractmethod

import httpx
from pydantic import BaseModel

from app.config.settings import settings


logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMClient(ABC, Generic[T]):
    """Base class for all LLM service clients"""
    
    def __init__(self, prompt_file: str, temperature: float = 0.3, max_tokens: int = 1024):
        self.prompt_file = prompt_file
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._prompt_template: Optional[str] = None
    
    @property
    def prompt_template(self) -> str:
        """Lazy load prompt template"""
        if self._prompt_template is None:
            prompt_path = Path(__file__).parent.parent.parent / "prompts" / self.prompt_file
            self._prompt_template = prompt_path.read_text()
        return self._prompt_template
    
    @abstractmethod
    def build_user_prompt(self, *args, **kwargs) -> str:
        """Build the user prompt for the specific task"""
        pass
    
    @abstractmethod
    def parse_response(self, response: dict) -> T:
        """Parse LLM response into typed output"""
        pass
    
    async def query(self, user_prompt: str) -> dict:
        """
        Query Gemini API with system + user prompt.
        Returns raw response dict.
        """
        full_prompt = f"{self.prompt_template}\n\n{user_prompt}"
        
        # Check if API key is configured
        if not settings.GEMINI_KEY:
            logger.warning("GEMINI_KEY not set, using mock response")
            return await self._mock_response(user_prompt)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.MODEL}:generateContent",
                    headers={"Content-Type": "application/json"},
                    params={"key": settings.GEMINI_KEY},
                    json={
                        "contents": [{"parts": [{"text": full_prompt}]}],
                        "generationConfig": {
                            "temperature": self.temperature,
                            "maxOutputTokens": self.max_tokens,
                            "responseMimeType": "application/json"
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                # Extract text from Gemini response
                text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                return {"response": text, "success": True}
                
        except httpx.HTTPError as e:
            logger.error(f"Gemini API error: {e}")
            return {"response": "{}", "success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"response": "{}", "success": False, "error": str(e)}
    
    async def _mock_response(self, prompt: str) -> dict:
        """Mock response for development/testing"""
        return {
            "response": "{}",
            "success": False,
            "mock": True,
            "note": "GEMINI_KEY not configured"
        }
    
    @staticmethod
    def parse_json(text: str) -> Optional[dict]:
        """Parse JSON from LLM response, handling markdown code blocks"""
        if not text:
            return None
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try extracting from markdown code block
        for marker in ["```json", "```"]:
            if marker in text:
                start = text.find(marker) + len(marker)
                end = text.find("```", start)
                if end > start:
                    try:
                        return json.loads(text[start:end].strip())
                    except json.JSONDecodeError:
                        pass
        
        return None
