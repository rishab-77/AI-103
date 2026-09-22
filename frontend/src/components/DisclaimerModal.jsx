import { useEffect } from "react";
import { X, ShieldCheck, BookOpen, AlertTriangle, Layers } from "lucide-react";

export default function DisclaimerModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <ShieldCheck className="modal-title-icon" size={20} strokeWidth={2.2} />
            <h2 id="modal-title" className="modal-title">Official Sources &amp; AI Grounding</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal dialog"
            title="Close dialog (Escape)"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <div className="modal-section-header">
              <BookOpen size={16} strokeWidth={2} />
              <h3>Grounding &amp; Provenance Guarantee</h3>
            </div>
            <p>
              The University FAQ Assistant provides responses synthesized exclusively from verified official documentation. Answers are linked directly to approved source documents and page numbers.
            </p>
          </section>

          <section className="modal-section">
            <div className="modal-section-header">
              <Layers size={16} strokeWidth={2} />
              <h3>Multi-Agent Architecture</h3>
            </div>
            <p>
              Student queries are categorized and routed to specialized domain agents (Academic Regulations, Student Services, General FAQ) via Retrieval-Augmented Generation (RAG).
            </p>
          </section>

          <section className="modal-section modal-warning-section">
            <div className="modal-section-header">
              <AlertTriangle size={16} strokeWidth={2} />
              <h3>Institutional Disclaimer &amp; Non-Goals</h3>
            </div>
            <p>
              This conversational assistant is an informational tool. It does not alter student academic records, grant administrative exceptions, or access private personal information. Always consult your academic advisor or registrar for official binding decisions.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn-primary"
            onClick={onClose}
            aria-label="Acknowledge and close modal"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
