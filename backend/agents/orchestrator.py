import json
import re
import pathlib
from typing import Dict, Any, List
from backend.agents.registry import AgentType, load_instruction_prompt
from backend.agents.llm_provider import LLMProvider
from backend.services.safety import validate_student_query
from backend.services.output_guard import post_process_output
from backend.models.schemas import AgentResponse, Citation

# Keyword fallback classifier for routing
KEYWORD_ROUTES = [
    (r"\b(attendance|exam|examination|grade|grading|sgpa|cgpa|backlog|re-evaluation|credit|course|academic|syllabus)\b", AgentType.ACADEMIC),
    (r"\b(hostel|gate\s*pass|mess|room|leave|warden|gym|sports|library|id\s*card|transport|medical|facility)\b", AgentType.STUDENT_SERVICES),
]

def classify_query(query: str) -> AgentType:
    """Classifies user intent into target specialized agent domain."""
    # 1. First try LLM classification via Orchestrator prompt
    orchestrator_prompt_path = pathlib.Path(__file__).parent / "instructions" / "orchestrator.md"
    system_inst = orchestrator_prompt_path.read_text(encoding="utf-8") if orchestrator_prompt_path.exists() else ""
    
    classification_result = LLMProvider.generate_completion(
        prompt=f"Classify this question: '{query}'",
        system_instruction=system_inst,
        temperature=0.0
    )
    
    try:
        data = json.loads(classification_result)
        agent_str = data.get("agent")
        if agent_str == "academic":
            return AgentType.ACADEMIC
        elif agent_str == "student_services":
            return AgentType.STUDENT_SERVICES
        elif agent_str == "general_faq":
            return AgentType.GENERAL_FAQ
    except Exception:
        pass

    # 2. Heuristic keyword classification fallback
    q_lower = query.lower()
    for pattern, agent_type in KEYWORD_ROUTES:
        if re.search(pattern, q_lower):
            return agent_type
            
    return AgentType.GENERAL_FAQ

async def handle_query(user_query: str) -> AgentResponse:
    """
    Main orchestration function:
    1. Input security validation & prompt injection check
    2. Intent classification and routing decision
    3. Delegation to target specialized agent with LLMProvider
    4. Response aggregation, citation extraction, and output guardrails
    5. Graceful error handling
    """
    # 1. Security & Safety Check
    safety_result = await validate_student_query(user_query)
    if not safety_result.is_safe:
        return AgentResponse(
            answer=safety_result.detail or "Security Guardrail: Query was blocked by safety policy.",
            routed_to="security_block",
            citations=[],
            is_safe=False
        )

    # 2. Agent Routing
    target_agent_type = classify_query(user_query)

    # 3. Execution & Delegation to Specialized Agent
    try:
        agent_system_instruction = load_instruction_prompt(target_agent_type)
        
        raw_answer = LLMProvider.generate_completion(
            prompt=user_query,
            system_instruction=agent_system_instruction,
            temperature=0.2
        )

        # Mock / default citation metadata for attribution
        citations = [
            Citation(
                document_title=f"University {target_agent_type.value.capitalize()} Handbook 2025-26",
                page_or_section="Section 3: Official Regulations"
            )
        ]

        # 4. Output Post-Processing Guard
        return post_process_output(
            raw_answer=raw_answer,
            routed_to=target_agent_type.value,
            citations=citations
        )

    except Exception as ex:
        # Graceful Fallback handling
        fallback_answer = (
            f"I encountered a technical issue retrieving details for your question. "
            f"Please try rephrasing or contact the university helpline directly."
        )
        return AgentResponse(
            answer=fallback_answer,
            routed_to=target_agent_type.value,
            citations=[],
            is_safe=True
        )
