import { FileText, ExternalLink, Bookmark, Clock, AlertTriangle } from "lucide-react";

export default function SourceCard({ source, index, isHighlighted }) {
  const hasValidUrl = source.url && source.url !== "#" && source.url.startsWith("http");
  const citationNumber = index !== undefined ? index + 1 : null;
  const dateStr = source.date || source.lastUpdated;
  const isOutdated = Boolean(source.isOutdated || source.outdated);
  const categoryStr = source.category || source.sourceType || source.publisher;

  const CardInner = (
    <div
      id={`source-card-${citationNumber}`}
      className={`source-card ${hasValidUrl ? "is-clickable" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
    >
      <div className="source-card-body">
        {/* Header row with Numbered index badge and title */}
        <div className="source-card-header-row">
          {citationNumber && (
            <span className="source-index-badge" aria-label={`Citation [${citationNumber}]`}>
              [{citationNumber}]
            </span>
          )}
          <div className="source-card-icon" aria-hidden="true">
            <FileText size={14} strokeWidth={2} />
          </div>
          <span className="source-doc-title" title={source.title}>
            {source.title}
          </span>
        </div>

        {/* Metadata row: Category tag & Page/Section */}
        <div className="source-card-meta-row">
          {categoryStr && (
            <span className="source-category-tag">{categoryStr}</span>
          )}

          {(source.page || source.section) && (
            <span className="source-page-indicator">
              <Bookmark size={11} strokeWidth={2.4} aria-hidden="true" />
              {source.section ? `Sec. ${source.section}` : `Page ${source.page}`}
            </span>
          )}
        </div>

        {/* Status badges row: Last updated & Outdated warning */}
        {(dateStr || isOutdated) && (
          <div className="source-status-badges-row">
            {dateStr && (
              <span className="source-badge-updated" title={`Document version date: ${dateStr}`}>
                <Clock size={10} strokeWidth={2.2} aria-hidden="true" /> Last updated: {dateStr}
              </span>
            )}

            {isOutdated && (
              <span className="source-badge-outdated" title="Policy document may have pending amendments">
                <AlertTriangle size={10} strokeWidth={2.4} aria-hidden="true" /> May be outdated
              </span>
            )}
          </div>
        )}
      </div>

      {hasValidUrl && (
        <div className="source-link-indicator" aria-hidden="true" title="Open source in new tab">
          <ExternalLink size={13} strokeWidth={2.2} />
        </div>
      )}
    </div>
  );

  if (hasValidUrl) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-card-anchor"
        aria-label={`Open official source [${citationNumber}]: ${source.title}`}
      >
        {CardInner}
      </a>
    );
  }

  return CardInner;
}
