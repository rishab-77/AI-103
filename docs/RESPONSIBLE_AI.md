# 🤝 Responsible AI Policy & Safeguards — University FAQ System

This document details the principles, grounding mechanisms, source attribution rules, and limitation disclosures implemented in accordance with Microsoft Responsible AI Guidelines.

---

## 1. Core Responsible AI Pillars

### A. Grounding & Hallucination Prevention
- Specialized agents (Academic, Student Services, General FAQ) are instructed to rely **exclusively** on retrieved context provided by the `AzureAISearchTool`.
- If insufficient grounding context is returned by the retrieval layer, the system is explicitly prohibited from guessing. It responds with a standardized fallback:
  > *"I could not find reliable information regarding this in official university sources."*

### B. Source Attribution & Transparency
- Every grounded answer must cite the underlying official source document (e.g., *Student Handbook 2025-26, Section 4.2*).
- Clear UI transparency ensures students understand they are interacting with an AI system and not a human administrator.

### C. Handling Conflicting Information
- When retrieved documents contain contradicting information (e.g., an outdated PDF vs. a newer notice), the agent highlights the conflict, cites both sources with available metadata, and directs the student to the official registrar.

### D. Privacy & Data Minimization
- No personally identifiable information (PII) is required, requested, or stored.
- The system operates strictly as a public policy FAQ retriever.

---

## 2. Guardrails Implementation

```text
               ┌──────────────────────────────┐
               │    Specialized Agent Prompt   │
               └──────────────┬───────────────┘
                              │
                              ▼
               ┌──────────────────────────────┐
               │    AzureAISearchTool (RAG)   │
               └──────────────┬───────────────┘
                              │ Context
                              ▼
               ┌──────────────────────────────┐
               │  Grounded Answer Generation  │
               └──────────────┬───────────────┘
                              │
                              ▼
               ┌──────────────────────────────┐
               │     Output Guardrail Check   │
               │  - Verify Source Citations   │
               │  - Add Official Disclaimer   │
               └──────────────────────────────┘
```

---

## 3. Transparency & Disclaimers

Every generated response carries the following automated standard disclaimer:

> *"This response is grounded in official university documents. Please verify with official administrative offices for formal decisions."*

---

## 4. Documented Limitations

1. **Information Currentness**: The quality of answers depends on the recency of documents indexed in Azure AI Search.
2. **Language Support**: The current baseline prompt system is optimized for English queries.
3. **No Executive Authority**: The agent cannot execute administrative actions (e.g., submitting a leave request or registering a course).
