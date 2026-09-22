import { Menu, Sparkles, HelpCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function TopBar({
  theme,
  onToggleTheme,
  onOpenMobileSidebar,
  onOpenDisclaimer,
}) {
  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          title="Open sidebar"
        >
          <Menu size={19} strokeWidth={2} />
        </button>

        <div className="topbar-identity">
          <div className="topbar-title-row">
            <h1 className="topbar-title">University FAQ Assistant</h1>
            <span
              className="topbar-demo-badge"
              title="Running with public regulatory sources (UGC/Statutory guidelines)"
            >
              <Sparkles size={11} strokeWidth={2.4} /> DEMO MODE
            </span>
          </div>
          <p className="topbar-subtitle">
            Authoritative Academic Policies & Student Services Guidance
          </p>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="topbar-info-btn"
          onClick={onOpenDisclaimer}
          title="Sources & Information"
          aria-label="Sources & Information"
        >
          <HelpCircle size={17} strokeWidth={2} />
        </button>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
