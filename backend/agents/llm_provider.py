import logging
import os
from dotenv import load_dotenv
from typing import Optional
from backend.config import settings

logger = logging.getLogger(__name__)

load_dotenv()


class LLMProvider:
    """
    Unified, pluggable LLM Provider abstraction supporting:
    1. Google Gemini Flash (using GEMINI_API_KEY)
    2. Azure OpenAI Service (using AZURE_OPENAI_API_KEY & AZURE_OPENAI_ENDPOINT)
    3. OpenAI API (using OPENAI_API_KEY)
    4. Offline Mock / Heuristic fallback when no keys are set
    """

    @staticmethod
    def generate_completion(
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1000
    ) -> str:
        load_dotenv(override=True)

        # 1. Try Gemini API
        gemini_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", None)
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)

                model_name = settings.GEMINI_MODEL or "gemini-2.0-flash"
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction
                )

                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens
                    )
                )
                if response and response.text:
                    return response.text
            except ImportError:
                logger.error("google-generativeai package not installed. Run: pip install google-generativeai")
            except Exception as ex:
                logger.error(f"Gemini API call failed: {ex}", exc_info=True)

        # 2. Try Azure OpenAI
        azure_key = os.getenv("AZURE_OPENAI_API_KEY") or settings.AZURE_OPENAI_API_KEY
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or settings.AZURE_OPENAI_ENDPOINT
        azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.AZURE_OPENAI_DEPLOYMENT

        if azure_key and azure_endpoint:
            try:
                from openai import AzureOpenAI
                client = AzureOpenAI(
                    azure_endpoint=azure_endpoint,
                    api_key=azure_key,
                    api_version=settings.AZURE_OPENAI_API_VERSION or "2024-06-01"
                )

                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                completion = client.chat.completions.create(
                    model=azure_deployment or "gpt-4o-mini",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                if completion.choices and completion.choices[0].message.content:
                    return completion.choices[0].message.content
            except ImportError:
                logger.error("openai package not installed. Run: pip install openai")
            except Exception as ex:
                logger.error(f"Azure OpenAI API call failed: {ex}", exc_info=True)

        # 3. Try Standard OpenAI API
        openai_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        if openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                if completion.choices and completion.choices[0].message.content:
                    return completion.choices[0].message.content
            except ImportError:
                logger.error("openai package not installed. Run: pip install openai")
            except Exception as ex:
                logger.error(f"OpenAI API call failed: {ex}", exc_info=True)

        # 4. Fallback response for offline / testing without active API keys
        logger.warning("No active LLM API key detected. Returning placeholder response.")
        return (
            "[SYSTEM NOTICE: No active LLM API key detected in .env. "
            "Please provide GEMINI_API_KEY or AZURE_OPENAI_API_KEY or OPENAI_API_KEY in .env to connect to live model.]\n\n"
            f"Regarding your query: '{prompt[:100]}...'\n"
            "This is a structured grounded response placeholder."
        )
