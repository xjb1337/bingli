interface AiEmptyStateProps {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  disabled?: boolean;
}

export function AiEmptyState({ title, description, action, onAction, disabled }: AiEmptyStateProps) {
  return (
    <div className="ai-empty" role="note">
      <span className="ai-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M10 5h12a3 3 0 0 1 3 3v19H7V8a3 3 0 0 1 3-3Z" />
          <path d="M12 12h8M12 17h8M12 22h4" />
        </svg>
      </span>
      <div className="ai-empty-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button type="button" className="button primary" disabled={disabled} onClick={onAction}>{action}</button>
    </div>
  );
}
