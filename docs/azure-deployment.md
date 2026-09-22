# Azure Deployment Plan — AI-103 University FAQ Assistant

> **Status:** Research and Planning Document (Issue #7).
> **No Azure resources have been created or provisioned.**
> This document details the minimum required Azure cloud architecture, deployment flows, authentication strategy, security guardrails, and future scaling pathways.

---

## 1. Current Architecture Overview

The system consists of a decoupled frontend, backend, AI orchestration layer, and document retrieval engine:

```text
Student User
     ↓ (HTTP / HTTPS)
Azure Static Web Apps (React + Vite Client)
     ↓ (REST API: POST /api/ask)
Azure App Service (FastAPI Backend)
     ↓ (DefaultAzureCredential / Managed Identity)
Microsoft Foundry Agent Framework
     ↓ (Orchestration & Domain Agent Routing)
AzureAISearchTool
     ↓ (Semantic / Vector Queries)
Azure AI Search (University Knowledge Base Index)
     ↓ (Retrieved Context)
Azure OpenAI Service (Grounded LLM Answer Generation)
     ↓ (Cited JSON Response)
Student Interface
```

---

## 2. Required Azure Resources

| Resource | Azure Service | Why Needed | Required Now? |
|---|---|---|---|
| **Resource Group** | `Azure Resource Group` | Logical container for organizing and tracking all related cloud assets | ✅ Yes (First step) |
| **Frontend Hosting** | `Azure Static Web Apps` | Serves compiled React/Vite assets via global CDN with automated GitHub Actions CI/CD | ✅ Yes (When deploying UI) |
| **Backend Hosting** | `Azure App Service` (Linux B1) | Runs the FastAPI Python server with managed scaling and HTTPS | ✅ Yes (When deploying API) |
| **Secrets & Keys** | `Azure Key Vault` | Secure centralized storage for connection strings and sensitive API keys | ✅ Yes (Before production keys) |
| **AI Orchestration & LLM** | `Microsoft Foundry / Azure OpenAI` | Provides agent execution framework and foundation models (e.g. GPT-4o) | ⏳ When backend AI integration starts |
| **Vector Search Engine** | `Azure AI Search` (Basic / Free) | Indexes university documents and executes hybrid semantic search | ⏳ When RAG pipeline starts |
| **Document Storage** | `Azure Blob Storage` | Stores official university PDFs and raw text files before indexing | ⏳ When knowledge ingestion starts |
| **Safety Guardrails** | `Azure AI Content Safety` | Inspects user prompts and model outputs for injection attacks and safety violations | ⏳ When AI integration starts |

---

## 3. Optional Resources (To Avoid Creating Now)

To prevent premature complexity and unnecessary cloud costs, the following resources **must not** be created for the initial prototype:

- ❌ **Azure Kubernetes Service (AKS):** Highly over-engineered for a simple FastAPI service.
- ❌ **Azure Cosmos DB / SQL Database:** No persistent user profiles or chat session storage are needed at this stage.
- ❌ **Azure API Management (APIM):** Unnecessary proxy layer for a single `/api/ask` endpoint.
- ❌ **Azure Front Door:** Static Web Apps and App Service provide their own built-in SSL and CDN capabilities.
- ❌ **Azure Container Registry (ACR):** App Service can pull directly from GitHub without requiring a private container registry.

---

## 4. Authentication & Identity Management

### A. End-User Authentication
For the student prototype, **no user login is required**. The university FAQ assistant is designed to be a public, low-friction information tool.

### B. Service-to-Service Authentication: `DefaultAzureCredential`
Rather than embedding long-lived API keys in source code or configuration files, backend services will authenticate to Azure services using **Managed Identities** and `DefaultAzureCredential` from the `azure-identity` Python library.

#### How `DefaultAzureCredential` Works:
1. **Locally in Development:** It automatically searches for developer credentials via Azure CLI (`az login`), environment variables, or VS Code login.
2. **In Production (Azure App Service):** It automatically uses the App Service's **System-Assigned Managed Identity**, eliminating the need for hardcoded API keys.

```python
# Example FastAPI Azure Service Client Setup
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

credential = DefaultAzureCredential()

project_client = AIProjectClient(
    endpoint=os.getenv("AZURE_AI_FOUNDRY_ENDPOINT"),
    credential=credential
)
```

---

## 5. Deployment Flow (CI/CD)

The application will be deployed continuously using **GitHub Actions**:

```text
Developer pushes to feature branch
               ↓
Pull Request created & reviewed
               ↓
Merge to 'main'
               ↓
GitHub Actions Pipeline triggers:
   ├── Job 1: Build & Deploy Frontend → Azure Static Web Apps
   └── Job 2: Test & Deploy Backend  → Azure App Service
               ↓
Live Production Environment:
   ├── Frontend: https://<custom-name>.azurestaticapps.net
   └── Backend:  https://<custom-name>.azurewebsites.net
```

### Deployment Steps:
1. **Frontend:** Vite compiles static assets (`dist/`), which are pushed to Azure Static Web Apps via the `Azure/static-web-apps-deploy` GitHub Action.
2. **Backend:** FastAPI Python dependencies (`requirements.txt`) are installed on the Azure App Service Linux runner and started via Gunicorn/Uvicorn.
3. **CORS Configuration:** FastAPI is configured with CORS middleware allowing only the Azure Static Web Apps domain.

---

## 6. Secrets Management & Environment Variables

### Core Rules:
1. **Zero secrets in Git:** Never commit `.env`, API keys, or certificates.
2. **Local Development:** Use a `.env` file (listed in `.gitignore`).
3. **Production Deployment:** App Service reads secrets from **Azure Key Vault** using Key Vault references.

### Reference Configuration:
In Azure App Service Application Settings:
```text
AZURE_OPENAI_API_KEY  = @Microsoft.KeyVault(SecretUri=https://ai103-kv.vault.azure.net/secrets/OPENAI-KEY)
AZURE_SEARCH_API_KEY  = @Microsoft.KeyVault(SecretUri=https://ai103-kv.vault.azure.net/secrets/SEARCH-KEY)
AZURE_SEARCH_ENDPOINT = https://ai103-search.search.windows.net
```

---

## 7. AI & Retrieval Services Architecture

### A. Microsoft Foundry & Agent Framework
- **Orchestrator Agent:** Receives the student query, classifies the intent, and delegates the task to the appropriate domain agent (`academic`, `student_services`, or `general_faq`).
- **Specialized Domain Agents:** Equipped with domain-specific system prompts instructing them to query only official sources and format citations as `{ title, page }`.

### B. Azure AI Search (`AzureAISearchTool`)
- Official university PDFs are chunked, enriched with metadata (document title, academic year, page number), and indexed in Azure AI Search.
- Specialized agents invoke `AzureAISearchTool` to retrieve top-$k$ relevant chunks using hybrid search (BM25 keyword matching + dense vector similarity).

### C. Azure AI Content Safety & Prompt Shields
- **Input Shield:** Inspects incoming student prompts for prompt injection, jailbreaking attempts, or abusive language before invoking the LLM.
- **Output Guard:** Validates that the generated answer contains factual grounding based on retrieved context and refrains from making unsupported policy statements.

---

## 8. Service-to-Service Communication

```text
┌─────────────────────────┐
│  React Frontend (SPA)   │
└────────────┬────────────┘
             │ 1. HTTPS POST /api/ask { "query": "..." }
             ▼
┌─────────────────────────┐
│     FastAPI Backend     │
└────────────┬────────────┘
             │ 2. Intent analysis & routing
             ▼
┌─────────────────────────┐
│   Foundry Orchestrator  │
└────────────┬────────────┘
             │ 3. Dispatch to Domain Agent
             ▼
┌─────────────────────────┐
│    Specialized Agent    │
└────────────┬────────────┘
             │ 4. AzureAISearchTool query
             ▼
┌─────────────────────────┐
│     Azure AI Search     │ ──── returns relevant chunk + metadata
└────────────┬────────────┘
             │ 5. Synthesize grounded answer
             ▼
┌─────────────────────────┐
│   Azure OpenAI (LLM)    │
└────────────┬────────────┘
             │ 6. Moderation & Grounding check
             ▼
┌─────────────────────────┐
│ Azure AI Content Safety │
└────────────┬────────────┘
             │ 7. Return JSON { answer, sources, agent }
             ▼
┌─────────────────────────┐
│  React Frontend (SPA)   │ ──── Displays answer, agent badge, citation cards
└─────────────────────────┘
```

---

## 9. Minimum Practical Architecture (Student Tier)

To keep setup straightforward and cost-efficient:

```text
┌────────────────────────────────────────────────────────────┐
│                    Azure Resource Group                    │
│                                                            │
│   ┌────────────────────────┐   ┌───────────────────────┐   │
│   │ Azure Static Web Apps  │   │   Azure App Service   │   │
│   │ (Free Tier)            │   │   (Linux Basic B1)    │   │
│   └────────────────────────┘   └───────────┬───────────┘   │
│                                            │               │
│                        ┌───────────────────┼───────────┐   │
│                        ▼                   ▼           ▼   │
│                 Azure Key Vault      Azure OpenAI   Azure  │
│                 (Standard)           (Pay-as-you-go)  AI   │
│                                                     Search │
│                                                     (Free) │
└────────────────────────────────────────────────────────────┘
```

**Estimated Monthly Cost for Prototype:** ~$15–20 / month (well within student / trial credit budgets).

---

## 10. Future Scaling Considerations

If the project expands across multiple university departments:
1. **Azure Application Insights:** Add distributed tracing to track retrieval latency and token consumption.
2. **Azure Cache for Redis:** Cache responses for frequently asked questions (e.g., semester start dates) to reduce LLM costs.
3. **Azure Container Apps:** Transition FastAPI from App Service to micro-containers for dynamic auto-scaling during exam peak periods.
4. **Custom Domain & SSL:** Map institutional domains (e.g., `faq.university.edu`).

---

*Document created: 2026-09-20 | Git Branch: feature/proch | Associated Issues: #5, #7*
