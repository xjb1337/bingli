import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RECORD_CORE, SCHEMA, type DabingliRecord } from '@dabingli/domain';
import {
  createIndexedDbRepository,
  deleteIndexedDbDatabase,
  type IndexedDbRecordRepository,
} from '@dabingli/storage';
import { App } from '../App';
import { createLocalStorageRepository } from '../repository';

const repositories: IndexedDbRecordRepository[] = [];
const databaseNames: string[] = [];
let sequence = 0;

function createTestRepository(): IndexedDbRecordRepository {
  sequence += 1;
  const name = `apps-web-v32-test-${Date.now()}-${sequence}`;
  const repository = createIndexedDbRepository({
    databaseName: name,
    legacyStorage: window.localStorage,
  });
  repositories.push(repository);
  databaseNames.push(name);
  return repository;
}

function makeRecord(name: string, overrides: (record: DabingliRecord) => void = () => {}): DabingliRecord {
  const record = SCHEMA.emptyRecord();
  record.id = `record-${Math.random().toString(36).slice(2, 10)}`;
  record.basic.name = name;
  record.meta.revision = 0;
  overrides(record);
  return record;
}

async function seed(repository: IndexedDbRecordRepository, record: DabingliRecord): Promise<void> {
  await repository.initialize();
  const saved = await repository.saveToLibrary(record, 0);
  if (!saved.ok) throw new Error(saved.reason ?? 'seed failed');
}

async function renderApp(repository: IndexedDbRecordRepository) {
  const view = render(<App repository={repository} />);
  await screen.findByLabelText(/姓名/);
  return view;
}

async function openAiWithKey(user: ReturnType<typeof userEvent.setup>, key = 'sk-v32-test'): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'AI 助手' }));
  await screen.findByRole('heading', { name: 'AI 助手' });
  const input = await screen.findByLabelText('DeepSeek API Key');
  await user.type(input, key);
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await Promise.all(repositories.splice(0).map((repository) => repository.close()));
  await Promise.all(databaseNames.splice(0).map((name) => deleteIndexedDbDatabase(name)));
});

describe('v3.2 record notes and list features', () => {
  it('saves raw notes with the record, restores them after reopen, and can reorganize', async () => {
    const repository = createTestRepository();
    const first = await renderApp(repository);
    const user = userEvent.setup();
    await openAiWithKey(user);

    const aiPage = screen.getByRole('heading', { name: 'AI 助手' }).closest('section');
    expect(aiPage?.textContent).not.toContain('系统回顾');

    const note = '虚构原始笔记：咳嗽三天，夜间加重。';
    await user.type(screen.getByLabelText(/问诊笔记/), note);
    await waitFor(async () => {
      expect((await repository.loadCurrent()).record?.rawNotes).toBe(note);
    }, { timeout: 4000 });

    await user.click(screen.getByRole('button', { name: '重新整理' }));
    expect(await screen.findByRole('region', { name: /实际发送内容/ })).toBeInTheDocument();

    first.unmount();
    await renderApp(repository);
    await openAiWithKey(user, 'sk-v32-reopen');
    expect(screen.getByLabelText(/问诊笔记/)).toHaveValue(note);
  }, 15000);

  it('searches by partial fields, copies a record with a fresh id, and does not copy notes', async () => {
    const repository = createTestRepository();
    await seed(repository, makeRecord('虚构肺炎患者', (record) => {
      record.id = 'search-a';
      record.basic.department = 'respiratory';
      record.basic.chiefComplaint = '咳嗽伴发热';
      record.hpi.symptoms = '受凉后咳嗽。';
      record.pe.general.conscious = '神志清楚，精神可';
      record.diagnosis.confirmed = ['社区获得性肺炎'];
      record.rawNotes = '虚构笔记甲';
      record.meta.conflicts = { marriage: { basicValue: '已婚', marriageValue: '离异' } };
      record.meta.fieldStates = {
        'basic.name': { source: 'ai' },
        'pe.vitals.temperature': { source: 'ai' },
        'hpi.symptoms': { source: 'ai' },
      };
      record.meta.legacyUnmapped = {
        'basic.phone': '虚构旧电话',
        ros: '旧版系统回顾：无殊',
      };
      record.meta.migratedFrom = '2';
      record.meta.migrationNotes = ['虚构旧迁移说明'];
    }));
    await seed(repository, makeRecord('虚构胃炎患者', (record) => {
      record.id = 'search-b';
      record.basic.department = 'digestive';
      record.basic.chiefComplaint = '上腹隐痛';
      record.discharge.diagnoses = ['慢性胃炎'];
      record.rawNotes = '虚构笔记乙';
    }));

    await renderApp(repository);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '病历列表' }));
    await screen.findByRole('heading', { name: '病历列表' });

    const search = screen.getByLabelText('搜索病历');
    await user.type(search, '肺炎');
    expect(screen.getByRole('heading', { name: '虚构肺炎患者' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '虚构胃炎患者' })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, '不存在');
    expect(screen.getByText('没有匹配的病历')).toBeInTheDocument();

    await user.clear(search);
    const card = screen.getByRole('heading', { name: '虚构肺炎患者' }).closest('article');
    if (!card) throw new Error('missing record card');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(within(card).getByRole('button', { name: '复制为新病历' }));
    expect(confirm).toHaveBeenCalled();

    await waitFor(async () => {
      const loaded = await repository.loadList();
      expect(loaded.list).toHaveLength(3);
    });
    const current = await repository.loadCurrent();
    expect(current.record?.id).not.toBe('search-a');
    expect(current.record?.basic.name).toBe('');
    expect(current.record?.basic.department).toBe('respiratory');
    expect(current.record?.basic.chiefComplaint).toBe('咳嗽伴发热');
    expect(current.record?.hpi.symptoms).toBe('受凉后咳嗽。');
    expect(current.record?.pe.general.conscious).toBe('神志清楚，精神可');
    expect(current.record?.diagnosis.confirmed).toEqual(['社区获得性肺炎']);
    expect(current.record?.rawNotes).toBe('');
    expect(current.record?.meta.conflicts).toEqual({});
    expect(current.record?.meta.fieldStates?.['basic.name']).toBeUndefined();
    expect(current.record?.meta.fieldStates?.['pe.vitals.temperature']).toBeUndefined();
    expect(current.record?.meta.fieldStates?.['hpi.symptoms']).toMatchObject({ source: 'ai' });
    expect(current.record?.meta.legacyUnmapped?.['basic.phone']).toBeUndefined();
    expect(current.record?.meta.legacyUnmapped?.ros).toBe('旧版系统回顾：无殊');
    expect(current.record?.meta.migratedFrom).toBeNull();
    expect(current.record?.meta.migrationNotes).toEqual([]);
    expect(screen.getByLabelText(/姓名/)).toHaveValue('');
  }, 15000);

  it('exports without raw notes by default and includes them only when checked', async () => {
    const repository = createTestRepository();
    await seed(repository, makeRecord('虚构备份患者', (record) => {
      record.rawNotes = '虚构备份笔记';
    }));
    await renderApp(repository);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '病历列表' }));
    await screen.findByRole('heading', { name: '病历列表' });

    await user.click(screen.getByRole('button', { name: '查看导出 JSON' }));
    const exportText = screen.getByLabelText('当前导出快照（JSON）') as HTMLTextAreaElement;
    expect(exportText.value).not.toContain('虚构备份笔记');
    const checkbox = screen.getByRole('checkbox', { name: /备份中包含原始笔记/ });
    expect(checkbox).not.toBeChecked();

    const exportSpy = vi.spyOn(repository, 'exportBackup');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:v32') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: '下载全部 JSON' }));
    await waitFor(() => expect(exportSpy).toHaveBeenCalledWith('all', { includeNotes: false }));

    await user.click(checkbox);
    await waitFor(() => expect(exportText.value).toContain('虚构备份笔记'));
    expect(exportText.value).toContain('includesNotes');
    await user.click(screen.getByRole('button', { name: '下载全部 JSON' }));
    await waitFor(() => expect(exportSpy).toHaveBeenLastCalledWith('all', { includeNotes: true }));
  }, 15000);

  it('preserves local notes when the web localStorage fallback merges a no-notes backup', async () => {
    const repository = createLocalStorageRepository(window.localStorage);
    const record = repository.newRecord();
    record.basic.name = '虚构兼容仓储患者';
    record.rawNotes = '虚构兼容仓储本机笔记';
    const saved = await repository.saveToLibrary(record, 0);
    const savedRecord = saved.record;
    if (!savedRecord?.id) throw new Error(saved.reason ?? 'save failed');
    const id = savedRecord.id;

    const incoming = RECORD_CORE.cloneValue(savedRecord);
    incoming.basic.name = '虚构兼容仓储导入患者';
    const bundle = RECORD_CORE.buildExport([{
      id,
      updatedAt: '2099-01-01T00:00:00.000Z',
      data: incoming,
    }], '2099-01-01T00:00:00.000Z');
    await repository.importBackup(JSON.stringify(bundle), 'merge');

    const restored = (await repository.loadList()).list.find((item) => item.id === id);
    expect(restored?.data.basic.name).toBe('虚构兼容仓储导入患者');
    expect(restored?.data.rawNotes).toBe('虚构兼容仓储本机笔记');
  });
});
