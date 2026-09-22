import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="theme-toggle-icon-wrap" aria-hidden="true">
        {isDark ? (
          <Moon className="theme-icon moon-icon" size={16} strokeWidth={2} />
        ) : (
          <Sun className="theme-icon sun-icon" size={16} strokeWidth={2} />
        )}
      </div>
      <span className="theme-toggle-label">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
