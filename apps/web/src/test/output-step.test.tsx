import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RECORD_CORE,
  SCHEMA,
  type DabingliRecord,
  type DocumentWarning,
} from '@dabingli/domain';
import { GeneratedDocuments } from '../pages/OutputStep';

function emptyRecord(): DabingliRecord {
  return RECORD_CORE.cloneValue(SCHEMA.emptyRecord()) as DabingliRecord;
}

function sidePlaceholderWarning(overrides: Partial<DocumentWarning> = {}): DocumentWarning {
  return {
    code: 'SIDE_PLACEHOLDER_UNFILLED',
    severity: 'error',
    path: 'pe.heart',
    message: '【模板】仍有 5 处侧别占位符（患侧/对侧/健侧）未改成左或右：患侧',
    paths: ['pe.heart', 'pe.lung'],
    ...overrides,
  };
}

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('generated document side placeholder confirmation', () => {
  it('asks before copying or downloading and cancels both when declined', async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<GeneratedDocuments record={emptyRecord()} warnings={[sidePlaceholderWarning()]} />);

    await user.click(screen.getAllByRole('button', { name: '复制本篇' })[0]!);
    await user.click(screen.getAllByRole('button', { name: '下载 .txt' })[0]!);

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(confirm).toHaveBeenCalledWith(
      '病历里还有 2 处（患侧/对侧/健侧）没改，确定要复制/下载吗？',
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it('continues copying when the user confirms', async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<GeneratedDocuments record={emptyRecord()} warnings={[sidePlaceholderWarning()]} />);

    await user.click(screen.getAllByRole('button', { name: '复制本篇' })[0]!);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(screen.getByTestId('doc-record').textContent);
    });
  });

  it('falls back to the count in the warning message when paths are unavailable', async () => {
    const user = userEvent.setup();
    stubClipboard();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <GeneratedDocuments
        record={emptyRecord()}
        warnings={[sidePlaceholderWarning({ paths: undefined, message: '【模板】仍有 3 处侧别占位符（患侧/对侧/健侧）未改成左或右：对侧' })]}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: '复制本篇' })[0]!);

    expect(confirm).toHaveBeenCalledWith(
      '病历里还有 3 处（患侧/对侧/健侧）没改，确定要复制/下载吗？',
    );
  });
});
