import pytest
from backend.agents.orchestrator import classify_query
from backend.agents.registry import AgentType

ROUTING_TEST_CASES = [
    # Academic queries
    ("What is the attendance policy for end-sem exams?", AgentType.ACADEMIC),
    ("How does CGPA calculation work for backlogs?", AgentType.ACADEMIC),
    ("When is the last date to drop a course?", AgentType.ACADEMIC),
    ("What is the re-evaluation procedure for answer scripts?", AgentType.ACADEMIC),

    # Student Services queries
    ("What is the hostel gate-pass procedure for outstation trips?", AgentType.STUDENT_SERVICES),
    ("Where can I apply for a duplicate student ID card?", AgentType.STUDENT_SERVICES),
    ("What are the mess timings on Sundays?", AgentType.STUDENT_SERVICES),
    ("How do I request hostel room maintenance?", AgentType.STUDENT_SERVICES),

    # General FAQ queries
    ("Where is the university main campus located?", AgentType.GENERAL_FAQ),
    ("What is the official contact number of the reception?", AgentType.GENERAL_FAQ),
    ("Tell me about the university history.", AgentType.GENERAL_FAQ),
]

@pytest.mark.parametrize("query,expected_agent", ROUTING_TEST_CASES)
def test_agent_routing_classification(query, expected_agent):
    result = classify_query(query)
    assert result == expected_agent, f"Failed for query: '{query}'. Got: {result}, Expected: {expected_agent}"
