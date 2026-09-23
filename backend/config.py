import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

load_dotenv()

class Settings(BaseSettings):
    # Azure AI Foundry / Project Client
    PROJECT_CONNECTION_STRING: Optional[str] = None
    MODEL_DEPLOYMENT_NAME: str = "gpt-4o-mini"

    # Gemini Key & Model
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-flash-latest"

    # Azure OpenAI Key & Endpoint
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o-mini"
    AZURE_OPENAI_API_VERSION: str = "2024-06-01"

    # OpenAI Key
    OPENAI_API_KEY: Optional[str] = None

    # Azure AI Search (connected to RAG knowledge index)
    AI_SEARCH_ENDPOINT: Optional[str] = None
    AI_SEARCH_KEY: Optional[str] = None
    AI_SEARCH_INDEX_NAME: str = "university-knowledge"
    AI_SEARCH_CONNECTION_ID: Optional[str] = None

    # Azure Content Safety (Optional)
    CONTENT_SAFETY_ENDPOINT: Optional[str] = None
    CONTENT_SAFETY_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
