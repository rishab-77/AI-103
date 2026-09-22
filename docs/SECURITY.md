# 🛡️ Security Architecture & Safeguards — University FAQ System

This document outlines the security controls, threat mitigations, authorization standards, and secrets management implemented for the University FAQ Multi-Agent System.

---

## 1. Threat Model & Mitigation Strategy

| Threat Category | Potential Impact | Security Control Implemented |
|---|---|---|
| **Prompt Injection / Jailbreak** | System prompt leakage, policy bypass, malicious persona adoption | Layered validation in `backend/services/safety.py`: Regex pattern matching + Azure Content Safety Prompt Shields |
| **Credential & Secret Leakage** | Compromise of Azure resources or AI models | Environment variables only via `pydantic-settings`. Zero credentials committed to git. Managed Identity (`DefaultAzureCredential`) for Azure authentication |
| **Data Exfiltration / Unauthorized Data Access** | Access to internal student PII | System is strictly **read-only** against public knowledge documents. No access to personal student records |
| **Denial of Service (DoS)** | Exhaustion of AI model quota or API compute | Input string length capped at 2,000 characters. Timeout controls on agent runs |
| **Model Fabrication / Unsupported Claims** | Hallucination of nonexistent university policies | Strict system instruction rules mandating groundings in retrieved Azure AI Search documents |

---

## 2. Secrets Management & Authentication

1. **No Credentials in Code**:
   - All connection strings, keys, and endpoint URLs are loaded from `.env` files using `backend/config.py`.
   - `.env` is explicitly included in `.gitignore`. A template `.env.example` is provided for reference.

2. **Azure Managed Identity / RBAC**:
   - For production deployments, authentication uses `azure.identity.DefaultAzureCredential`, eliminating the need for hardcoded API keys.
   - Access to Azure AI Foundry projects and Azure AI Search index is scoped via Role-Based Access Control (RBAC) enforcing the principle of least privilege.

---

## 3. Input Validation & Defense Pipeline

Incoming student queries pass through a 3-layer security filter before reaching any LLM or Agent:

```text
Student Question
      │
      ▼
┌─────────────────────────────────────────┐
│ Layer 1: Basic Structural Validation   │ (Non-empty, length <= 2000 chars)
└────────────────────┬────────────────────┘
                     │ Safe
                     ▼
┌─────────────────────────────────────────┐
│ Layer 2: Regex Pattern Injection Check │ (Detects jailbreak & prompt override terms)
└────────────────────┬────────────────────┘
                     │ Safe
                     ▼
┌─────────────────────────────────────────┐
│ Layer 3: Azure Content Safety           │ (Prompt Shield API analysis)
└────────────────────┬────────────────────┘
                     │ Safe
                     ▼
             Agent Execution
```

---

## 4. Human Oversight & Administrative Limitations

- **Advisory Role Only**: The system acts strictly as an informational assistant. It cannot approve leave, register courses, or grant hostel passes.
- **Verification Guidance**: All responses include a disclaimer instructing students to verify critical policy decisions with official university administrators.

---

## 5. Known Security Limitations

1. Pattern-based injection filters can be evaded by zero-day adversarial phrasing. Layer 3 (Content Safety API) provides dynamic protection.
2. Search index output security relies on the upstream RAG ingestion pipeline ensuring only approved public university sources are indexed.
