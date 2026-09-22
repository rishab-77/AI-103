import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import ChatWindow from "../components/ChatWindow";
import DisclaimerModal from "../components/DisclaimerModal";
import { askQuestion } from "../services/mockChatService";

const STORAGE_CONVERSATIONS_KEY = "ai103_conversations";
const STORAGE_THEME_KEY = "ai103_theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function createNewConversation() {
  const id = `conv-${Date.now()}`;
  return {
    id,
    title: "New Inquiry",
    messages: [],
    updatedAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  };
}

export default function ChatPage() {
  // Theme state
  const [theme, setTheme] = useState(getInitialTheme);

  // Disclaimer Modal state
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [createNewConversation()];
  });

  const [activeConvId, setActiveConvId] = useState(() => {
    return conversations[0]?.id || "conv-init";
  });

  // Current active conversation query status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch {
      // Ignore quota errors
    }
  }, [conversations]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0] || createNewConversation();

  const handleNewChat = useCallback(() => {
    // If current conversation is already empty, just focus it
    if (activeConversation.messages.length === 0 && !error) {
      setIsMobileSidebarOpen(false);
      return;
    }
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setError(null);
    setLastFailedQuery(null);
    setIsLoading(false);
    setIsMobileSidebarOpen(false);
  }, [activeConversation, error]);

  const handleSelectConversation = (id) => {
    setActiveConvId(id);
    setError(null);
    setLastFailedQuery(null);
    setIsLoading(false);
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteConversation = (id) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createNewConversation();
        setActiveConvId(fresh.id);
        return [fresh];
      }
      if (activeConvId === id) {
        setActiveConvId(remaining[0].id);
      }
      return remaining;
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const handleSendMessage = async (queryText) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setLastFailedQuery(null);

    const timeStr = getCurrentTime();
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: timeStr,
    };

    // Update active conversation with user message and compute clean title
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          const isFirstMessage = c.messages.length === 0;
          const newTitle = isFirstMessage
            ? trimmed.length > 36
              ? `${trimmed.slice(0, 36)}…`
              : trimmed
            : c.title;

          return {
            ...c,
            title: newTitle,
            updatedAt: timeStr,
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      })
    );

    setIsLoading(true);

    try {
      const response = await askQuestion(trimmed);
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: response.answer,
        sources: response.sources || [],
        agent: response.agent || "general_faq",
        timestamp: getCurrentTime(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              updatedAt: getCurrentTime(),
              messages: [...c.messages, assistantMessage],
            };
          }
          return c;
        })
      );
    } catch (err) {
      setError(err.message || "Failed to process question. Please try again.");
      setLastFailedQuery(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSendMessage(lastFailedQuery);
    }
  };

  return (
    <div className="app-layout-root">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="app-main-workspace">
        <TopBar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        />

        <ChatWindow
          messages={activeConversation.messages}
          isLoading={isLoading}
          error={error}
          onSendMessage={handleSendMessage}
          onRetry={handleRetry}
          onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        />
      </div>

      {/* Official Sources & Disclaimer Modal */}
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
}
