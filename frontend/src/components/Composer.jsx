import { useState, useRef, useEffect } from "react";
import { ArrowUp, CornerDownLeft, Square } from "lucide-react";

const MAX_CHAR_LIMIT = 1000;

export default function Composer({ onSend, onCancel, disabled }) {
  const [query, setQuery] = useState("");
  const [validationHint, setValidationHint] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (disabled && onCancel) {
      onCancel();
      return;
    }

    const trimmed = query.trim();

    if (!trimmed) {
      setValidationHint(true);
      setTimeout(() => setValidationHint(false), 2400);
      return;
    }

    setValidationHint(false);
    onSend(trimmed);
    setQuery("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && query.trim()) {
        handleSubmit();
      }
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHAR_LIMIT) {
      setQuery(val);
    }
    if (validationHint) setValidationHint(false);

    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  const charCount = query.length;
  const isNearLimit = charCount > MAX_CHAR_LIMIT * 0.85;
  const isSendDisabled = disabled && !onCancel;

  return (
    <div className="composer-wrapper">
      {validationHint && (
        <div className="composer-validation-alert" role="status" aria-live="polite">
          Please enter a question regarding university policies or regulations.
        </div>
      )}

      <form className="composer-box" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          id="chat-composer-textarea"
          className="composer-textarea"
          placeholder="Ask a question about regulations, hostel rules, or exams..."
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          maxLength={MAX_CHAR_LIMIT}
          aria-label="Ask your university question"
        />

        <div className="composer-actions-bar">
          <div className="composer-hints-left">
            <span className="composer-shortcut-hint" aria-hidden="true">
              <CornerDownLeft size={11} strokeWidth={2.2} /> Return to send
            </span>
            <span
              className={`composer-char-limit ${isNearLimit ? "is-near-limit" : ""}`}
              aria-label={`${charCount} of ${MAX_CHAR_LIMIT} characters used`}
            >
              {charCount} / {MAX_CHAR_LIMIT}
            </span>
          </div>

          {disabled && onCancel ? (
            <button
              type="button"
              id="chat-cancel-action-btn"
              className="composer-cancel-button"
              onClick={onCancel}
              title="Stop generating response"
              aria-label="Stop generating response"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              id="chat-send-action-btn"
              className="composer-send-button"
              disabled={isSendDisabled || !query.trim()}
              title={disabled ? "Processing response..." : !query.trim() ? "Type a question to send" : "Send question (Enter)"}
              aria-label={disabled ? "Processing response..." : "Send message"}
            >
              {disabled ? (
                <span className="composer-spinner" aria-hidden="true">
                  <span className="composer-dot"></span>
                  <span className="composer-dot"></span>
                  <span className="composer-dot"></span>
                </span>
              ) : (
                <ArrowUp size={16} strokeWidth={2.4} />
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
