import { useEffect } from 'react';

const EDITABLE_SELECTOR = 'input, textarea, select';

export function useMobileViewport() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    let baselineHeight = window.visualViewport?.height || window.innerHeight;
    let blurTimer: number | null = null;

    const updateKeyboardState = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      if (currentHeight > baselineHeight) baselineHeight = currentHeight;
      const active = document.activeElement;
      const isEditable = active instanceof HTMLElement && active.matches(EDITABLE_SELECTOR);
      const shrunk = baselineHeight > 0 && currentHeight < baselineHeight * 0.78;
      if (isEditable && shrunk) {
        document.body.classList.add('kbd-open');
      } else if (!isEditable || !shrunk) {
        document.body.classList.remove('kbd-open');
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
        blurTimer = null;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.matches(EDITABLE_SELECTOR)) {
        updateKeyboardState();
      }
    };

    const handleFocusOut = () => {
      if (blurTimer !== null) window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        blurTimer = null;
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !active.matches(EDITABLE_SELECTOR)) {
          document.body.classList.remove('kbd-open');
        }
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.visualViewport?.addEventListener('resize', updateKeyboardState);
    window.addEventListener('resize', updateKeyboardState);

    return () => {
      if (blurTimer !== null) window.clearTimeout(blurTimer);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.visualViewport?.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('resize', updateKeyboardState);
      document.body.classList.remove('kbd-open');
    };
  }, []);
}
