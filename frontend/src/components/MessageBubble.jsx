import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GraduationCap,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  HelpCircle,
  Building,
  ExternalLink,
} from "lucide-react";
import AgentBadge from "./AgentBadge";
import SourceCard from "./SourceCard";

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState(null);

  const isUser = message.role === "user";

  const handleCopy = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Graceful fallback
    }
  };

  const handleFeedback = (type) => {
    setFeedback((prev) => (prev === type ? null : type));
  };

  const handleCitationClick = (citationIndex) => {
    setHighlightedSourceIndex(citationIndex);
    const cardEl = document.getElementById(`source-card-${citationIndex + 1}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    setTimeout(() => {
      setHighlightedSourceIndex(null);
    }, 2200);
  };

  if (isUser) {
    return (
      <div className="message-turn user-turn">
        <div className="user-bubble-container">
          <div className="user-bubble">
            <p className="user-text">{message.text}</p>
          </div>
          {message.timestamp && (
            <span className="message-time user-time">{message.timestamp}</span>
          )}
        </div>
      </div>
    );
  }

  // Determine message classification
  const messageState = classifyMessage(message);
  const hasSources = Array.isArray(message.sources) && message.sources.length > 0;

  return (
    <div className="message-turn assistant-turn">
      {/* Graduation Cap avatar */}
      <div className="assistant-avatar-badge" aria-hidden="true">
        <GraduationCap size={18} strokeWidth={2} />
      </div>

      <div className="assistant-message-container">
        {/* Assistant Meta Header */}
        <div className="assistant-meta-header">
          <div className="assistant-meta-left">
            <span className="assistant-title-text">University FAQ Assistant</span>
            {message.agent && <AgentBadge agent={message.agent} />}
          </div>

          <div className="assistant-meta-actions">
            {message.timestamp && (
              <span className="message-time assistant-time">{message.timestamp}</span>
            )}
          </div>
        </div>

        {/* Content Body Based on State */}
        {messageState === "UNVERIFIED_INFO" ? (
          /* Safe Failure State: Soft Amber Notice Card */
          <div className="notice-card notice-amber-card" role="status">
            <div className="notice-card-header">
              <div className="notice-icon-badge amber" aria-hidden="true">
                <AlertTriangle size={18} strokeWidth={2.2} />
              </div>
              <div className="notice-heading-wrap">
                <h4 className="notice-title">No Reliable Information Found</h4>
                <span className="notice-badge">Approved Sources Check</span>
              </div>
            </div>

            <div className="notice-body">
              <p className="notice-text">
                {message.text}
              </p>
            </div>

            <div className="notice-action-box">
              <div className="notice-action-header">
                <Building size={14} strokeWidth={2} aria-hidden="true" />
                <span>Recommended University Contact</span>
              </div>
              <p className="notice-action-description">
                For official policy clarification and binding exceptions, please contact your Academic Dean’s Office or Student Services Helpdesk.
              </p>
            </div>
          </div>
        ) : messageState === "OUT_OF_SCOPE" ? (
          /* Safe Failure State: Neutral Gray Info Card */
          <div className="notice-card notice-neutral-card" role="status">
            <div className="notice-card-header">
              <div className="notice-icon-badge neutral" aria-hidden="true">
                <HelpCircle size={18} strokeWidth={2.2} />
              </div>
              <div className="notice-heading-wrap">
                <h4 className="notice-title">Out of University Scope</h4>
                <span className="notice-badge">Domain Guardrail</span>
              </div>
            </div>

            <div className="notice-body">
              <p className="notice-text">
                {message.text}
              </p>
            </div>

            <div className="notice-guidance-pills">
              <span className="guidance-label">Try asking about:</span>
              <span className="guidance-pill">Academic Regulations</span>
              <span className="guidance-pill">Examination Bye-laws</span>
              <span className="guidance-pill">Hostel &amp; Housing</span>
              <span className="guidance-pill">Student Grievances</span>
            </div>
          </div>
        ) : (
          /* Normal Grounded Answer using ReactMarkdown */
          <div className="assistant-prose-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p({ children }) {
                  return <p className="prose-paragraph">{renderWithCitationLinks(children, handleCitationClick)}</p>;
                },
                li({ children }) {
                  return <li>{renderWithCitationLinks(children, handleCitationClick)}</li>;
                },
                a({ href, children }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="prose-link">
                      {children} <ExternalLink size={11} strokeWidth={2.2} className="inline-link-icon" aria-hidden="true" />
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <div className="table-responsive-wrapper">
                      <table className="prose-table">{children}</table>
                    </div>
                  );
                },
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        )}

        {/* Source Citations Section */}
        {hasSources && (
          <div className="sources-citation-block" role="region" aria-label="Referenced sources">
            <div className="sources-header-bar">
              <span className="sources-header-title">Approved Sources &amp; Citations</span>
              <span className="sources-count-badge">
                {message.sources.length} {message.sources.length === 1 ? "reference" : "references"}
              </span>
            </div>
            <div className="sources-cards-row">
              {message.sources.map((source, index) => (
                <SourceCard
                  key={`${source.title}-${index}`}
                  source={source}
                  index={index}
                  isHighlighted={highlightedSourceIndex === index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions: Copy, Thumbs Up, Thumbs Down */}
        <div className="assistant-actions-footer">
          <div className="feedback-button-group" role="group" aria-label="Answer feedback">
            <button
              type="button"
              className={`feedback-action-btn ${feedback === "up" ? "is-active up" : ""}`}
              onClick={() => handleFeedback("up")}
              title="Helpful answer"
              aria-label="Thumbs up - this answer was helpful"
              aria-pressed={feedback === "up"}
            >
              <ThumbsUp size={13} strokeWidth={2} aria-hidden="true" />
              <span className="feedback-label">Helpful</span>
            </button>

            <button
              type="button"
              className={`feedback-action-btn ${feedback === "down" ? "is-active down" : ""}`}
              onClick={() => handleFeedback("down")}
              title="Not helpful or inaccurate"
              aria-label="Thumbs down - this answer was not helpful"
              aria-pressed={feedback === "down"}
            >
              <ThumbsDown size={13} strokeWidth={2} aria-hidden="true" />
              <span className="feedback-label">Not helpful</span>
            </button>
          </div>

          <button
            type="button"
            className="copy-answer-btn"
            onClick={handleCopy}
            title={copied ? "Copied to clipboard" : "Copy answer text"}
            aria-label="Copy answer text"
          >
            {copied ? (
              <>
                <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                <span className="copy-label">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} strokeWidth={2} aria-hidden="true" />
                <span className="copy-label">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Classifies the message into Normal answer vs Safe Failure State
 */
function classifyMessage(message) {
  if (message.status === "no_info" || message.failureType === "NO_INFO") {
    return "UNVERIFIED_INFO";
  }
  if (message.status === "out_of_scope" || message.failureType === "OUT_OF_SCOPE") {
    return "OUT_OF_SCOPE";
  }

  const text = message.text || "";
  const lower = text.toLowerCase();

  if (
    lower.includes("i'm designed to help with university-related information") ||
    lower.includes("i couldn't understand that question") ||
    lower.includes("out of scope")
  ) {
    return "OUT_OF_SCOPE";
  }

  if (
    lower.includes("i don't currently have a verified") ||
    lower.includes("i do not currently have your university's verified") ||
    lower.includes("i do not currently have your institution's verified") ||
    lower.includes("i do not currently have") ||
    lower.includes("i could not locate verified") ||
    lower.includes("no reliable information found")
  ) {
    return "UNVERIFIED_INFO";
  }

  return "NORMAL";
}

/**
 * Transforms string brackets like [1], [2] into interactive citation markers
 */
function renderWithCitationLinks(children, onCitationClick) {
  if (!children) return children;

  if (typeof children === "string") {
    const parts = children.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citationNum = parseInt(match[1], 10);
        return (
          <button
            key={i}
            type="button"
            className="inline-citation-marker"
            onClick={() => onCitationClick(citationNum - 1)}
            title={`Jump to Source [${citationNum}]`}
            aria-label={`Jump to Source [${citationNum}]`}
          >
            [{citationNum}]
          </button>
        );
      }
      return part;
    });
  }

  if (Array.isArray(children)) {
    return children.map((child, idx) => (
      <span key={idx}>{renderWithCitationLinks(child, onCitationClick)}</span>
    ));
  }

  return children;
}
