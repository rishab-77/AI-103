import { GraduationCap, FileText, Building2, Shield, Bot } from "lucide-react";

const AGENT_MAP = {
  academic: {
    label: "Academic Agent",
    icon: GraduationCap,
    badgeClass: "badge-academic",
  },
  examination: {
    label: "Examinations Agent",
    icon: FileText,
    badgeClass: "badge-academic",
  },
  student_services: {
    label: "Student Services Agent",
    icon: Building2,
    badgeClass: "badge-services",
  },
  general_faq: {
    label: "General FAQ Agent",
    icon: Shield,
    badgeClass: "badge-general",
  },
  general: {
    label: "General Agent",
    icon: Shield,
    badgeClass: "badge-general",
  },
};

export default function AgentBadge({ agent }) {
  if (!agent) return null;

  const normalized = String(agent).toLowerCase().trim().replace(/[-\s]/g, "_");

  const info = AGENT_MAP[normalized] || {
    label: `${String(agent).replace(/[_-]/g, " ")} Agent`,
    icon: Bot,
    badgeClass: "badge-default",
  };

  const IconComponent = info.icon;

  return (
    <span className={`agent-badge ${info.badgeClass}`} title={`Handled by ${info.label}`}>
      <IconComponent className="agent-badge-icon" size={12} strokeWidth={2.2} aria-hidden="true" />
      <span className="agent-badge-label">{info.label}</span>
    </span>
  );
}
