"""
Multi-Agent Orchestrator.

Routes student queries to specialized agents and uses the local
knowledge base (RAG) to ground responses with real citations.
"""
import json
import logging
import re
import pathlib
from typing import List

from backend.agents.registry import AgentType, load_instruction_prompt
from backend.agents.llm_provider import LLMProvider
from backend.services.safety import validate_student_query
from backend.services.output_guard import post_process_output
from backend.services.knowledge_ingestion import search_knowledge, load_knowledge_base
from backend.models.schemas import AgentResponse, Citation

logger = logging.getLogger(__name__)

# Keyword fallback classifier for routing
KEYWORD_ROUTES = [
    (r"\b(attendance|exam|examination|grade|grading|sgpa|cgpa|backlog|re-evaluation|credit|course|academic|syllabus|semester|marks|result)\b", AgentType.ACADEMIC),
    (r"\b(hostel|gate\s*pass|mess|room|leave|warden|gym|sports|library|id\s*card|transport|medical|facility|hostel\s*rules|dos|don'?ts?|grievance|complaint|redressal|ragging|welfare|harassment|ombudsperson)\b", AgentType.STUDENT_SERVICES),
    (r"\b(contact|phone|email|address|calendar|faq|office|campus|location|website|helpline|admission)\b", AgentType.GENERAL_FAQ),
]


def classify_query(query: str) -> AgentType:
    """Classifies user intent into target specialized agent domain.

    Uses a two-stage approach:
    1. LLM-based classification via the orchestrator prompt (if an API key is available)
    2. Heuristic keyword classification as a fallback
    """
    # 1. First try LLM classification via Orchestrator prompt
    orchestrator_prompt_path = pathlib.Path(__file__).parent / "instructions" / "orchestrator.md"
    system_inst = orchestrator_prompt_path.read_text(encoding="utf-8") if orchestrator_prompt_path.exists() else ""

    classification_result = LLMProvider.generate_completion(
        prompt=f"Classify this question into one agent. Reply ONLY with a JSON object like {{\"agent\": \"academic\"}} or {{\"agent\": \"student_services\"}} or {{\"agent\": \"general_faq\"}}.\n\nQuestion: '{query}'",
        system_instruction=system_inst,
        temperature=0.0,
        max_tokens=100
    )

    if "[SYSTEM NOTICE" not in classification_result:
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{[^}]+\}', classification_result)
            if json_match:
                data = json.loads(json_match.group())
                agent_str = data.get("agent", "").lower().strip()
                if agent_str == "academic":
                    return AgentType.ACADEMIC
                elif agent_str == "student_services":
                    return AgentType.STUDENT_SERVICES
                elif agent_str == "general_faq":
                    return AgentType.GENERAL_FAQ
        except Exception as ex:
            logger.debug(f"LLM classification parse failed, falling back to keywords: {ex}")

    # 2. Heuristic keyword classification fallback
    q_lower = query.lower()
    for pattern, agent_type in KEYWORD_ROUTES:
        if re.search(pattern, q_lower):
            return agent_type

    return AgentType.GENERAL_FAQ


def _build_rag_prompt(user_query: str, context_chunks: list, system_instruction: str) -> str:
    """
    Build a RAG prompt that includes retrieved knowledge context
    so the LLM can generate a grounded response with citations.
    """
    context_text = ""
    for i, chunk in enumerate(context_chunks, 1):
        source_info = f"[Source {i}: {chunk.document_title}"
        if chunk.page_number:
            source_info += f", Page {chunk.page_number}"
        source_info += "]"
        context_text += f"\n{source_info}\n{chunk.text}\n"

    rag_prompt = f"""{system_instruction}

---
RETRIEVED UNIVERSITY DOCUMENTS:
{context_text if context_text else "(No relevant documents found in the knowledge base.)"}
---

IMPORTANT INSTRUCTIONS:
- Answer the student's question using ONLY the retrieved documents above.
- Reference the source numbers [Source 1], [Source 2], etc. in your answer.
- If the retrieved documents do not contain enough information to answer, clearly state that you could not find reliable information and suggest the student contact the relevant university office.
- Do NOT fabricate university policies or procedures.

STUDENT QUESTION: {user_query}
"""
    return rag_prompt


async def handle_query(user_query: str) -> AgentResponse:
    """
    Main orchestration function:
    1. Input security validation & prompt injection check
    2. Intent classification and routing decision
    3. Knowledge base retrieval (RAG)
    4. Delegation to target specialized agent with grounded context
    5. Response aggregation, citation extraction, and output guardrails
    6. Graceful error handling
    """
    # 0. Ensure knowledge base is loaded
    load_knowledge_base()

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
    logger.info(f"Query routed to: {target_agent_type.value}")

    # 3. Knowledge Base Retrieval (RAG)
    try:
        retrieval_result = search_knowledge(
            query=user_query,
            category=target_agent_type.value,
            top_k=5
        )

        # If no results in the specific category, try all categories
        if not retrieval_result.chunks:
            retrieval_result = search_knowledge(
                query=user_query,
                category=None,
                top_k=5
            )

        logger.info(f"Retrieved {len(retrieval_result.chunks)} knowledge chunks")

        # 4. Build RAG prompt and get LLM response
        agent_system_instruction = load_instruction_prompt(target_agent_type)
        rag_prompt = _build_rag_prompt(
            user_query=user_query,
            context_chunks=retrieval_result.chunks,
            system_instruction=agent_system_instruction
        )

        raw_answer = LLMProvider.generate_completion(
            prompt=rag_prompt,
            system_instruction=None,  # Already included in the RAG prompt
            temperature=0.2
        )

        # 5. Extract real citations from retrieved chunks
        citations = []
        seen_titles = set()
        for chunk in retrieval_result.chunks:
            if chunk.document_title not in seen_titles:
                seen_titles.add(chunk.document_title)
                section = f"Page {chunk.page_number}" if chunk.page_number else None
                citations.append(Citation(
                    document_title=chunk.document_title,
                    page_or_section=section,
                ))

        # 6. Output Post-Processing Guard
        return post_process_output(
            raw_answer=raw_answer,
            routed_to=target_agent_type.value,
            citations=citations
        )

    except Exception as ex:
        logger.error(f"Orchestrator error: {ex}", exc_info=True)
        # Graceful Fallback handling
        fallback_answer = (
            "I encountered a technical issue retrieving details for your question. "
            "Please try rephrasing or contact the university helpline directly."
        )
        return AgentResponse(
            answer=fallback_answer,
            routed_to=target_agent_type.value,
            citations=[],
            is_safe=True
        )
