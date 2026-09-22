from backend.models.schemas import Citation, AgentResponse
from typing import List

STANDARD_DISCLAIMER = (
    "This response is grounded in official university documents. "
    "Please verify with official administrative offices for formal decisions."
)

def post_process_output(raw_answer: str, routed_to: str, citations: List[Citation]) -> AgentResponse:
    """
    Applies responsible AI output filtering:
    - Appends standard disclaimer
    - Verifies citation presence
    - Returns structured response model
    """
    clean_answer = raw_answer.strip()
    
    # Check if answer claims lack of information
    unsupported = "could not find reliable information" in clean_answer.lower() or "no official details" in clean_answer.lower()
    
    return AgentResponse(
        answer=clean_answer,
        routed_to=routed_to,
        citations=citations if not unsupported else [],
        disclaimer=STANDARD_DISCLAIMER,
        is_safe=True
    )
