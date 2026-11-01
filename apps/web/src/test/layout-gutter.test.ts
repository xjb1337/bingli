import { describe, expect, it } from 'vitest';
import appStyles from '../styles.css?raw';

function ruleFor(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = appStyles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  return match?.[1] ?? '';
}

describe('page gutter layout', () => {
  const headerRule = ruleFor('.app-header');
  const mainRule = ruleFor('.app-main');

  it('does not size the header from the viewport scrollbar', () => {
    expect(headerRule).not.toContain('100vw');
  });

  it('uses the shared gutter for the header and main content', () => {
    expect(headerRule).toContain('var(--page-gutter)');
    expect(mainRule).toContain('var(--page-gutter)');
  });
});
