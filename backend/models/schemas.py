from pydantic import BaseModel, Field
from typing import List, Optional

class QueryRequest(BaseModel):
    question: str = Field(..., description="The student's question", min_length=1, max_length=2000)

class Citation(BaseModel):
    document_title: Optional[str] = Field(None, description="Title of official document")
    source_url: Optional[str] = Field(None, description="URL of source document")
    page_or_section: Optional[str] = Field(None, description="Page number or section name")

class AgentResponse(BaseModel):
    answer: str = Field(..., description="Grounded response from the specialized agent")
    routed_to: str = Field(..., description="Agent that handled the request (academic, student_services, general_faq)")
    citations: List[Citation] = Field(default_factory=list, description="Source attributions")
    disclaimer: str = Field(
        default="This information is based on official university sources. For final administrative confirmation, please contact the respective university department.",
        description="Responsible AI disclaimer"
    )
    is_safe: bool = Field(default=True, description="Indicates if the prompt passed security guardrails")
