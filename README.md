# 🎓 University FAQ Multi-Agent System

**AI-103 Group Project** · Chitkara University · Topic: University FAQ Multi-Agent (Multi-agent, RAG, orchestration — Microsoft Agent Framework, Foundry IQ, AI Search)

> An AI-powered university information assistant that uses multi-agent orchestration and Retrieval-Augmented Generation (RAG) to answer student questions using official university sources with grounded responses and citations.

---

## 📌 Project Status

**Current Phase:** Build (started September 18, 2026)

This repository is under active development. Build window: Sept 18 – 23, 2026. Final presentations: Sept 24–25.

The architecture described below is deliberately scoped to what a 5-person team can build, integrate, test and explain within this window. It favors one well-implemented routing agent over multiple thin agent modules, and a small hand-verified evaluation set over a large automated one.

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

The backend passes the query to a single FAQ agent. That agent first classifies the query into a domain (academic / student services / general) using a lightweight routing step, then uses that domain to filter retrieval against a shared university knowledge base.

The retrieved evidence is then used to generate a grounded response containing citations to the supporting source material.

Conceptually:

```text
Student
   ↓
React Client
   ↓
FastAPI Backend
   ↓
FAQ Agent (domain classification → retrieval → generation)
   ↓
Knowledge / Retrieval Layer
   ↓
Official University Sources
   ↓
Grounded Answer + Citations
```

**Why one agent instead of three:** with a 5-person team and a ~5-day build window, three independently engineered agents plus an orchestrator multiplies integration and testing surface without adding grading value — "multi-agent" as a concept is satisfied by domain-aware routing and retrieval filtering inside one agent, evaluated the same way a 3-agent system would be. If time remains after the core loop works end-to-end (see Section 19), splitting into separate agent modules is a stretch goal, not a baseline requirement.

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

# 7. Agent Design: Domains and Routing

The system uses **one FAQ agent** with an internal routing step, rather than separate agent processes per domain. The domains below define how queries are classified and how retrieval is filtered — not separate codebases.

### 🎓 Academic domain

Covers:

- attendance
- examinations
- grading
- academic regulations
- academic calendars
- course-related policies

### 🏫 Student services domain

Covers:

- hostel rules
- leave procedures
- campus services
- student facilities
- administrative student processes

### 💬 General domain

Covers university questions that don't clearly fall into the above but are still supported by the approved knowledge base.

### 🧭 Routing step

A lightweight classification step (prompt-based or simple intent tagging) assigns an incoming query to one of the three domains. That domain tag is used purely to filter retrieval against the knowledge base metadata — it does not invoke a separate agent. The routing step should coordinate retrieval scope rather than act as an unrestricted source of university facts.

> **Stretch goal:** if the core system is working reliably well before the Sept 23 deadline, the routing step can be split into genuinely separate agent modules (see Section 21 principle: build the simplest thing that works, then improve it based on evidence).

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
│      FAQ Agent      │
│  (domain routing →  │
│   retrieval filter) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
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

### AI / Agent Layer

- Microsoft Foundry (hosted model for generation and the FAQ agent's routing/classification step)

### Retrieval / Knowledge Layer

- Azure AI Search (index + retrieval over the university document corpus)

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
│   ├── api/
│   ├── agents/
│   ├── rag/
│   ├── services/
│   ├── models/
│   └── tests/
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
│   └── security.md
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

- specialized agents
- orchestrator
- routing
- agent instructions
- knowledge integration
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
| Retrieval-Augmented Generation (RAG) | `backend/rag/` — ingestion, chunking, indexing, retrieval, grounded generation |
| Agents & tools | `backend/agents/` — FAQ agent with domain-routing tool and retrieval tool |
| Orchestration / multi-agent concept | Domain classification step inside the FAQ agent, filtering retrieval by domain (see Section 7) |
| Responsible AI | Grounded-refusal behavior (Section 18), `docs/security.md`, `RESPONSIBLE_AI.md` |
| Azure AI services | Microsoft Foundry (generation/routing), Azure AI Search (retrieval) — see Section 11 |

# 22. Current Development Principle

> Build the simplest architecture that satisfies the requirements reliably, then improve it based on evidence.

The project should demonstrate engineering depth through **correct design, retrieval quality, orchestration, evaluation, reliability and explainability**, rather than unnecessary complexity.