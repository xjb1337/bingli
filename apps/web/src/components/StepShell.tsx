import type { ReactNode } from 'react';

export function StepShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="step-panel" aria-labelledby="step-heading">
      <header className="step-header">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 id="step-heading" tabIndex={-1}>{title}</h2>
          <p>{description}</p>
        </div>
        {actions ? <div className="step-header-actions">{actions}</div> : null}
      </header>
      <div className="step-body">{children}</div>
    </section>
  );
}

export function FormGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`form-grid ${className}`.trim()}>{children}</div>;
}

export function Card({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`.trim()}>
      {title ? <h3>{title}</h3> : null}
      {description ? <div className="card-description">{description}</div> : null}
      {children}
    </section>
  );
}
