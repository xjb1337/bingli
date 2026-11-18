import { useRef, type KeyboardEvent, type ReactNode } from 'react';

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
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const common = {
    id,
    value,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    'data-field-path': path,
  };

  if (kind === 'segmented') {
    const activeIndex = normalized.findIndex((option) => option.value === value);
    const focusableIndex = activeIndex >= 0 ? activeIndex : 0;

    const handleRadioKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (!normalized.length) return;
      let nextIndex = -1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % normalized.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + normalized.length) % normalized.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = normalized.length - 1;
      }
      if (nextIndex < 0) return;
      event.preventDefault();
      const targetOption = normalized[nextIndex];
      if (!targetOption) return;
      onChange(path, targetOption.value);
      radioRefs.current[nextIndex]?.focus();
    };

    return (
      <fieldset className={`field-renderer field-segmented ${className}`.trim()} data-field-wrap={path}>
        <legend className="field-label">
          <span>{label}</span>
          {required ? <span className="field-required">必填</span> : null}
        </legend>
        <div
          className="segmented"
          role="radiogroup"
          aria-label={label}
          aria-describedby={describedBy || undefined}
          data-field-path={path}
        >
          {normalized.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  radioRefs.current[index] = node;
                }}
                type="button"
                id={index === focusableIndex ? id : undefined}
                role="radio"
                tabIndex={index === focusableIndex ? 0 : -1}
                aria-checked={selected}
                aria-invalid={error && index === focusableIndex ? true : undefined}
                className={selected ? 'is-selected' : ''}
                onClick={() => onChange(path, option.value)}
                onKeyDown={(event) => handleRadioKeyDown(event, index)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
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
      </fieldset>
    );
  }

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
  path?: string;
  label: string;
  values: Record<string, boolean>;
  options: readonly string[];
  onChange: (value: string, checked: boolean) => void;
  hint?: ReactNode;
  error?: string;
}

export function CheckGroup({ path, label, values, options, onChange, hint, error }: CheckGroupProps) {
  return (
    <fieldset className="check-group" data-field-wrap={path} data-field-path={path}>
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
      {error ? (
        <div className="field-error" role="alert">
          {error}
        </div>
      ) : null}
    </fieldset>
  );
}
