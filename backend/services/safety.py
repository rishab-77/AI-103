import re
from typing import Optional
from dataclasses import dataclass
from backend.config import settings

@dataclass
class SafetyResult:
    is_safe: bool
    reason: Optional[str] = None
    detail: Optional[str] = None

# Known Prompt Injection and Jailbreak Patterns
INJECTION_PATTERNS = [
    r"(ignore|disregard)\s+(all\s+|the\s+)?(previous|above|prior)?\s*(instructions|prompts|rules)",
    r"you\s+are\s+now\s+(in\s+)?(DAN|developer|unrestricted)\s+mode",
    r"act\s+as\s+an?\s+(unrestricted|jailbroken|evil)\s+AI",
    r"reveal\s+(your|the)\s+(system\s+)?(instructions|prompt)",
    r"disregard\s+(your|the|the\s+above)\s+(system\s+)?(prompt|instructions)",
    r"print\s+(your|the)\s+initial\s+prompt",
    r"bypass\s+(safety|content)\s+(filter|policy|guardrails)",
]

def validate_basic_input(query: str) -> SafetyResult:
    """Validate basic structure, non-emptiness, and length bounds."""
    if not query or not query.strip():
        return SafetyResult(is_safe=False, reason="empty_query", detail="Query cannot be empty.")
    
    if len(query) > 2000:
        return SafetyResult(is_safe=False, reason="exceeds_length_limit", detail="Query exceeds maximum allowed length of 2000 characters.")
    
    return SafetyResult(is_safe=True)

def check_prompt_injection(query: str) -> SafetyResult:
    """Check against known adversarial prompt injection patterns."""
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            return SafetyResult(
                is_safe=False,
                reason="prompt_injection_detected",
                detail="Security Guardrail: Potential prompt injection or system override pattern detected."
            )
    return SafetyResult(is_safe=True)

async def check_azure_content_safety(query: str) -> SafetyResult:
    """Check query against Azure Content Safety (Prompt Shields) if configured."""
    if not settings.CONTENT_SAFETY_ENDPOINT or not settings.CONTENT_SAFETY_KEY:
        return SafetyResult(is_safe=True)
    
    try:
        from azure.ai.contentsafety import ContentSafetyClient
        from azure.ai.contentsafety.models import AnalyzeTextOptions
        from azure.core.credentials import AzureKeyCredential

        client = ContentSafetyClient(
            endpoint=settings.CONTENT_SAFETY_ENDPOINT,
            credential=AzureKeyCredential(settings.CONTENT_SAFETY_KEY)
        )
        
        request = AnalyzeTextOptions(text=query)
        response = client.analyze_text(request)
        
        # Check severity of harm categories
        for item in response.categories_analysis:
            if item.severity >= 2: # Moderate or high severity threshold
                return SafetyResult(
                    is_safe=False,
                    reason=f"content_flagged_{item.category.lower()}",
                    detail=f"Content Safety Guardrail: Flagged under {item.category} category."
                )
    except Exception as ex:
        # Fallback gracefully if Content Safety service call fails or is unreachable
        pass

    return SafetyResult(is_safe=True)

async def validate_student_query(query: str) -> SafetyResult:
    """Multi-layer safety evaluation pipeline."""
    # Layer 1: Basic structural checks
    basic_res = validate_basic_input(query)
    if not basic_res.is_safe:
        return basic_res

    # Layer 2: Pattern-based Prompt Injection detection
    injection_res = check_prompt_injection(query)
    if not injection_res.is_safe:
        return injection_res

    # Layer 3: Azure Content Safety service integration
    content_res = await check_azure_content_safety(query)
    if not content_res.is_safe:
        return content_res

    return SafetyResult(is_safe=True)
