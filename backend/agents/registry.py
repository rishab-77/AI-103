from enum import Enum
import pathlib
from backend.agents.client import get_project_client
from backend.agents.tools import build_search_tool
from backend.config import settings

class AgentType(str, Enum):
    ACADEMIC = "academic"
    STUDENT_SERVICES = "student_services"
    GENERAL_FAQ = "general_faq"

INSTRUCTIONS_DIR = pathlib.Path(__file__).parent / "instructions"

_agent_cache = {}

def load_instruction_prompt(agent_type: AgentType) -> str:
    """Reads system prompt instructions from local markdown file."""
    filename_map = {
        AgentType.ACADEMIC: "academic_agent.md",
        AgentType.STUDENT_SERVICES: "student_services_agent.md",
        AgentType.GENERAL_FAQ: "general_faq_agent.md",
    }
    file_path = INSTRUCTIONS_DIR / filename_map[agent_type]
    if file_path.exists():
        return file_path.read_text(encoding="utf-8")
    return "You are an official university assistant."

def get_or_create_agent(agent_type: AgentType):
    """Retrieves cached agent or creates a new agent using Azure AI Foundry Agent Service."""
    if agent_type in _agent_cache:
        return _agent_cache[agent_type]

    project_client = get_project_client()
    instructions = load_instruction_prompt(agent_type)
    search_tool = build_search_tool()
    tools = [search_tool] if search_tool else []

    agent = project_client.agents.create_agent(
        model=settings.MODEL_DEPLOYMENT_NAME,
        name=f"university-{agent_type.value}-agent",
        instructions=instructions,
        tools=tools
    )
    
    _agent_cache[agent_type] = agent
    return agent
