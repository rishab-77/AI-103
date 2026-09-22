# AI-103: University FAQ Multi-Agent System

> An AI-powered university information assistant that uses multi-agent orchestration and Retrieval-Augmented Generation (RAG) to answer student questions using official university sources with grounded responses and citations.

---

## 📌 2. Project Status

| Component / Feature | Current Status | Notes |
|---|---|---|
| **Overall Architecture & Specification** | 🟢 **Implemented** | Agreed foundational architecture & contracts defined |
| **Frontend Chat Interface (Issue #5)** | 🟢 **Implemented (Mocked)** | React + Vite UI with all 7 visual states, ready for API swap |
| **Azure Deployment Plan (Issue #7)** | 🟢 **Implemented (Research)** | Documented in `docs/azure-deployment.md`; no resources provisioned yet |
| **Knowledge Base Collection (Issue #2)** | 🟡 **In Progress** | Raw directory taxonomy created; collection underway |
| **FastAPI Backend Foundation** | 🔴 **Planned** | Python service structure to be initialized |
| **Azure AI Search & RAG Pipeline (Issue #3)** | 🔴 **Planned** | Indexing, chunking, and semantic retrieval |
| **Multi-Agent Orchestrator (Issue #4)** | 🔴 **Planned** | Microsoft Foundry agent orchestration & domain agents |
| **Safety & Content Guardrails** | 🔴 **Planned** | Input validation, Prompt Shields, output grounding |
| **Evaluation Suite (Issue #6)** | 🔴 **Planned** | Groundedness, retrieval precision, and routing benchmarks |

---

## 3. Problem Statement

University students frequently need access to institutional policies regarding:
- Academic regulations & grading policies
- Attendance minimums & condonation rules
- Examination schedules & backlog policies
- Hostel rules, curfew timings, and gate-pass procedures
- Leave applications & student administrative processes

Currently, this critical information is fragmented across extensive PDF handbooks, physical notice boards, and disparate institutional portals. Consequently, students often struggle to locate current rules or overburden administrative staff.

The objective of this project is to provide a unified, conversational assistant that retrieves precise passages from **approved university sources** and generates factual answers accompanied by verifiable citations, refusing to hallucinate when information is absent.

---

## 4. Proposed Solution

The **University FAQ Multi-Agent System** connects students with specialized AI agents grounded in official documentation:

```text
Student
   ↓ (Natural Language Query)
React Client (Vite SPA)
   ↓ (HTTP POST /api/ask)
FastAPI Backend
   ↓ (Query Dispatch)
Orchestrator Agent (Microsoft Foundry)
   ↓ (Domain Routing)
Specialized Agent (Academic / Student Services / General FAQ)
   ↓ (Retrieval Tool: AzureAISearchTool)
Azure AI Search (Vector + Semantic Index)
   ↓ (Grounded Context)
Language Model Generation
   ↓ (Cited Response)
Grounded Answer + Citations
```

---

## 5. Project Goals

- **Grounded Responses:** Answer student queries strictly based on verified university documents.
- **Verifiable Citations:** Accompany every answer with document names and page references.
- **Specialized Routing:** Route domain-specific queries to dedicated agents (Academic, Student Services, General FAQ).
- **Graceful Failure Handling:** Explicitly state when documentation is missing or ambiguous rather than fabricating answers.
- **Responsible AI:** Integrate guardrails against prompt injection and unsafe content.
- **Cloud-Ready:** Designed for cost-efficient deployment on Microsoft Azure.

---

## 6. Non-Goals

The system is **not** intended to:
- Act as an administrative authority or grant official exceptions.
- Mutate official student records or process financial transactions.
- Access private student data or student grades.
- Guess or extrapolate university policies when source documents are missing.

---

## 7. Target Users

- **Primary Users:** University students seeking quick, accurate clarification on academic and campus guidelines.
- **Secondary Users:** Faculty advisors, department coordinators, and administrative helpdesk staff querying policy documentation.

---

## 8. Core System Capabilities

1. **Conversational Question Answering:** Natural language interface for querying university procedures.
2. **Retrieval-Augmented Generation (RAG):** Context retrieval from indexed documents prior to answer synthesis.
3. **Multi-Agent Orchestration:** Intent-based routing to specialized domain experts.
4. **Source Attribution:** Interactive citation badges displaying source document titles and page numbers.
5. **Failure & Uncertainty Handling:** Safe fallback messaging when evidence is insufficient.

---

## 9. Planned Agent Responsibilities

```text
┌─────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                   │
│  - Analyzes intent & classifies query domain            │
│  - Routes request to the appropriate specialized agent   │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               ▼                  ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│     Academic Agent     │  │ Student Services Agent │  │    General FAQ Agent   │
│ - Attendance rules     │  │ - Hostel rules & gate  │  │ - Campus facilities    │
│ - Exam regulations     │  │   passes               │  │ - Library timings      │
│ - Grading & backlogs   │  │ - Leave applications   │  │ - General inquiries    │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

---

## 10. RAG / Knowledge Architecture

The planned RAG pipeline processes approved institutional documents as follows:

```text
Official University Sources (PDFs / Notices)
         ↓
Document Extraction & Text Cleaning
         ↓
Semantic Chunking & Metadata Enrichment (Document, Section, Page, Year)
         ↓
Vector Embeddings Generation
         ↓
Azure AI Search (Hybrid Vector + Keyword Index)
         ↓
AzureAISearchTool Retrieval via Specialized Agent
         ↓
LLM Synthesis with Grounding System Prompt
         ↓
Grounded Answer with Extracted Citations
```

---

## 11. Knowledge Source Policy

- **Approved Sources Only:** Answers must originate from official university documentation (Academic Handbooks, Examination Bye-Laws, Hostel Rules).
- **Metadata Preservation:** Every indexed passage must retain its document name, publication date, and page number.
- **Version Awareness:** When policies change across academic years, the latest verified version takes precedence.

---

## 12. High-Level Architecture

```text
┌────────────────────────┐
│     Student User       │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ React Frontend (Vite)  │  [Status: Implemented / Mocked]
└───────────┬────────────┘
            │ HTTP /api/ask
            ▼
┌────────────────────────┐
│    FastAPI Backend     │  [Status: Planned]
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   Orchestrator Agent   │  [Status: Planned - Microsoft Foundry]
└───────────┬────────────┘
     ┌──────┴──────────────────────────┐
     ▼                                 ▼
┌────────────────────────┐   ┌────────────────────────┐
│   Academic Agent       │   │ Student Services Agent │  [Status: Planned]
└───────────┬────────────┘   └─────────┬──────────────┘
            │                          │
            └───────────┬──────────────┘
                        │ AzureAISearchTool
                        ▼
            ┌────────────────────────┐
            │   Azure AI Search      │  [Status: Planned - RAG Index]
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  Official Knowledge    │  [Status: In Progress]
            └────────────────────────┘
```

---

## 13. Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS with custom design tokens (Dark Academic Theme)
- **State Management:** React Hooks (`useState`, `useEffect`, `useRef`)

### Backend (Planned)
- **Framework:** Python 3.11+ / FastAPI
- **SDKs:** `azure-ai-projects`, `azure-identity` (`DefaultAzureCredential`)

### AI & Retrieval Layer (Planned)
- **Agent Platform:** Microsoft Foundry Agent Framework
- **Retrieval Engine:** Azure AI Search (`AzureAISearchTool`)
- **Foundational Models:** Azure OpenAI (GPT-4o / GPT-4o-mini)

### Safety & Guardrails (Planned)
- **Content Moderation:** Azure AI Content Safety
- **Prompt Shielding:** Protection against prompt injection and jailbreaks

### Deployment & DevOps
- **Frontend Hosting:** Azure Static Web Apps (Planned)
- **Backend Hosting:** Azure App Service (Planned)
- **Secrets Management:** Azure Key Vault (Planned)
- **CI/CD:** GitHub Actions (Planned)

---

## 14. Repository Structure

```text
AI-103/
├── backend/                  # (Planned) FastAPI application & agent implementations
│   ├── api/                  # API routes and request schemas
│   ├── agents/               # Orchestrator and specialized agent definitions
│   ├── rag/                  # Document processing and search tool integrations
│   ├── services/             # Core business logic
│   ├── config.py             # App configuration and environment variable loading
│   └── main.py               # FastAPI entry point
│
├── frontend/                 # (Implemented) React + Vite client
│   ├── src/
│   │   ├── components/       # UI components (ChatInput, MessageBubble, SourceCard, etc.)
│   │   ├── pages/            # Page layouts (ChatPage.jsx)
│   │   ├── services/         # API abstraction layer (mockApi.js)
│   │   ├── App.css           # Custom theme design tokens and styles
│   │   └── main.jsx          # React mount entry point
│   ├── index.html
│   └── package.json
│
├── knowledge/                # (In Progress) Official institutional knowledge base
│   ├── raw/                  # Source documents (academic, general, student-services)
│   ├── processed/            # Cleaned and chunked text ready for indexing
│   └── metadata/             # Source manifests, versioning, and provenance
│
├── evaluation/               # (Planned) Test datasets, retrieval metrics, and benchmarks
│
├── docs/                     # Project technical documentation
│   ├── azure-deployment.md   # (Implemented) Azure architecture and deployment plan
│   ├── architecture.md       # Detailed system design specifications
│   └── security.md           # Security and responsible AI guidelines
│
├── .gitignore
└── README.md                 # Project source of truth
```

---

## 15. Team Responsibilities

| Area | Lead Focus | Key Deliverables |
|---|---|---|
| **Frontend & UI (Issue #5)** | Student Chat Interface | React/Vite chat page, state management, citation cards, mock API |
| **Deployment (Issue #7)** | Azure Infrastructure | Deployment research, resource planning, Key Vault integration |
| **Knowledge Base (Issue #2)** | Document Pipeline | Collecting handbooks, metadata schema, cleaning & chunking |
| **RAG & Search (Issue #3)** | Retrieval Engine | Azure AI Search vector indexing, hybrid search, retrieval evaluation |
| **Multi-Agent System (Issue #4)**| Agent Orchestration | Microsoft Foundry agents, prompt engineering, domain routing |
| **Evaluation & QA (Issue #6)** | System Benchmarking | Groundedness tests, citation validation, adversarial safety tests |

---

## 16. Development Workflow

All contributions adhere to a structured Git workflow:

```text
GitHub Issue Assigned
         ↓
Create Feature Branch (e.g. feature/proch)
         ↓
Local Implementation & Testing
         ↓
Pull Request against main
         ↓
Peer Code Review & Automated CI Checks
         ↓
Merge into main
```

> **Safety Rule:** Direct commits to `main` are strictly prohibited. Development occurs on dedicated feature branches.

---

## 17. Pull Request Expectations

Every pull request must document:
- Purpose of the change and associated Issue number
- Implementation details and architectural decisions
- Verification evidence (build logs, local test results, screenshots)
- Any new dependencies introduced and their rationale

---

## 18. AI-Assisted Development Policy

AI tools may assist in code generation, refactoring, and test creation under the following strict rule:
> **No team member may commit code that they cannot explain.**
Every engineer must understand and be ready to defend their implementation during evaluations.

---

## 19. Security Rules

- **Zero Secret Commits:** Never commit `.env` files, API keys, or connection strings to git.
- **Default Azure Credentials:** Use `DefaultAzureCredential` and Azure Key Vault for production credentials.
- **Input Sanitization:** Sanitize all user inputs before dispatching to agents.

---

## 20. Reliability Principles

- **Prefer Honesty over Fabrication:** The assistant must reply *"I could not find reliable information in the approved sources"* rather than guessing.
- **Explicit Grounding:** Answers without matching source citations are rejected by guardrails.

---

## 21. Engineering Timeline

| Milestone | Target Date | Scope | Status |
|---|---|---|---|
| M1: Foundation | Sept 16 | Specification, Architecture, & Repository Scaffolding | 🟢 Completed |
| M2: Frontend & Docs | Sept 20 | React Chat UI (Mocked) & Azure Deployment Plan | 🟢 Completed |
| M3: RAG & Knowledge | Sept 21 | Knowledge ingestion & Azure AI Search indexing | 🟡 In Progress |
| M4: Multi-Agent Backend | Sept 22 | Foundry Agent Orchestrator & FastAPI endpoints | 🔴 Planned |
| M5: End-to-End Freeze | Sept 23 | API integration, Evaluation, & Final Demo | 🔴 Planned |

---

## 22. Definition of Project Success

The project succeeds when an end-to-end question flow is verified:
1. Student asks a query on the frontend.
2. Orchestrator accurately routes to the specialized agent.
3. Azure AI Search retrieves the correct document chunk.
4. LLM synthesizes an accurate answer citing exact page numbers.
5. Out-of-scope or unverified questions trigger a safe, polite fallback.

---

## 23. AI-103 Concepts Applied

This project synthesizes core AI and Cloud engineering principles covered in AI-103:

- **Multi-Agent Systems:** Intent classification, dynamic routing, and domain separation using Microsoft Foundry.
- **Retrieval-Augmented Generation (RAG):** Overcoming LLM knowledge cutoffs and hallucinations using external indexed search.
- **Vector & Semantic Search:** Azure AI Search with dense embeddings and semantic re-ranking for institutional retrieval.
- **Responsible AI & Prompt Shields:** Guardrails against prompt injection and hallucinated academic regulations.
- **Cloud Architecture & Managed Identity:** Secure authentication using `DefaultAzureCredential` and Azure Key Vault without embedded credentials.

---

## 24. Current Development Principle

> **Build the simplest architecture that satisfies the requirements reliably, then improve it based on evidence.**

Avoid unnecessary cloud resources, excessive frameworks, or premature complexity.