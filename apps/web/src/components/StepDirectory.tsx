import type { StepDefinition } from '../steps';

interface StepDirectoryProps {
  steps: readonly StepDefinition[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function StepDirectory({ steps, activeIndex, onSelect }: StepDirectoryProps) {
  return (
    <nav className="step-directory-list" aria-label="病历步骤目录">
      {steps.map((step, index) => (
        <button
          key={step.key}
          type="button"
          className={`step-link${index === activeIndex ? ' is-active' : ''}`}
          aria-current={index === activeIndex ? 'step' : undefined}
          onClick={() => onSelect(index)}
        >
          <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
          <span>{step.name}</span>
        </button>
      ))}
    </nav>
  );
}
