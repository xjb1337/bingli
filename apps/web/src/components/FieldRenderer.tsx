import type { ReactNode } from 'react';

export type FieldOption = string | { value: string; label: string };

export interface FieldRendererProps {
  path: string;
  label: string;
  value: string;
  onChange: (path: string, value: string) => void;
  kind?: 'text' | 'textarea' | 'date' | 'time' | 'number' | 'tel' | 'select' | 'segmented';
  options?: readonly FieldOption[];
  rows?: number;
  placeholder?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel';
  className?: string;
}

export function fieldDomId(path: string): string {
  return `field-${path.replaceAll('.', '__')}`;
}

function normalizeOption(option: FieldOption): { value: string; label: string } {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function FieldRenderer({
  path,
  label,
  value,
  onChange,
  kind = 'text',
  options = [],
  rows = 3,
  placeholder,
  hint,
  error,
  required = false,
  inputMode,
  className = '',
}: FieldRendererProps) {
  const id = fieldDomId(path);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const normalized = options.map(normalizeOption);
  const common = {
    id,
    value,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    'data-field-path': path,
  };

  let control: ReactNode;
  if (kind === 'textarea') {
    control = (
      <textarea
        {...common}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(path, event.target.value)}
      />
    );
  } else if (kind === 'select') {
    control = (
      <select {...common} onChange={(event) => onChange(path, event.target.value)}>
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (kind === 'segmented') {
    control = (
      <div className="segmented" role="radiogroup" aria-label={label} aria-describedby={describedBy || undefined}>
        {normalized.map((option) => (
          <button
            key={option.value}
            type="button"
            id={option.value === value ? id : undefined}
            role="radio"
            aria-checked={option.value === value}
            className={option.value === value ? 'is-selected' : ''}
            data-field-path={option.value === value ? path : undefined}
            onClick={() => onChange(path, option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  } else {
    control = (
      <input
        {...common}
        type={kind}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(path, event.target.value)}
      />
    );
  }

  return (
    <div className={`field-renderer ${className}`.trim()} data-field-wrap={path}>
      <label className="field-label" htmlFor={id}>
        <span>{label}</span>
        {required ? <span className="field-required">必填</span> : null}
      </label>
      {control}
      {hint ? (
        <div className="field-hint" id={hintId}>
          {hint}
        </div>
      ) : null}
      {error ? (
        <div className="field-error" id={errorId} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export interface CheckGroupProps {
  label: string;
  values: Record<string, boolean>;
  options: readonly string[];
  onChange: (value: string, checked: boolean) => void;
  hint?: ReactNode;
}

export function CheckGroup({ label, values, options, onChange, hint }: CheckGroupProps) {
  return (
    <fieldset className="check-group">
      <legend>{label}</legend>
      {hint ? <div className="field-hint">{hint}</div> : null}
      <div className="check-grid">
        {options.map((option) => (
          <label key={option} className={`check-chip${values[option] ? ' is-checked' : ''}`}>
            <input
              type="checkbox"
              checked={Boolean(values[option])}
              onChange={(event) => onChange(option, event.target.checked)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
