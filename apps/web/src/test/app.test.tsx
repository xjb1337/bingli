import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RECORD_CORE,
  SCHEMA,
  type DabingliRecord,
  type RecordListItem,
} from '@dabingli/domain';
import {
  createIndexedDbRepository,
  deleteIndexedDbDatabase,
  type IndexedDbRecordRepository,
} from '@dabingli/storage';
import { App } from '../App';
import { createLocalStorageRepository } from '../repository';
import fixtureV1 from '../../../../tests/fixtures/legacy/v1-record.json?raw';
import fixtureV2 from '../../../../tests/fixtures/legacy/v2-record.json?raw';
import fixtureV3 from '../../../../tests/fixtures/legacy/v3-record.json?raw';
import goldenV1Record from '../../../../tests/golden/v1-respiratory/dabingli.txt?raw';
import goldenV1FirstCourse from '../../../../tests/golden/v1-respiratory/first-course.txt?raw';
import goldenV1Discharge from '../../../../tests/golden/v1-respiratory/discharge.txt?raw';
import goldenV2Record from '../../../../tests/golden/v2-digestive/dabingli.txt?raw';
import goldenV2FirstCourse from '../../../../tests/golden/v2-digestive/first-course.txt?raw';
import goldenV2Discharge from '../../../../tests/golden/v2-digestive/discharge.txt?raw';
import goldenV3Record from '../../../../tests/golden/v3-obstetrics/dabingli.txt?raw';
import goldenV3FirstCourse from '../../../../tests/golden/v3-obstetrics/first-course.txt?raw';
import goldenV3Discharge from '../../../../tests/golden/v3-obstetrics/discharge.txt?raw';

const DEPARTMENT_KEYS = SCHEMA.DEPARTMENTS.map((department) => department.key);
const testRepositories: IndexedDbRecordRepository[] = [];
const testDatabaseNames: string[] = [];
let databaseSequence = 0;

function createTestRepository(): IndexedDbRecordRepository {
  databaseSequence += 1;
  const name = `apps-web-test-${Date.now()}-${databaseSequence}`;
  const repository = createIndexedDbRepository({
    databaseName: name,
    legacyStorage: window.localStorage,
  });
  testRepositories.push(repository);
  testDatabaseNames.push(name);
  return repository;
}

async function renderApp(repository = createTestRepository()) {
  const view = render(<App repository={repository} />);
  await screen.findByLabelText(/姓名/);
  return { ...view, repository };
}

function readStoredJson<T>(key: string): T {
  const raw = window.localStorage.getItem(key);
  if (raw === null) throw new Error(`missing localStorage key: ${key}`);
  return JSON.parse(raw) as T;
}

function fixtureRecord(raw: string): DabingliRecord {
  const parsed = RECORD_CORE.parseImport(raw, SCHEMA.emptyRecord, DEPARTMENT_KEYS);
  const first = parsed.records[0];
  if (!first) throw new Error('fixture did not contain a record');
  return RECORD_CORE.cloneValue(first.data);
}

async function seedLibrary(repository: IndexedDbRecordRepository, record: DabingliRecord): Promise<void> {
  await repository.initialize();
  const saved = await repository.saveToLibrary(record, Number(record.meta.revision) || 0);
  if (!saved.ok) throw new Error(saved.reason ?? 'failed to seed repository');
}

function documentText(key: 'record' | 'firstCourse' | 'discharge'): string {
  return screen.getByTestId(`doc-${key}`).textContent ?? '';
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(async () => {
  await Promise.all(testRepositories.splice(0).map((repository) => repository.close()));
  await Promise.all(testDatabaseNames.splice(0).map((name) => deleteIndexedDbDatabase(name)));
});

describe('step navigation and keyboard flow', () => {
  it('keeps entered values while moving with the next and previous buttons', async () => {
    const user = userEvent.setup();
    await renderApp();

    const name = screen.getByLabelText(/姓名/);
    await user.type(name, '导航测试患者');
    await user.click(screen.getByRole('button', { name: '下一步' }));

    expect(screen.getByRole('heading', { name: '现病史' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '上一步' }));

    expect(screen.getByRole('heading', { name: '基本情况' })).toBeInTheDocument();
    expect(screen.getByLabelText(/姓名/)).toHaveValue('导航测试患者');
  });

  it('advances with Enter and keeps an open field group open while editing', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByLabelText(/姓名/));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: '现病史' })).toBeInTheDocument();

    const summary = screen.getByText('补充诱因、进展和伴随症状');
    await user.click(summary);
    const details = summary.closest('details');
    if (!details) throw new Error('missing collapsible details element');
    expect(details).toHaveAttribute('open');

    await user.type(screen.getByLabelText('发病诱因'), '受凉后');
    expect(details).toHaveAttribute('open');

    await user.click(screen.getByLabelText('发病诱因'));
    await user.keyboard('{Escape}');
    expect(details).not.toHaveAttribute('open');
  });

  it('jumps directly to any step from the directory', async () => {
    const user = userEvent.setup();
    await renderApp();

    const directory = screen.getByRole('complementary', { name: '步骤目录' });
    await user.click(within(directory).getByRole('button', { name: /体格检查/ }));
    expect(screen.getByRole('heading', { name: '体格检查' })).toBeInTheDocument();

    await user.click(within(directory).getByRole('button', { name: /生成病历/ }));
    expect(screen.getByRole('heading', { name: '生成病历' })).toBeInTheDocument();
    expect(screen.getByTestId('doc-record')).toBeInTheDocument();
  });

  it('closes the mobile directory with Escape', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole('button', { name: /步骤 1\/11/ }));
    await waitFor(() => expect(document.getElementById('mobile-step-nav')).toBeInTheDocument());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.getElementById('mobile-step-nav')).not.toBeInTheDocument());
  });

  it('moves to the first invalid field when locating a validation error', async () => {
    const user = userEvent.setup();
    await renderApp();

    const directory = screen.getByRole('complementary', { name: '步骤目录' });
    await user.click(within(directory).getByRole('button', { name: /生成病历/ }));
    await user.click(screen.getByRole('button', { name: '定位第一处提醒' }));

    expect(screen.getByRole('heading', { name: '基本情况' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-field-path', 'basic.name');
    });
  });

  it('shows field errors only after the field is blurred or a save is attempted', async () => {
    const user = userEvent.setup();
    await renderApp();

    const name = screen.getByLabelText(/姓名/);
    const nameField = name.closest<HTMLElement>('[data-field-wrap]');
    const genderField = document.querySelector<HTMLElement>('[data-field-wrap="basic.gender"]');
    if (!nameField || !genderField) throw new Error('missing field wrappers');

    expect(document.querySelectorAll('.field-error')).toHaveLength(0);
    expect(name).not.toHaveAttribute('aria-invalid', 'true');
    expect(within(nameField).queryByRole('alert')).not.toBeInTheDocument();

    await user.click(name);
    await user.tab();

    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(within(nameField).getByRole('alert')).toHaveTextContent('姓名');
    expect(within(genderField).queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /保存病历/ }));

    expect(document.querySelectorAll('.field-error').length).toBeGreaterThan(1);
    expect(within(genderField).getByRole('alert')).toHaveTextContent('性别');
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-field-path', 'basic.name');
    });
  });
});

describe('localStorage fallback compatibility', () => {
  it('round-trips a record using the frozen legacy keys', async () => {
    const repository = createLocalStorageRepository(window.localStorage);
    expect(repository.keys).toEqual({
      list: 'dabingli.records.v1',
      current: 'dabingli.current.v1',
      draftPrefix: 'dabingli.draft.v1.',
      settings: 'dabingli.settings.v1',
    });

    const record = repository.newRecord();
    record.basic.name = '兼容键患者';
    record.basic.gender = '女';
    record.basic.age = '38';
    record.hpi.onset = '3天前出现咽痛';

    const saved = await repository.saveToLibrary(record, 0);
    if (!saved.ok || !saved.record?.id) throw new Error(saved.reason ?? 'save failed');
    const id = saved.record.id;

    const pointer = readStoredJson<{ id: string; at: string }>(repository.keys.current);
    expect(pointer.id).toBe(id);
    expect(pointer.at).toEqual(expect.any(String));

    const draft = readStoredJson<DabingliRecord>(`${repository.keys.draftPrefix}${id}`);
    expect(draft.basic.name).toBe('兼容键患者');

    const list = readStoredJson<RecordListItem[]>(repository.keys.list);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(id);
    expect(list[0]?.data.basic.name).toBe('兼容键患者');

    const settings = await repository.loadSettings();
    await repository.saveSettings({ ...settings.settings, lastStep: 'pe', fontScale: 1.15 });
    expect(readStoredJson<{ lastStep: string }>(repository.keys.settings).lastStep).toBe('pe');

    const reopened = createLocalStorageRepository(window.localStorage);
    expect((await reopened.loadCurrent()).record?.basic.name).toBe('兼容键患者');
    expect((await reopened.loadList()).list[0]?.data.basic.name).toBe('兼容键患者');
    expect((await reopened.loadSettings()).settings.fontScale).toBe(1.15);
  });

  it('renders a saved record after the app is mounted again', async () => {
    const user = userEvent.setup();
    const repository = createTestRepository();
    const firstRender = await renderApp(repository);

    await user.type(screen.getByLabelText(/姓名/), '重新加载患者');
    await user.click(screen.getByRole('button', { name: /保存病历/ }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('已保存到本机');
    });
    expect((await repository.loadCurrent()).record?.basic.name).toBe('重新加载患者');
    expect(window.localStorage.getItem(RECORD_CORE.STORAGE_KEYS.current)).toBeNull();
    expect(window.localStorage.getItem(RECORD_CORE.STORAGE_KEYS.list)).toBeNull();

    firstRender.unmount();
    await renderApp(repository);

    expect(screen.getByLabelText(/姓名/)).toHaveValue('重新加载患者');
    expect((await repository.loadList()).list[0]?.data.basic.name).toBe('重新加载患者');
  });
});

describe('golden document rendering', () => {
  const cases = [
    {
      name: 'v1 respiratory',
      fixture: fixtureV1,
      firstCourseDate: '2026-03-01 10:30',
      expected: {
        record: goldenV1Record,
        firstCourse: goldenV1FirstCourse,
        discharge: goldenV1Discharge,
      },
    },
    {
      name: 'v2 digestive',
      fixture: fixtureV2,
      firstCourseDate: '2026-04-02 10:30',
      expected: {
        record: goldenV2Record,
        firstCourse: goldenV2FirstCourse,
        discharge: goldenV2Discharge,
      },
    },
    {
      name: 'v3 obstetrics',
      fixture: fixtureV3,
      firstCourseDate: '2026-05-03 11:00',
      expected: {
        record: goldenV3Record,
        firstCourse: goldenV3FirstCourse,
        discharge: goldenV3Discharge,
      },
    },
  ] as const;

  for (const testCase of cases) {
    it(`matches the three PR0 snapshots for ${testCase.name}`, async () => {
      const user = userEvent.setup();
      const record = fixtureRecord(testCase.fixture);
      record.soap.recordTime = testCase.firstCourseDate;
      const repository = createTestRepository();
      await seedLibrary(repository, record);

      await renderApp(repository);
      const directory = screen.getByRole('complementary', { name: '步骤目录' });
      await user.click(within(directory).getByRole('button', { name: /生成病历/ }));

      expect(documentText('record')).toBe(testCase.expected.record);
      expect(documentText('firstCourse')).toBe(testCase.expected.firstCourse);
      expect(documentText('discharge')).toBe(testCase.expected.discharge);
    });
  }
});
