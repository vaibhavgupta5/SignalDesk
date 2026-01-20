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
        
        logger.debug(f"Querying {settings.MODEL} with prompt length: {len(full_prompt)}")
        # logger.debug(f"Full Prompt: {full_prompt}") # Uncomment only if needed, can be very large
        
        # Check if API key is configured
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set, using mock response")
            return await self._mock_response(user_prompt)
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                logger.info(f"POST request to Gemini API ({settings.MODEL})")
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.MODEL}:generateContent",
                    headers={"Content-Type": "application/json"},
                    params={"key": settings.GEMINI_API_KEY},
                    json={
                        "contents": [{"parts": [{"text": full_prompt}]}],
                        "generationConfig": {
                            "temperature": self.temperature,
                            "maxOutputTokens": self.max_tokens,
                            "responseMimeType": "application/json"
                        }
                    }
                )
                
                logger.debug(f"Gemini API Response Status: {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"Gemini API Error: {response.status_code} - {response.text}")
                
                response.raise_for_status()
                result = response.json()
                
                # Extract text from Gemini response
                candidates = result.get("candidates", [])
                if not candidates:
                    logger.warning(f"No candidates in response: {result}")
                    return {"response": "{}", "success": False, "error": "No candidates"}
                
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                logger.debug(f"Gemini Response Text: {text[:500]}...") # Log start of response
                
                return {"response": text, "success": True}
                
        except httpx.HTTPError as e:
            logger.error(f"Gemini API HTTP error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Error body: {e.response.text}")
            return {"response": "{}", "success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during Gemini query: {str(e)}", exc_info=True)
            return {"response": "{}", "success": False, "error": str(e)}
    
    async def _mock_response(self, prompt: str) -> dict:
        """Mock response for development/testing"""
        return {
            "response": "{}",
            "success": False,
            "mock": True,
            "error": "GEMINI_API_KEY not configured or using mock mode",
            "note": "Please set GEMINI_API_KEY in .env"
        }
    
    @staticmethod
    def parse_json(text: str) -> Optional[Any]:
        """
        Extremely robust JSON extraction from LLM responses.
        Handles markdown, leading/trailing crap, and logs specific errors.
        """
        if not text:
            return None
        
        import re
        import json
        
        cleaned_text = text.strip()
        
        # 1. Try direct parse
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.debug(f"Direct JSON parse failed: {str(e)}")
            
        # 2. Try extracting from markdown blocks
        markdown_match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", cleaned_text, re.DOTALL | re.IGNORECASE)
        if markdown_match:
            try:
                return json.loads(markdown_match.group(1).strip())
            except json.JSONDecodeError as e:
                logger.debug(f"Markdown JSON parse failed: {str(e)}")
        
        # 3. Find outermost balance (handles text before/after JSON)
        try:
            start_idx = cleaned_text.find('{')
            if start_idx == -1:
                start_idx = cleaned_text.find('[')
            
            if start_idx != -1:
                # Find matching end
                bracket_type = cleaned_text[start_idx]
                close_type = '}' if bracket_type == '{' else ']'
                
                # Simple balanced bracket search
                stack = 0
                for i in range(start_idx, len(cleaned_text)):
                    if cleaned_text[i] == bracket_type:
                        stack += 1
                    elif cleaned_text[i] == close_type:
                        stack -= 1
                        if stack == 0:
                            candidate = cleaned_text[start_idx:i+1]
                            try:
                                return json.loads(candidate)
                            except json.JSONDecodeError as e:
                                logger.warning(f"Balanced segment parse failed at index {i}: {str(e)}")
                                # Continue search if this wasn't the "real" end or if multiple JSONs
        except Exception as e:
            logger.error(f"Error during bracket matching: {str(e)}")

        return None
