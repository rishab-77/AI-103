import time
from typing import Dict, Any, List
from backend.models.schemas import Citation

def run_agent_thread(project_client, agent, user_message: str, timeout_seconds: int = 60) -> Dict[str, Any]:
    """
    Creates a thread, posts the user query, creates an agent run,
    polls until completion, and extracts the generated response and citations.
    """
    agents_client = project_client.agents
    
    # 1. Create conversation thread
    thread = agents_client.create_thread()
    
    # 2. Add student message to thread
    agents_client.create_message(
        thread_id=thread.id,
        role="user",
        content=user_message
    )
    
    # 3. Trigger run execution
    run = agents_client.create_run(
        thread_id=thread.id,
        agent_id=agent.id
    )
    
    # 4. Poll until completion or timeout
    start_time = time.time()
    while run.status in ("queued", "in_progress", "requires_action"):
        if time.time() - start_time > timeout_seconds:
            raise TimeoutError("Agent execution timed out.")
        time.sleep(1)
        run = agents_client.get_run(thread_id=thread.id, run_id=run.id)

    if run.status != "completed":
        raise RuntimeError(f"Agent execution failed with status: {run.status}")

    # 5. Retrieve output messages
    messages = agents_client.list_messages(thread_id=thread.id)
    assistant_messages = [m for m in messages.data if m.role == "assistant"]
    
    if not assistant_messages:
        return {"answer": "No response returned by agent.", "citations": []}

    latest_msg = assistant_messages[0]
    raw_answer = latest_msg.content[0].text.value if latest_msg.content else ""
    
    # 6. Extract annotations/citations if present
    citations: List[Citation] = []
    if latest_msg.content and hasattr(latest_msg.content[0].text, 'annotations'):
        for ann in latest_msg.content[0].text.annotations:
            if hasattr(ann, 'file_citation'):
                citations.append(Citation(
                    document_title=getattr(ann.file_citation, 'file_id', 'Official Document'),
                    page_or_section=getattr(ann.file_citation, 'quote', None)
                ))

    return {
        "answer": raw_answer,
        "citations": citations
    }
