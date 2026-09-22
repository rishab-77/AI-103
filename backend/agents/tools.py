from backend.config import settings

def build_search_tool():
    """Builds AzureAISearchTool configured for the university knowledge base index."""
    if not settings.AI_SEARCH_CONNECTION_ID or not settings.AI_SEARCH_INDEX_NAME:
        return None

    from azure.ai.projects.models import (
        AzureAISearchTool,
        AzureAISearchToolResource,
        AISearchIndexResource,
        AzureAISearchQueryType
    )

    return AzureAISearchTool(
        azure_ai_search=AzureAISearchToolResource(
            indexes=[
                AISearchIndexResource(
                    project_connection_id=settings.AI_SEARCH_CONNECTION_ID,
                    index_name=settings.AI_SEARCH_INDEX_NAME,
                    query_type=AzureAISearchQueryType.SEMANTIC
                )
            ]
        )
    )
