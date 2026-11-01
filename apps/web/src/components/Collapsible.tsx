import { useEffect, useRef, type ReactNode } from 'react';

interface CollapsibleProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  className?: string;
  id?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  badge,
  className = '',
  id,
}: CollapsibleProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (defaultOpen && detailsRef.current) detailsRef.current.open = true;
  }, [defaultOpen]);

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
