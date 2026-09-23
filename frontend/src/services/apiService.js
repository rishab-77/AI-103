/**
 * apiService.js — Backend API integration for University FAQ Assistant
 * Connects React frontend directly to the FastAPI multi-agent backend endpoint /api/v1/ask
 * and falls back seamlessly to mockChatService if backend is offline.
 */
import { askQuestion as mockAskQuestion } from "./mockChatService";

/**
 * Sends a student query to the FastAPI backend.
 * Returns { answer, sources, agent } matching the UI's contract.
 */
export async function askQuestion(query) {
  const trimmed = (query || "").trim();

  try {
    const response = await fetch("/api/v1/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: trimmed }),
    });

    if (!response.ok) {
      console.warn(`Backend returned HTTP ${response.status}, falling back to local service.`);
      return await mockAskQuestion(trimmed);
    }

    const data = await response.json();

    // Map backend AgentResponse format to frontend expectations
    // Backend schema: { answer, routed_to, citations: [{ document_title, source_url, page_or_section }], disclaimer, is_safe }
    const sources = (data.citations || []).map((citation) => ({
      title: citation.document_title || "Official University Record",
      publisher: "University Administration",
      category: data.routed_to ? data.routed_to.replace("_", " ").toUpperCase() : "General",
      sourceType: "Official Document",
      section: citation.page_or_section || "Verified Policy",
      lastUpdated: "Current Academic Year",
      verified: true,
      url: citation.source_url || "#",
    }));

    return {
      answer: data.answer,
      sources: sources,
      agent: data.routed_to || "general_faq",
    };
  } catch (err) {
    console.warn("Backend fetch failed (likely offline/unreachable). Using mock fallback:", err);
    return await mockAskQuestion(trimmed);
  }
}
