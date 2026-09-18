# 🎓 University FAQ Multi-Agent System

**AI-103 Group Project** · Chitkara University · Topic: University FAQ Multi-Agent (Multi-agent, RAG, orchestration — Microsoft Agent Framework, Foundry IQ, AI Search)

> An AI-powered university information assistant that uses multi-agent orchestration and Retrieval-Augmented Generation (RAG) to answer student questions using official university sources with grounded responses and citations.

---

## 📌 Project Status

**Current Phase:** Build (started September 18, 2026)

This repository is under active development. Build window: Sept 18 – 23, 2026. Final presentations: Sept 24–25.

The architecture described below is a 3-agent system (Academic, Student Services, General FAQ) plus an LLM-based orchestrator for routing — following Priyansh's Foundry Agents SDK implementation plan (`azure-ai-projects`, `AzureAISearchTool`, per-agent instruction files). This is heavier than a single-agent design, but shared infrastructure (client, search tool, thread/run lifecycle) is reused across all three agents, so the marginal cost of 3 agents over 1 is mainly the instruction files and routing tests, not 3x the integration work.

Major architectural changes must be discussed with the team before implementation.

---

# 1. Problem Statement

University students frequently need information about:

- academic regulations
- attendance requirements
- examinations
- grading policies
- academic calendars
- hostel rules
- leave procedures
- student services
- university policies
- administrative processes

This information is often distributed across multiple official documents, PDFs, portals, notices, and web pages.

Students may therefore need to search through multiple sources or contact university staff even for common questions.

The goal of this project is to build an AI-powered university FAQ system capable of retrieving relevant information from approved university sources and producing clear, grounded answers with source citations.

The system should avoid confidently answering questions when sufficient supporting information cannot be found.

---

# 2. Proposed Solution

We are building a **University FAQ Multi-Agent System**.

A student asks a question through a web interface.

The backend passes the query to an **orchestrator agent** (a Foundry agent with a classification-only prompt and no tools). The orchestrator classifies the query into a domain — academic, student services, or general — and delegates it to the matching specialized agent.

Each specialized agent is wired to a shared university knowledge index via `AzureAISearchTool` and generates a grounded response with citations from the retrieved evidence.

Conceptually:

```text
Student
   ↓
React Client
   ↓
FastAPI Backend
   ↓
Orchestrator Agent (LLM classifier, no tools)
   ↓
Academic / Student Services / General FAQ Agent
   ↓
AzureAISearchTool → Knowledge / Retrieval Layer
   ↓
Official University Sources
   ↓
Grounded Answer + Citations
```

**Why 3 agents + an orchestrator, not one routing agent:** the client, search tool wiring, and thread/run lifecycle are built once and reused across all three specialized agents (see `backend/agents/client.py`, `tools.py`, `runner.py`), so the marginal engineering cost of separate agents is mainly writing 3 focused instruction files instead of 1 and a few extra routing test cases — not 3x the integration surface. This gives each agent a narrower, easier-to-verify scope than one agent trying to hold all three domains' instructions at once.

---

# 3. Project Goals

The system should:

- answer common university-related student questions
- retrieve information from approved university sources
- use RAG to ground generated answers
- provide citations or source references
- route queries to appropriate specialized agents
- handle unsupported or out-of-scope questions safely
- avoid fabricating university policies
- provide a simple student-facing chat experience
- support evaluation of retrieval and answer quality
- demonstrate responsible AI practices
- be deployable using Microsoft Azure services

The project should demonstrate meaningful engineering rather than simply wrapping an LLM API.

---

# 4. Non-Goals

The initial version is **not** intended to:

- replace official university authorities
- make administrative decisions for students
- modify university records
- provide access to private student data
- perform financial transactions
- guarantee that every university document is current
- answer unsupported questions using model knowledge as if they were official university policy

The assistant should clearly communicate when reliable supporting information is unavailable.

---

# 5. Target Users

### Primary User

**University Student**

Students should be able to ask natural-language questions such as:

```text
What is the hostel gate-pass procedure?

What are the attendance requirements?

How does the grading system work?

What happens if I miss an examination?

Where can I find information about hostel rules?
```

### Secondary Users

For the prototype, faculty or administrative users may also use the system to query the same approved knowledge base.

The primary design focus remains the student experience.

---

# 6. Core System Capabilities

The initial system is expected to support:

### Question Answering

Students can submit university-related questions through a conversational interface.

### Retrieval-Augmented Generation

Relevant information is retrieved from approved university documents before generating factual university answers.

### Multi-Agent Routing

Questions are routed to specialized agents based on their domain.

### Grounded Responses

Generated responses should be based on retrieved university information rather than unsupported model knowledge.

### Source Attribution

Answers should expose the supporting source/document information whenever available.

### Failure Handling

The system should handle cases such as:

- no relevant information found
- ambiguous questions
- conflicting sources
- potentially outdated documents
- out-of-scope questions
- retrieval failures
- model/service failures

---

# 7. Planned Agent Responsibilities

Each agent below is a real Foundry agent (`project_client.agents.create_agent()`) with its own instruction file under `backend/agents/instructions/`, wired to `AzureAISearchTool`. Instruction files are kept in separate `.md` files for easy review and iteration.

### 🎓 Academic Agent

Responsible for academic-policy questions such as:

- attendance
- examinations
- grading
- academic regulations
- academic calendars
- course-related policies

### 🏫 Student Services Agent

Responsible for student-life and university-service questions such as:

- hostel rules
- leave procedures
- campus services
- student facilities
- administrative student processes

### 💬 General FAQ Agent

Handles general university questions that do not clearly belong to another specialized domain but are still supported by the approved knowledge base.

### 🧭 Orchestrator

A Foundry agent with a classification-only system prompt and **no tools**. Determines which specialized agent should handle an incoming query and returns a structured routing decision (`academic` / `student_services` / `general_faq`). The orchestrator coordinates routing rather than acting as an unrestricted source of university facts.

Each agent's instructions include: role definition and scope boundaries, an instruction to answer only from retrieved context (grounding), an instruction to cite sources with document title/page/URL, an instruction to decline when no relevant information is found, and responsible-AI guardrails (no personal data, no speculation, no policy invention).

---

# 8. RAG / Knowledge Architecture

The planned retrieval pipeline is:

```text
Official University Sources
        ↓
Document Collection
        ↓
Extraction / Parsing
        ↓
Cleaning
        ↓
Chunking
        ↓
Metadata Enrichment
        ↓
Indexing / Embeddings
        ↓
Retrieval
        ↓
Relevant Context
        ↓
LLM / Agent
        ↓
Grounded Answer
        ↓
Citation / Source Attribution
```

Important metadata may include:

- document title
- source URL
- document category
- publication/version date
- collection date
- section/page information
- currentness/verification status

Exact chunking, retrieval, ranking, embedding, and indexing strategies will be documented as the RAG architecture is finalized.

---

# 9. Knowledge Source Policy

University factual answers should be grounded in **approved university sources** whenever possible.

Potential sources include:

- official university PDFs
- academic regulations
- examination policies
- hostel regulations
- academic calendars
- official FAQ pages
- official university webpages
- approved notices and policy documents

Each collected source should preserve enough metadata to identify where the information originated.

Documents should not automatically be assumed to be current merely because they are official.

Where possible, the knowledge pipeline should track document dates or versions.

---

# 10. High-Level Architecture

```text
┌─────────────────────┐
│       Student       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    React Frontend   │
└──────────┬──────────┘
           │ HTTP/API
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Orchestrator Agent  │
│  (LLM classifier)   │
└──────────┬──────────┘
           │
     ┌─────┼───────────┐
     ▼     ▼           ▼
 Academic Student    General
  Agent   Services    FAQ
          Agent       Agent
     └─────┬───────────┘
           │
           ▼
┌─────────────────────┐
│ AzureAISearchTool /  │
│ Knowledge/RAG Layer │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Approved University │
│       Sources       │
└─────────────────────┘
```

A detailed architecture diagram will be maintained separately as the design is finalized.

---

# 11. Technology Stack

### Frontend

- React
- Vite

### Backend

- Python
- FastAPI
- `azure-ai-projects` SDK (`AIProjectClient.agents`) for agent creation, threads, and runs
- `azure-identity` (`DefaultAzureCredential`) — no API keys in code

### AI / Agent Layer

- Microsoft Foundry — orchestrator agent (classifier, no tools) + 3 specialized agents (Academic, Student Services, General FAQ)
- `AzureAISearchTool` (built into the agents SDK) wired to each specialized agent — no custom retrieval code needed

### Retrieval / Knowledge Layer

- Azure AI Search (index + retrieval over the university document corpus)

### Security / Safety Layer

- 3-layer input validation: basic checks → regex prompt-injection patterns → Azure AI Content Safety (Prompt Shields)
- Output guard: strip leaked system-prompt content, enforce citation presence, flag possible fabrication, attach standard disclaimer

### Deployment

- Azure App Service (or equivalent simple hosting) for backend + frontend, using the Azure for Students credits already activated on the team
- Secrets via environment variables only — never committed (see Section 17)

Services are locked in now rather than left open, so no build day is lost to re-deciding mid-week.

---

# 12. Proposed Repository Structure

```text
university-faq-agent/
│
├── backend/
│   ├── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── agents/
│   │   ├── client.py
│   │   ├── tools.py
│   │   ├── registry.py
│   │   ├── orchestrator.py
│   │   ├── runner.py
│   │   └── instructions/
│   │       ├── orchestrator.md
│   │       ├── academic_agent.md
│   │       ├── student_services_agent.md
│   │       └── general_faq_agent.md
│   ├── api/
│   │   └── routes.py
│   ├── models/
│   │   └── schemas.py
│   ├── services/
│   │   ├── safety.py
│   │   └── output_guard.py
│   ├── rag/
│   └── tests/
│       ├── test_routing.py
│       ├── test_safety.py
│       └── test_end_to_end.py
│
├── frontend/
│
├── knowledge/
│   ├── raw/
│   ├── processed/
│   └── metadata/
│
├── evaluation/
│   ├── questions.md
│   └── results.md
│
├── docs/
│   ├── architecture.md
│   ├── SECURITY.md
│   └── RESPONSIBLE_AI.md
│
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

The structure may evolve as implementation begins, but significant structural changes should be discussed before being introduced.

---

# 13. Team Responsibilities

The project is divided into the following engineering areas.

### Architecture & Requirements

Responsibilities:

- overall system architecture
- requirements
- RAG architecture
- Azure architecture
- API/component boundaries
- technical decisions and trade-offs
- integration review

### Knowledge Base

Responsibilities:

- collect official university sources
- validate source quality
- preserve source metadata
- identify potentially outdated/conflicting documents
- maintain the knowledge manifest

### RAG & Retrieval

Responsibilities:

- document extraction
- cleaning
- chunking
- metadata
- indexing
- retrieval
- source attribution
- retrieval failure handling

### Multi-Agent System

Responsibilities:

- orchestrator agent (LLM classifier, no tools)
- 3 specialized agents (Academic, Student Services, General FAQ) via `azure-ai-projects`
- `AzureAISearchTool` wiring per agent
- agent instruction files
- thread/run lifecycle handling
- fallback behavior

### Frontend

Responsibilities:

- student chat interface (input, send, answer, sources list)
- API integration
- basic loading and error states
- citation display

Polish (animations, full responsive design, conversation history) is a Day 21 stretch item only — not required for the core deliverable.

### Evaluation & Reliability

Responsibilities:

- ~15–20 hand-written test questions covering: normal, ambiguous, out-of-scope, and one adversarial/prompt-injection example
- manually running each question against the working system and recording pass/fail
- a single results table in `evaluation/results.md` (question → expected behavior → actual result)
- documenting known failure cases

### Deployment

Responsibilities:

- Azure resources
- application deployment
- configuration
- environment variables
- CI/CD
- health checks

### Security & Responsible AI

Responsibilities:

- prompt-injection considerations
- grounding
- unsupported-answer handling
- secrets management
- privacy considerations
- transparency
- limitations
- human oversight

---

# 14. Development Workflow

The `main` branch represents reviewed and approved project work.

Development should follow:

```text
GitHub Issue
     ↓
Feature Branch
     ↓
Implementation
     ↓
Local Testing
     ↓
Self Review
     ↓
Pull Request
     ↓
Team Review
     ↓
Merge
```

No CI pipeline for this project — team review plus running the app locally before merge is enough at this scale and timeline.

Example branch names:

```text
feature/2-knowledge-base
feature/3-rag
feature/4-multi-agent
feature/5-frontend
feature/6-evaluation
feature/7-deployment
```

Do **not** work directly on `main`.

---

# 15. Pull Request Expectations

Every significant PR should explain:

- what changed
- why it changed
- how it was tested
- dependencies introduced
- known limitations
- screenshots/logs/results where relevant

Code should not be merged simply because it runs.

Review should consider:

- correctness
- architecture consistency
- maintainability
- security
- error handling
- tests
- API compatibility
- configuration
- unnecessary dependencies
- duplicated/dead code

---

# 16. AI-Assisted Development Policy

AI coding assistants may be used to help:

- understand unfamiliar concepts
- implement approved designs
- debug
- refactor
- generate tests
- review code
- research alternatives

However:

> **No team member should submit or merge code they cannot explain.**

AI assistants should not independently redefine the project's architecture.

Major changes involving architecture, services, APIs, dependencies, agent responsibilities, or data contracts should be discussed with the team first.

---

# 17. Security Rules

### Never commit:

```text
API keys
access tokens
passwords
connection strings
private credentials
.env files containing secrets
```

Use environment variables for configuration.

A `.env.example` may document required variable names but must contain no real credentials.

If a credential is accidentally committed, notify the team immediately so it can be revoked/rotated.

---

# 18. Reliability Principles

The assistant should prefer:

> "I couldn't find reliable information in the approved university sources."

over inventing a university rule.

The system should be explicitly tested for:

- unsupported questions
- missing information
- ambiguous questions
- conflicting information
- outdated sources
- incorrect routing
- retrieval failures
- incorrect citations
- prompt injection attempts

---

# 19. Engineering Timeline

Build actually starts **Sept 18** (not Sept 16), so the timeline is compressed against the original 8-day plan. Team members and per-person daily goals are tracked separately in `docs/team-plan.md` — this table is the milestone summary.

| Date | Milestone |
|---|---|
| Sept 18 (today) | Architecture locked (this README + `docs/architecture.md`), knowledge sources collected and classified, Azure resources activated, frontend started against mocked data |
| Sept 19 | Working RAG pipeline: one real question → retrieved chunk → grounded answer with citation |
| Sept 20 | Routing step added (domain classification → filtered retrieval); frontend connected to real backend |
| Sept 21 | Full integration test pass: normal, ambiguous, out-of-scope, cross-domain, adversarial questions; fix what breaks |
| Sept 22 | Evaluation run + results recorded; deployment; security/responsible-AI checks; polish only if core is solid |
| Sept 23 | Final verification: clean clone, README walkthrough, video recorded, links submitted |

After Sept 21's integration pass, avoid architectural changes unless required to fix a critical issue — remaining time goes to testing, evaluation, and the video, not new features.

---

# 20. Definition of Project Success

The project is successful when we can demonstrate:

```text
Student Question
       ↓
Correct Routing
       ↓
Relevant Official Information Retrieved
       ↓
Grounded Answer Generated
       ↓
Supporting Sources Displayed
```

while also demonstrating:

- reliable failure handling
- clear architecture
- modular implementation
- evaluation evidence
- responsible AI practices
- secure configuration
- deployability
- technical decisions the entire team can explain

---

# 21. AI-103 Concepts Applied

| AI-103 Concept | Where it lives in this project |
|---|---|
| Retrieval-Augmented Generation (RAG) | `backend/rag/` (ingestion, indexing) + `AzureAISearchTool` per agent (`backend/agents/tools.py`) |
| Agents & tools | `backend/agents/registry.py` — 3 Foundry agents, each with `AzureAISearchTool` |
| Multi-agent orchestration | `backend/agents/orchestrator.py` — LLM-based classifier routes to the correct specialized agent |
| Responsible AI | Grounded-refusal instructions per agent, `docs/SECURITY.md`, `docs/RESPONSIBLE_AI.md`, 3-layer input validation |
| Azure AI services | Microsoft Foundry (agents, orchestrator), Azure AI Search (retrieval), Azure AI Content Safety (Prompt Shields) |

# 22. Current Development Principle

> Build the simplest architecture that satisfies the requirements reliably, then improve it based on evidence.

The project should demonstrate engineering depth through **correct design, retrieval quality, orchestration, evaluation, reliability and explainability**, rather than unnecessary complexity.