import { GraduationCap, FileText, Building2, ShieldAlert, ArrowUpRight } from "lucide-react";

const SUGGESTIONS = [
  {
    id: "academics",
    category: "Academics",
    icon: GraduationCap,
    question: "What are the general UGC academic policies?",
    description: "Credit structure, attendance requirements, and course progression regulations.",
  },
  {
    id: "examinations",
    category: "Examinations",
    icon: FileText,
    question: "What happens if I miss an examination?",
    description: "Re-examination rules, medical absence condonation, and backlog policies.",
  },
  {
    id: "services",
    category: "Student Services",
    icon: Building2,
    question: "What student services are governed under public regulatory guidelines?",
    description: "Hostel allocation, campus welfare facilities, and administrative services.",
  },
  {
    id: "grievances",
    category: "Grievances",
    icon: ShieldAlert,
    question: "How can a student raise a grievance?",
    description: "Official Ombudsman protocol, redressal timelines, and complaint escalation.",
  },
];

export default function SuggestionCards({ onSelect, disabled }) {
  return (
    <div className="suggestion-cards-grid" role="region" aria-label="Suggested questions">
      {SUGGESTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className="suggestion-card"
            onClick={() => onSelect(item.question)}
            disabled={disabled}
            aria-label={`Ask question about ${item.category}: ${item.question}`}
          >
            <div className="suggestion-card-top">
              <div className="suggestion-icon-badge" aria-hidden="true">
                <Icon size={18} strokeWidth={2} />
              </div>
              <span className="suggestion-category-tag">{item.category}</span>
              <div className="suggestion-action-hint" aria-hidden="true">
                <ArrowUpRight size={14} strokeWidth={2.4} />
              </div>
            </div>

            <div className="suggestion-card-body">
              <h3 className="suggestion-question-title">{item.question}</h3>
              <p className="suggestion-description">{item.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
