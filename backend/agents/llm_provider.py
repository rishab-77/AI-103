import logging
import os
from dotenv import load_dotenv
from typing import Optional
from backend.config import settings

logger = logging.getLogger(__name__)

load_dotenv()

# Placeholder sentinel values that should be skipped
_PLACEHOLDER_MARKERS = ("your_", "your-resource", "your-key", "00000000-0000-0000")

# Gemini model fallback order in case primary is under high demand
_GEMINI_MODEL_FALLBACKS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
]


def _is_placeholder(value: str) -> bool:
    return any(marker in value for marker in _PLACEHOLDER_MARKERS)


class LLMProvider:
    """
    Unified, pluggable LLM Provider abstraction supporting:
    1. Google Gemini (using GEMINI_API_KEY) via google-genai SDK
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

        # 1. Try Gemini API (new google-genai SDK)
        gemini_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", None)
        if gemini_key and not _is_placeholder(gemini_key):
            try:
                from google import genai as new_genai

                client = new_genai.Client(api_key=gemini_key)

                # Determine primary model from env/settings, then use fallback chain
                preferred_model = (
                    os.getenv("GEMINI_MODEL")
                    or getattr(settings, "GEMINI_MODEL", None)
                    or "gemini-3.6-flash"
                )
                # Build fallback list: preferred first, then the rest
                model_candidates = [preferred_model] + [
                    m for m in _GEMINI_MODEL_FALLBACKS if m != preferred_model
                ]

                config_kwargs = {
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                }
                if system_instruction:
                    config_kwargs["system_instruction"] = system_instruction

                for model_name in model_candidates:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=new_genai.types.GenerateContentConfig(**config_kwargs),
                        )
                        if response and response.text:
                            logger.info(f"Gemini responded using model: {model_name}")
                            return response.text
                    except Exception as model_ex:
                        err_str = str(model_ex)
                        if "503" in err_str or "UNAVAILABLE" in err_str:
                            logger.warning(
                                f"Gemini model {model_name} temporarily unavailable, trying next..."
                            )
                            continue
                        elif "404" in err_str or "NOT_FOUND" in err_str:
                            logger.warning(f"Gemini model {model_name} not found, trying next...")
                            continue
                        else:
                            logger.error(f"Gemini API call failed with {model_name}: {model_ex}")
                            break

            except ImportError:
                # Fall back to legacy google-generativeai SDK
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    model_name = (
                        os.getenv("GEMINI_MODEL")
                        or getattr(settings, "GEMINI_MODEL", None)
                        or "gemini-3.6-flash"
                    )
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_instruction,
                    )
                    response = model.generate_content(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        ),
                        request_options={"timeout": 30},
                    )
                    if response and response.text:
                        return response.text
                except Exception as ex:
                    logger.error(f"Gemini (legacy SDK) call failed: {ex}", exc_info=True)
            except Exception as ex:
                logger.error(f"Gemini API call failed: {ex}", exc_info=True)

        # 2. Try Azure OpenAI — skip placeholder endpoints
        azure_key = os.getenv("AZURE_OPENAI_API_KEY") or settings.AZURE_OPENAI_API_KEY
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or settings.AZURE_OPENAI_ENDPOINT
        azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.AZURE_OPENAI_DEPLOYMENT

        if (azure_key and azure_endpoint
                and not _is_placeholder(azure_key)
                and not _is_placeholder(azure_endpoint)
                and azure_endpoint.startswith("https://")):
            try:
                from openai import AzureOpenAI
                client = AzureOpenAI(
                    azure_endpoint=azure_endpoint,
                    api_key=azure_key,
                    api_version=settings.AZURE_OPENAI_API_VERSION or "2024-06-01",
                    timeout=30.0,
                )
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                completion = client.chat.completions.create(
                    model=azure_deployment or "gpt-4o-mini",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                if completion.choices and completion.choices[0].message.content:
                    return completion.choices[0].message.content
            except ImportError:
                logger.error("openai package not installed. Run: pip install openai")
            except Exception as ex:
                logger.error(f"Azure OpenAI API call failed: {ex}", exc_info=True)

        # 3. Try Standard OpenAI API
        openai_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        if openai_key and not _is_placeholder(openai_key) and openai_key.startswith("sk-"):
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key, timeout=30.0)
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
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
