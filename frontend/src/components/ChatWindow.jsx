import { useRef, useEffect, useState, useCallback } from "react";
import { GraduationCap, ShieldCheck, ArrowDown } from "lucide-react";
import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";
import ErrorBanner from "./ErrorBanner";
import SuggestionCards from "./SuggestionCards";
import Composer from "./Composer";

export default function ChatWindow({
  messages = [],
  isLoading = false,
  error = null,
  onSendMessage,
  onRetry,
  onOpenDisclaimer,
}) {
  const viewportRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  // Monitor user scroll position
  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 80;
    setIsAtBottom(atBottom);
    setShowScrollBottomBtn(!atBottom && messages.length > 2);
  }, [messages.length]);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Auto-scroll logic: scroll on send or when already at bottom
  useEffect(() => {
    const isNewUserMessage =
      messages.length > prevMessagesLengthRef.current &&
      messages[messages.length - 1]?.role === "user";

    if (isNewUserMessage || isAtBottom) {
      scrollToBottom("smooth");
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoading, error, isAtBottom]);

  const isInitialState = messages.length === 0 && !isLoading && !error;

  return (
    <div className="chat-window-container">
      {/* Scrollable conversation viewport */}
      <main
        ref={viewportRef}
        className="chat-viewport"
        onScroll={handleScroll}
        role="region"
        aria-label="Conversation stream"
      >
        <div className="chat-column">
          {/* Welcome Screen / Empty State */}
          {isInitialState && (
            <section className="welcome-section" aria-label="Welcome and topic suggestions">
              <div className="welcome-crest-wrap">
                <div className="welcome-crest" aria-hidden="true">
                  <GraduationCap size={32} strokeWidth={1.8} />
                </div>
              </div>

              <h2 className="welcome-heading">University Information Assistant</h2>
              <p className="welcome-subheading">
                Grounded guidance on academic regulations, examinations, grievance redressal, and student welfare.
              </p>

              <div className="welcome-badge-row">
                <span className="welcome-verified-pill">
                  <ShieldCheck size={13} strokeWidth={2.4} /> Official Regulatory Grounding
                </span>
              </div>

              <div className="welcome-suggestions-wrapper">
                <SuggestionCards onSelect={onSendMessage} disabled={isLoading} />
              </div>
            </section>
          )}

          {/* Conversation history items */}
          <div className="messages-stream-list" role="feed" aria-busy={isLoading} aria-label="Messages">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>

          {/* Loading indicator with shimmer skeleton */}
          {isLoading && <LoadingIndicator />}

          {/* Error alert with retry */}
          {error && <ErrorBanner message={error} onRetry={onRetry} />}

          {/* Live announcer for screen readers */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isLoading
              ? "Assistant is retrieving university regulations and synthesizing answer."
              : messages.length > 0 && messages[messages.length - 1]?.role === "assistant"
              ? "Assistant responded with answer and citations."
              : ""}
          </div>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="chat-scroll-anchor" aria-hidden="true" />
        </div>
      </main>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          className="scroll-to-bottom-btn"
          onClick={() => {
            scrollToBottom("smooth");
            setIsAtBottom(true);
            setShowScrollBottomBtn(false);
          }}
          title="Scroll to latest message"
          aria-label="Scroll to latest message"
        >
          <ArrowDown size={16} strokeWidth={2.4} />
          <span className="scroll-btn-label">Latest</span>
        </button>
      )}

      {/* Pinned Bottom Composer Section */}
      <footer className="chat-footer-pinned" role="contentinfo" aria-label="Chat composer">
        <div className="chat-footer-inner">
          <Composer onSend={onSendMessage} disabled={isLoading} />
          <div className="chat-disclaimer-row">
            <span className="chat-disclaimer-text">
              Answers are generated from approved university sources. Always verify important decisions with the official university office.
            </span>
            <button
              type="button"
              className="chat-disclaimer-btn"
              onClick={onOpenDisclaimer}
              aria-label="Open detailed information about approved university sources"
            >
              Learn more
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
