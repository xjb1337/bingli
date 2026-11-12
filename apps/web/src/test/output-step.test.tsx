import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RECORD_CORE,
  SCHEMA,
  type DabingliRecord,
  type DocumentWarning,
} from '@dabingli/domain';
import { GeneratedDocuments, documentFileName } from '../pages/OutputStep';

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
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
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

describe('v3.2 sharing, printing, and anonymous file names', () => {
  it('builds file names from department or record short id, never from the patient name', () => {
    const record = emptyRecord();
    record.id = 'abcdef-123456';
    record.basic.name = '虚构患者姓名';
    record.basic.department = 'respiratory';
    record.basic.recordDate = '2026-11-11';
    expect(documentFileName(record, '大病历')).toBe('大病历_呼吸内科_2026-11-11.txt');
    expect(documentFileName(record, '大病历')).not.toContain('虚构患者姓名');

    record.basic.department = 'general';
    expect(documentFileName(record, '大病历')).toBe('大病历_123456_2026-11-11.txt');
  });

  it('downloads with the anonymous name and shares through navigator.share', async () => {
    const user = userEvent.setup();
    const record = emptyRecord();
    record.id = 'abcdef-654321';
    record.basic.name = '虚构患者姓名';
    record.basic.department = 'respiratory';
    record.basic.recordDate = '2026-11-11';
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:doc') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    render(<GeneratedDocuments record={record} />);
    await user.click(screen.getAllByRole('button', { name: '下载 .txt' })[0]!);
    expect(downloads[0]).toBe('大病历_呼吸内科_2026-11-11.txt');

    await user.click(screen.getAllByRole('button', { name: '分享' })[0]!);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0]?.[0]).toMatchObject({ title: '大病历' });
    expect(share.mock.calls[0]?.[0]?.text).toBe(screen.getByTestId('doc-record').textContent);
    expect(await screen.findByText('已打开系统分享：大病历')).toBeInTheDocument();
  });

  it('falls back to copying when navigator.share is unavailable', async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard();
    Reflect.deleteProperty(navigator, 'share');
    render(<GeneratedDocuments record={emptyRecord()} />);

    await user.click(screen.getAllByRole('button', { name: '分享' })[0]!);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(screen.getByTestId('doc-record').textContent));
    expect(await screen.findByText(/当前浏览器不支持直接分享，已复制大病历/)).toBeInTheDocument();
  });

  it('prints only the selected document and removes the print node afterwards', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<GeneratedDocuments record={emptyRecord()} />);

    await user.click(screen.getAllByRole('button', { name: '打印 / 存 PDF' })[0]!);
    const node = document.querySelector('.print-document');
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.body).toHaveClass('printing-document');
    expect(node?.textContent).toContain('大病历');
    expect(node?.textContent).toContain(screen.getByTestId('doc-record').textContent ?? '');

    window.dispatchEvent(new Event('afterprint'));
    await waitFor(() => expect(document.querySelector('.print-document')).not.toBeInTheDocument());
    expect(document.body).not.toHaveClass('printing-document');
  });
});
