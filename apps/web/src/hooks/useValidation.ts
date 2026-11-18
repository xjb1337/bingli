import { useCallback, useMemo, useState, type FocusEvent } from 'react';
import { GENERATOR, type DocumentWarning } from '@dabingli/domain';

function validationMap(warnings: readonly DocumentWarning[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  warnings.forEach((warning) => {
    warning.paths?.forEach((path) => {
      if (!mapped[path]) mapped[path] = warning.message;
    });
  });
  return mapped;
}

function validationMapForTouched(
  warnings: readonly DocumentWarning[],
  touchedPaths: ReadonlySet<string>,
): Record<string, string> {
  const mapped = validationMap(warnings);
  const visible: Record<string, string> = {};

  Object.entries(mapped).forEach(([errorPath, message]) => {
    for (const touchedPath of touchedPaths) {
      if (
        errorPath === touchedPath
        || errorPath.startsWith(`${touchedPath}.`)
        || touchedPath.startsWith(`${errorPath}.`)
      ) {
        visible[errorPath] = message;
        break;
      }
    }
  });

  return visible;
}

export function useValidation(record: Parameters<typeof GENERATOR.validateStructured>[0]) {
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [touchedPaths, setTouchedPaths] = useState<ReadonlySet<string>>(() => new Set());

  const warnings = useMemo(() => GENERATOR.validateStructured(record), [record]);
  const errors = useMemo(
    () => (validationAttempted ? validationMap(warnings) : validationMapForTouched(warnings, touchedPaths)),
    [validationAttempted, touchedPaths, warnings],
  );

  const resetValidationState = useCallback(() => {
    setValidationAttempted(false);
    setTouchedPaths(new Set());
  }, []);

  const markFieldTouched = useCallback((path: string) => {
    setTouchedPaths((previous) => {
      if (previous.has(path)) return previous;
      const next = new Set(previous);
      next.add(path);
      return next;
    });
  }, []);

  const handleFieldBlur = useCallback(
    (event: FocusEvent<HTMLFormElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const field = target.closest<HTMLElement>('[data-field-path]');
      const path = field?.dataset.fieldPath;
      if (path) markFieldTouched(path);
    },
    [markFieldTouched],
  );

  return {
    warnings,
    errors,
    validationAttempted,
    setValidationAttempted,
    markFieldTouched,
    resetValidationState,
    handleFieldBlur,
  };
}
