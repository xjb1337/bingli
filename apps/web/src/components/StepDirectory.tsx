import type { StepCompletionState } from '../form-utils';
import type { StepDefinition, StepKey } from '../steps';

interface StepDirectoryProps {
  steps: readonly StepDefinition[];
  activeIndex: number;
  states?: Readonly<Partial<Record<StepKey, StepCompletionState>>>;
  onSelect: (index: number) => void;
}

const STATE_LABEL: Record<Exclude<StepCompletionState, 'none'>, string> = {
  done: '已填',
  part: '部分',
  empty: '未填',
};

export function StepDirectory({ steps, activeIndex, states, onSelect }: StepDirectoryProps) {
  return (
    <nav className="step-directory-list" aria-label="病历步骤目录">
      {steps.map((step, index) => {
        const state = states?.[step.key] ?? 'none';
        return (
          <button
            key={step.key}
            type="button"
            className={`step-link${index === activeIndex ? ' is-active' : ''}`}
            aria-current={index === activeIndex ? 'step' : undefined}
            onClick={() => onSelect(index)}
          >
            <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="step-name">{step.name}</span>
            {state !== 'none' ? (
              <span className={`step-state-badge is-${state}`}>{STATE_LABEL[state]}</span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
