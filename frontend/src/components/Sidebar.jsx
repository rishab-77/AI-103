import { useEffect } from "react";
import { Plus, MessageSquare, Trash2, ShieldCheck, X, Compass } from "lucide-react";

export default function Sidebar({
  conversations = [],
  activeId = null,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenDisclaimer,
  isOpen = false,
  onCloseMobile,
}) {
  // Close drawer on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCloseMobile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseMobile]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? "is-open" : ""}`}
        aria-label="Sidebar navigation"
        aria-hidden={!isOpen && typeof window !== "undefined" && window.innerWidth <= 840 ? "true" : undefined}
      >
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-left">
            <div className="sidebar-crest" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-app-name">Academic FAQ</span>
              <span className="sidebar-portal-tag">University Portal</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
            title="Close sidebar (Escape)"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* New Chat Primary Action */}
        <div className="sidebar-action-container">
          <button
            type="button"
            className="sidebar-new-chat-btn"
            onClick={onNewChat}
            title="Start a new inquiry"
            aria-label="Start a new inquiry"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
            <span>New Inquiry</span>
          </button>
        </div>

        {/* Recent Conversations List */}
        <nav className="sidebar-conversations-section" aria-label="Recent conversation history">
          <div className="sidebar-section-title-row">
            <span className="sidebar-section-title">Recent Inquiries</span>
            <span className="sidebar-count-pill" aria-label={`${conversations.length} inquiries`}>
              {conversations.length}
            </span>
          </div>

          <div className="sidebar-conversations-list" role="list">
            {conversations.length === 0 ? (
              <div className="sidebar-empty-state">
                <Compass size={20} strokeWidth={1.5} aria-hidden="true" />
                <p>No previous inquiries.</p>
                <span>Inquiries will appear here</span>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <div
                    key={conv.id}
                    className={`sidebar-conv-item ${isActive ? "is-active" : ""}`}
                    role="listitem"
                  >
                    <button
                      type="button"
                      className="sidebar-conv-btn"
                      onClick={() => onSelectConversation(conv.id)}
                      title={conv.title}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`Open conversation: ${conv.title}`}
                    >
                      <MessageSquare size={14} strokeWidth={1.8} className="conv-icon" aria-hidden="true" />
                      <div className="conv-content">
                        <span className="conv-title">{conv.title}</span>
                        {conv.updatedAt && (
                          <span className="conv-date">{conv.updatedAt}</span>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      className="sidebar-conv-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      title="Delete inquiry"
                      aria-label={`Delete inquiry ${conv.title}`}
                    >
                      <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-footer-link"
            onClick={onOpenDisclaimer}
            aria-label="View official sources and institutional disclaimer"
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
            <span>Sources &amp; Disclaimer</span>
          </button>
          <div className="sidebar-footer-version">
            <span>AI-103 · Regulatory Grounding v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
