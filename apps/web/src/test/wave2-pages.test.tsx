import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RECORD_CORE, SCHEMA, type DabingliRecord } from '@dabingli/domain';
import { describe, expect, it, vi } from 'vitest';
import { DataTransferPanel } from '../components/DataTransferPanel';
import { PeStep } from '../pages/PeStep';
import { RecordsPage } from '../pages/RecordsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SummaryStep } from '../pages/SummaryStep';

function transferProps() {
  return {
    includeNotes: false,
    onImport: vi.fn(),
    onDownload: vi.fn(),
    onIncludeNotesChange: vi.fn(),
  };
}

function stepProps(record: DabingliRecord) {
  return { record, update: vi.fn(), replaceRecord: vi.fn(), errors: {}, onJump: vi.fn(), notify: vi.fn() };
}

describe('RecordsPage', () => {
  it('filters the current list and requires confirmation to delete a record', async () => {
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.basic.name = '示例患者';
    const list = [{ id: 'fixture-record', updatedAt: '2026-01-01T00:00:00Z', data: record }];
    const onDelete = vi.fn();
    render(<RecordsPage {...transferProps()} list={list} activeId={list[0]!.id}
      onNew={vi.fn()} onOpen={vi.fn()} onCopy={vi.fn()} onDelete={onDelete} />);

    const search = screen.getByRole('searchbox', { name: '搜索病历' });
    fireEvent.change(search, { target: { value: '无匹配' } });
    expect(screen.getByRole('status', { name: '病历数量：0/1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: '示例' } });
    expect(screen.getByRole('status', { name: '病历数量：1/1' })).toBeInTheDocument();
    expect(screen.getByText('当前')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.keyboard('{Escape}');
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '确认删除' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(list[0]);
  });
});

describe('SettingsPage', () => {
  it('updates the theme and font scale and displays the supported storage quota', async () => {
    const user = userEvent.setup();
    const settings = { rosMode: 'detail', fontScale: 1, lastStep: 'basic' } as const;
    const onThemeChange = vi.fn();
    const onChange = vi.fn();
    render(<SettingsPage {...transferProps()} settings={settings} onThemeChange={onThemeChange} onChange={onChange}
      quotaInfo={{ supported: true, usage: 1024, quota: 1048576, ratio: 0.001, lowSpace: false }} />);

    await user.click(screen.getByRole('radio', { name: '深色' }));
    expect(onThemeChange).toHaveBeenCalledWith('dark');
    await user.click(screen.getByRole('radio', { name: '特大' }));
    expect(onChange).toHaveBeenCalledWith({ ...settings, fontScale: 1.3 });
    expect(screen.getByText(/本机存储已用 1 KB/)).toBeInTheDocument();
  });
});

describe('PeStep', () => {
  it('shows example vital signs without writing any measurements', async () => {
    const user = userEvent.setup();
    const props = stepProps(SCHEMA.emptyRecord());
    render(<PeStep {...props} />);
    await user.click(screen.getByRole('button', { name: '查看正常值参考示例' }));
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '显示参考示例' }));
    expect(screen.getByRole('status')).toHaveTextContent('参考示例（未写入病历）');
    expect(props.replaceRecord).not.toHaveBeenCalled();
    expect(props.update).not.toHaveBeenCalled();
  });

  it('only confirms descriptions for examined items', async () => {
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    const group = SCHEMA.PE_COMMON.find((entry) => entry.items.filter((item) => !item.depts).length >= 2)!;
    const [examined, unchecked] = group.items.filter((item) => !item.depts);
    const examinedPath = `pe.${group.key}.${examined!.key}`;
    const uncheckedPath = `pe.${group.key}.${unchecked!.key}`;
    RECORD_CORE.setPath(record, examinedPath, '本次查体描述');
    RECORD_CORE.setPath(record, uncheckedPath, '旧查体描述');
    SCHEMA.setPeChecked(record, group.key, examined!.key, true);
    SCHEMA.setPeChecked(record, group.key, unchecked!.key, false);
    const props = stepProps(record);
    render(<PeStep {...props} />);

    await user.click(within(screen.getByRole('navigation', { name: '查体分组快速跳转' }))
      .getByRole('button', { name: group.name }));
    const details = document.getElementById(`pe-group-${group.key}`)!;
    await user.click(within(details).getByRole('button', { name: '确认本组描述' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('本次查体描述');
    expect(dialog).not.toHaveTextContent('旧查体描述');
    await user.click(within(dialog).getByRole('button', { name: '确认本组描述' }));
    const reviewed = props.replaceRecord.mock.calls[0]![0] as DabingliRecord;
    expect(RECORD_CORE.fieldReviewValid(reviewed, examinedPath)).toBe(true);
    expect(RECORD_CORE.fieldReviewValid(reviewed, uncheckedPath)).toBe(false);
  });
});

describe('SummaryStep', () => {
  it('requires an explicit review after bringing preliminary diagnoses into the discharge record', async () => {
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.diagnosis.confirmed = ['示例诊断'];
    const props = stepProps(record);
    const { rerender } = render(<SummaryStep {...props} />);
    await user.click(screen.getByText('出院记录', { selector: 'summary span' }));
    const confirmation = screen.getByRole('checkbox', { name: '我已核对并确认以上出院诊断' });
    expect(confirmation).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '从初步诊断带入' }));
    const copied = props.replaceRecord.mock.calls[0]![0] as DabingliRecord;
    expect(copied.discharge.diagnoses).toEqual(['示例诊断']);
    expect(copied.discharge.diagnosesConfirmed).toBe(false);

    rerender(<SummaryStep {...props} record={copied} />);
    const review = screen.getByRole('checkbox', { name: '我已核对并确认以上出院诊断' });
    await user.click(review);
    const reviewed = props.replaceRecord.mock.calls[1]![0] as DabingliRecord;
    expect(reviewed.discharge.diagnosesConfirmed).toBe(true);
    expect(RECORD_CORE.documentState(reviewed, 'discharge', 'diagnoses').state).toBe('reviewed');
  });
});

describe('DataTransferPanel', () => {
  it('reads a replacement file and imports only after explicit confirmation', async () => {
    const user = userEvent.setup();
    const props = transferProps();
    const { container } = render(<DataTransferPanel {...props} />);
    await user.selectOptions(screen.getByLabelText('导入方式'), 'replace');
    const file = new File(['{"records":[]}'], 'fixture.json', { type: 'application/json' });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file);
    const dialog = await screen.findByRole('alertdialog', { name: '确认替换全部病历' });
    expect(props.onImport).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    expect(props.onImport).not.toHaveBeenCalled();
    await user.upload(input, file);
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '确定替换' }));
    expect(props.onImport).toHaveBeenCalledOnce();
    expect(props.onImport).toHaveBeenCalledWith('{"records":[]}', 'replace');
  });

  it('wires the recovery and quarantine exports to their own actions', async () => {
    const user = userEvent.setup();
    const restore = vi.fn();
    const exportCorrupt = vi.fn();
    render(<DataTransferPanel {...transferProps()} onRestoreRecovery={restore} onExportCorruptLegacy={exportCorrupt}
      recovery={{ id: 'recovery', reason: 'replace', recordCount: 2, createdAt: '2026-01-01T00:00:00Z' }}
      corruptEntries={[{ key: 'fixture', reason: 'malformed', raw: '{' }]} />);
    await user.click(screen.getByRole('button', { name: '恢复替换前备份' }));
    await user.click(screen.getByRole('button', { name: '导出损坏旧数据（1 条）' }));
    expect(restore).toHaveBeenCalledOnce();
    expect(exportCorrupt).toHaveBeenCalledOnce();
  });
});
