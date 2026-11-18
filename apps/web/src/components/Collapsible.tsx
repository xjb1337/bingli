import { useEffect, useRef, type ReactNode } from 'react';

interface CollapsibleProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  syncKey?: string | number;
  badge?: ReactNode;
  className?: string;
  id?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  syncKey,
  badge,
  className = '',
  id,
}: CollapsibleProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = Boolean(defaultOpen);
    }
  }, [defaultOpen, syncKey]);

  return (
    <details ref={detailsRef} id={id} className={`collapsible-card ${className}`.trim()}>
      <summary>
        <span>{title}</span>
        {badge ? <span className="summary-badge">{badge}</span> : null}
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}
