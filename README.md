# AI-103
University FAQ Multi-Agent - Multi-agent, RAG, orchestration Agent Framework, Foundry IQ, AI Search
# 🎓 University FAQ Multi-Agent System

> An AI-powered university information assistant that uses multi-agent orchestration and Retrieval-Augmented Generation (RAG) to answer student questions using official university sources with grounded responses and citations.

---

## 📌 Project Status

**Current Phase:** Architecture & Foundation

This repository is under active development.

The architecture described below represents the current agreed project direction. Some implementation details, Azure services, APIs, and agent boundaries may evolve as the architecture is validated.

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

The backend processes the query and routes it through an orchestration layer to the appropriate specialized agent.

The selected agent uses a shared university knowledge/retrieval layer to retrieve relevant information from approved university sources.

The retrieved evidence is then used to generate a grounded response containing citations to the supporting source material.

Conceptually:

```text
Student
   ↓
React Client
   ↓
FastAPI Backend
   ↓
Agent Orchestrator
   ↓
Specialized Agent
   ↓
Knowledge / Retrieval Layer
   ↓
Official University Sources
   ↓
Grounded Answer + Citations
```

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

> Agent boundaries are part of the architecture currently being validated and may be refined.

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

Responsible for determining which agent should handle an incoming query.

The orchestrator should coordinate routing rather than act as an unrestricted source of university facts.

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
│ Agent Orchestrator  │
└──────────┬──────────┘
           │
     ┌─────┼───────────┐
     ▼     ▼           ▼
 Academic Student    General
  Agent   Services    Agent
          Agent
     └─────┬───────────┘
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

# 11. Planned Technology Stack

> Some Azure service selections are still under architectural validation.

### Frontend

- React
- Vite

### Backend

- Python
- FastAPI

### AI / Agent Layer

Planned/under evaluation:

- Microsoft Foundry
- Microsoft Agent Framework / Foundry Agent capabilities
- Azure-hosted language models

### Retrieval / Knowledge Layer

Planned/under evaluation:

- Foundry IQ
- Azure AI Search
- vector / semantic / hybrid retrieval as appropriate

### Deployment

Azure deployment strategy is currently being finalized.

Potential services will be selected based on:

- simplicity
- reliability
- cost
- project requirements
- deployment feasibility
- available Azure credits

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
│   ├── datasets/
│   ├── scripts/
│   └── results/
│
├── docs/
│   ├── architecture.md
│   ├── decisions.md
│   └── security.md
│
├── .github/
│   └── workflows/
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

- student chat interface
- API integration
- loading states
- error states
- citation display
- responsive interface

### Evaluation & Reliability

Responsibilities:

- evaluation dataset
- retrieval testing
- answer-groundedness testing
- citation testing
- routing testing
- adversarial/out-of-scope testing
- reliability analysis

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
CI / Validation
     ↓
Merge
```

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

| Date | Milestone |
|---|---|
| Sept 16 | Architecture + data + project foundation |
| Sept 17 | Working RAG pipeline |
| Sept 18 | Multi-agent integration |
| Sept 19 | End-to-end integration |
| Sept 20 | Engineering freeze + stabilization |
| Sept 21 | UI/UX polish |
| Sept 22 | Creative features + documentation + demo preparation |
| Sept 23 | Final verification + submission |

After the engineering freeze, major architectural changes should be avoided unless required to fix a critical issue.

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

# 21. Current Development Principle

> Build the simplest architecture that satisfies the requirements reliably, then improve it based on evidence.

The project should demonstrate engineering depth through **correct design, retrieval quality, orchestration, evaluation, reliability and explainability**, rather than unnecessary complexity.