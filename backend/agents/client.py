from typing import Optional
from backend.config import settings

_project_client = None

def get_project_client():
    """Initializes and returns a singleton instance of Azure AI Foundry AIProjectClient."""
    global _project_client
    if _project_client is None:
        if not settings.PROJECT_CONNECTION_STRING:
            raise ValueError("PROJECT_CONNECTION_STRING environment variable is not configured.")
        
        from azure.ai.projects import AIProjectClient
        from azure.identity import DefaultAzureCredential
        
        _project_client = AIProjectClient.from_connection_string(
            credential=DefaultAzureCredential(),
            conn_str=settings.PROJECT_CONNECTION_STRING
        )
    return _project_client
