import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="error-alert-container" role="alert">
      <div className="error-alert-main">
        <div className="error-alert-icon" aria-hidden="true">
          <AlertCircle size={18} strokeWidth={2.2} />
        </div>
        <div className="error-alert-details">
          <p className="error-alert-title">Unable to process inquiry</p>
          <p className="error-alert-message">
            {message || "We couldn't process your question. Please try again."}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          className="error-retry-button"
          onClick={onRetry}
          aria-label="Retry previous question"
        >
          <RotateCcw size={13} strokeWidth={2.4} aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
