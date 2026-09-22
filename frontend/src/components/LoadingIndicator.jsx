import { useState, useEffect } from "react";
import { GraduationCap, Sparkles, FileSearch, CheckCircle2 } from "lucide-react";

const STEPS = [
  { text: "Querying domain router & agent dispatch...", icon: Sparkles },
  { text: "Retrieving official regulatory documentation...", icon: FileSearch },
  { text: "Synthesizing answer with verified citations...", icon: CheckCircle2 },
];

export default function LoadingIndicator() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const CurrentStepIcon = STEPS[stepIndex].icon;

  return (
    <div className="message-turn assistant-turn loading-turn" role="status" aria-live="polite">
      <div className="assistant-avatar-badge loading-avatar" aria-hidden="true">
        <GraduationCap size={18} strokeWidth={2} />
      </div>

      <div className="assistant-message-container loading-container">
        <div className="assistant-meta-header">
          <div className="assistant-meta-left">
            <span className="assistant-title-text">University FAQ Assistant</span>
            <span className="loading-badge">
              <span className="typing-dots-indicator" aria-hidden="true">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </span>
              Processing
            </span>
          </div>
        </div>

        {/* Dynamic status line with step icon */}
        <div className="loading-status-line">
          <CurrentStepIcon size={14} className="loading-step-icon" aria-hidden="true" />
          <span className="loading-status-text">{STEPS[stepIndex].text}</span>
        </div>

        {/* Shimmer Skeleton lines for rich feedback */}
        <div className="skeleton-container" aria-hidden="true">
          <div className="skeleton-line skeleton-line-long"></div>
          <div className="skeleton-line skeleton-line-medium"></div>
          <div className="skeleton-line skeleton-line-short"></div>
        </div>
      </div>
    </div>
  );
}
