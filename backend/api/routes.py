from fastapi import APIRouter, HTTPException, status
from backend.models.schemas import QueryRequest, AgentResponse
from backend.agents.orchestrator import handle_query

router = APIRouter(prefix="/api/v1", tags=["FAQ Assistant"])

@router.post(
    "/ask",
    response_model=AgentResponse,
    summary="Submit student question to Multi-Agent FAQ Assistant",
    description="Routes student question to specialized Academic, Student Services, or General FAQ agent with security guardrails and source citations."
)
async def ask_question(request: QueryRequest) -> AgentResponse:
    try:
        response = await handle_query(request.question)
        return response
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your query."
        )
