import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RECORD_CORE, SCHEMA } from '@dabingli/domain';
import {
  createIndexedDbRepository,
  deleteIndexedDbDatabase,
  type IndexedDbRecordRepository,
} from '@dabingli/storage';
import {
  AiError,
  type AiTransport,
  type AiTransportFactory,
} from '@dabingli/ai';
import { App } from '../App';
import { AiAssistantPanel } from '../components/AiAssistantPanel';
import appStyles from '../styles.css?raw';

const testRepositories: IndexedDbRecordRepository[] = [];
const testDatabaseNames: string[] = [];
let databaseSequence = 0;

function createTestRepository(): IndexedDbRecordRepository {
  databaseSequence += 1;
  const name = `apps-web-ai-test-${Date.now()}-${databaseSequence}`;
  const repository = createIndexedDbRepository({
    databaseName: name,
    legacyStorage: window.localStorage,
  });
  testRepositories.push(repository);
  testDatabaseNames.push(name);
  return repository;
}

function fakeTransportFactory(
  request: AiTransport['request'],
): { factory: AiTransportFactory; request: AiTransport['request']; factorySpy: ReturnType<typeof vi.fn> } {
  const factorySpy = vi.fn((_apiKey: string): AiTransport => ({
    kind: 'web',
    status: async () => ({ configured: true, model: 'deepseek-flash' }),
    request,
  }));
  return { factory: factorySpy, request, factorySpy };
}

function aiContent() {
  return {
    suggestions: [{
      path: 'hpi.symptoms',
      text: '患者诉咳嗽3天。',
      evidence: [{ source: 'note', quote: '患者诉咳嗽3天' }],
    }],
    issues: [],
    questions: [],
  };
}

async function renderApp(factory?: AiTransportFactory, repository = createTestRepository()) {
  const view = render(<App repository={repository} aiTransportFactory={factory} />);
  await screen.findByLabelText(/姓名/);
  return { ...view, repository };
}

async function goToOutput(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const directory = screen.getByRole('complementary', { name: '步骤目录' });
  await user.click(within(directory).getByRole('button', { name: /生成病历/ }));
  await screen.findByRole('heading', { name: '生成病历' });
}

async function saveFromHeader(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const actions = screen.getByRole('navigation', { name: '全局操作' });
  await user.click(within(actions).getByRole('button', { name: /保存病历/ }));
}

async function enterKey(user: ReturnType<typeof userEvent.setup>, key: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: '设置' }));
  const input = await screen.findByLabelText('DeepSeek API Key');
  await user.clear(input);
  await user.type(input, key);
  expect(screen.getByText(/仅保存在本页内存，刷新后需重新输入/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '返回编辑' }));
}

async function runAdoption(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await goToOutput(user);
  await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
  await user.click(screen.getByRole('button', { name: '预览发送内容' }));
  await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
  await user.click(screen.getByRole('button', { name: '生成建议' }));
  await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });
  await user.click(screen.getByLabelText('选择症状特点'));
  await user.click(screen.getByRole('button', { name: '采纳勾选项' }));
  await screen.findByText('已采纳并保存到草稿，内容仍为「未核对」；请逐项确认。');
}

async function readIndexedDatabase(name: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onerror = () => reject(request.error ?? new Error('indexedDB open failed'));
    request.onsuccess = () => {
      const database = request.result;
      const stores = Array.from(database.objectStoreNames);
      const transaction = database.transaction(stores, 'readonly');
      const values: unknown[] = [];
      stores.forEach((store) => {
        const all = transaction.objectStore(store).getAll();
        all.onsuccess = () => values.push(all.result);
      });
      transaction.oncomplete = () => {
        database.close();
        resolve(JSON.stringify(values));
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error ?? new Error('indexedDB read failed'));
      };
    };
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.cookie = '';
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(testRepositories.splice(0).map((repository) => repository.close()));
  await Promise.all(testDatabaseNames.splice(0).map((name) => deleteIndexedDbDatabase(name)));
});

describe('DeepSeek web security boundary', () => {
  it('keeps touch targets at 44px and AI output wrapping at narrow widths', () => {
    expect(appStyles).toMatch(/button\s*\{[^}]*min-height:\s*44px/s);
    expect(appStyles).toMatch(/\.ai-panel details > summary\s*\{[^}]*min-height:\s*44px/s);
    expect(appStyles).toMatch(/\.ai-json-preview\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(appStyles).toMatch(/\.ai-compare\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  });

  it('shows readable send entries by default and keeps raw JSON collapsed', async () => {
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.id = 'preview_entries_case';

    render(
      <AiAssistantPanel
        record={record}
        configured
        securityContext="web"
        model="deepseek-flash"
        createTransport={() => transport.factory('sk-test-preview')}
        onOpenSettings={() => undefined}
        onAdoptRecord={async () => true}
        onConfirmField={async () => true}
      />,
    );

    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));

    const sendPreview = screen.getByRole('region', { name: '实际发送内容（1 条资料）' });
    expect(within(sendPreview).getByText('本次笔记')).toBeInTheDocument();
    expect(within(sendPreview).getByText('note')).toBeInTheDocument();
    expect(within(sendPreview).getByText('患者诉咳嗽3天')).toBeInTheDocument();
    expect(screen.queryByText('查看实际发送内容（1 条资料）')).not.toBeInTheDocument();

    const rawDetails = screen.getByText('查看原始 JSON（高级）').closest('details');
    expect(rawDetails).not.toBeNull();
    expect(rawDetails).not.toHaveAttribute('open');
    expect(within(rawDetails as HTMLElement).getByText(/"sources"/)).toBeInTheDocument();
  });

  it('offers camera, gallery and pasted-text recognition without auto-selecting results', async () => {
    const requestSpy = vi.fn(async (_request: Parameters<AiTransport['request']>[0]) => ({
      content: {
        suggestions: [
          { path: 'pe.vitals.temperature', text: '37.8', evidence: [] },
          { path: 'basic.gender', text: '女', evidence: [] },
        ],
        issues: [],
        questions: [],
      },
      model: 'deepseek-flash',
    }));
    const transport = fakeTransportFactory(requestSpy);
    const onAdoptRecord = vi.fn(async (_next: ReturnType<typeof SCHEMA.emptyRecord>) => true);
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.id = 'recognize_ui_case';

    render(
      <AiAssistantPanel
        record={record}
        configured
        securityContext="web"
        model="deepseek-flash"
        createTransport={() => transport.factory('sk-test-recognize')}
        onOpenSettings={() => undefined}
        onAdoptRecord={onAdoptRecord}
        onConfirmField={async () => true}
      />,
    );

    await user.selectOptions(screen.getByLabelText('AI 操作'), 'recognize');
    const camera = screen.getByLabelText('拍照识别病历');
    const gallery = screen.getByLabelText('选择病历图片');
    expect(camera).toHaveAttribute('accept', 'image/*');
    expect(camera).toHaveAttribute('capture', 'environment');
    expect(gallery).toHaveAttribute('accept', 'image/*');
    expect(screen.getByRole('button', { name: '拍照' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '选择图片' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/粘贴病历文字/), '体温 37.8℃，性别女');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    expect(screen.getByText(/图片会以压缩后的版本发送/)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });

    expect(await screen.findByText('选择项 · 默认不勾选')).toBeInTheDocument();
    const gender = screen.getByLabelText('选择性别');
    const temperature = screen.getByLabelText('选择生命体征 · 体温');
    expect(gender).not.toBeChecked();
    expect(temperature).not.toBeChecked();
    expect(onAdoptRecord).not.toHaveBeenCalled();
    const sent = requestSpy.mock.calls[0]?.[0];
    expect(sent?.image).toBeUndefined();
    expect(sent?.user).toContain('识别病历图片/文字');

    await user.click(gender);
    await user.click(screen.getByRole('button', { name: '采纳勾选项' }));
    await waitFor(() => expect(onAdoptRecord).toHaveBeenCalledTimes(1));
    const adopted = onAdoptRecord.mock.calls[0]?.[0];
    expect(adopted?.basic.gender).toBe('女');
    expect(RECORD_CORE.fieldState(adopted ?? record, 'basic.gender').source).toBe('ai');
    expect(RECORD_CORE.fieldReviewValid(adopted ?? record, 'basic.gender')).toBe(false);
  });

  it('clears the entered key when the page component is remounted', async () => {
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const repository = createTestRepository();
    const first = await renderApp(transport.factory, repository);
    const user = userEvent.setup();
    await enterKey(user, 'sk-reload-clears');
    first.unmount();

    await renderApp(transport.factory, repository);
    await user.click(screen.getByRole('button', { name: '设置' }));
    expect(await screen.findByLabelText('DeepSeek API Key')).toHaveValue('');
  });

  it('keeps the memory-only key out of storage, exports, URLs, cookies and logs', async () => {
    const key = 'sk-memory-only-never-persist-7f4c';
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const logs = [
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
    ];
    const user = userEvent.setup();
    const { repository } = await renderApp(transport.factory);

    await enterKey(user, key);
    await runAdoption(user);
    await saveFromHeader(user);

    const databaseDump = await readIndexedDatabase(repository.databaseName);
    const exported = JSON.stringify(await repository.exportBackup('all'));
    const storageDump = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.getItem(window.localStorage.key(index) ?? '') ?? '');
    const sessionDump = Array.from({ length: window.sessionStorage.length }, (_, index) =>
      window.sessionStorage.getItem(window.sessionStorage.key(index) ?? '') ?? '');

    expect(databaseDump).not.toContain(key);
    expect(exported).not.toContain(key);
    expect(storageDump.join('\n')).not.toContain(key);
    expect(sessionDump.join('\n')).not.toContain(key);
    expect(document.cookie).not.toContain(key);
    expect(window.location.href).not.toContain(key);
    logs.forEach((spy) => {
      expect(spy.mock.calls.map((args) => args.map(String).join(' ')).join('\n')).not.toContain(key);
    });
    expect(transport.factorySpy).toHaveBeenCalledWith(key);

    await user.click(screen.getByRole('button', { name: '设置' }));
    await user.click(await screen.findByRole('button', { name: '查看导出 JSON' }));
    expect((screen.getByLabelText(/当前导出快照/) as HTMLTextAreaElement).value).not.toContain(key);
  });

  it('shows an unverified badge, persists it, and clears it only after confirmation', async () => {
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const user = userEvent.setup();
    const { repository } = await renderApp(transport.factory);

    await enterKey(user, 'sk-test');
    await runAdoption(user);

    expect(screen.getByText('1 项未核对')).toBeInTheDocument();
    const saved = await repository.loadCurrent();
    expect(saved.record?.hpi.symptoms).toBe('患者诉咳嗽3天。');
    expect(RECORD_CORE.fieldState(saved.record ?? repository.newRecord(), 'hpi.symptoms').source).toBe('ai');
    expect(RECORD_CORE.fieldReviewValid(saved.record ?? repository.newRecord(), 'hpi.symptoms')).toBe(false);

    await user.click(screen.getByRole('button', { name: '确认已核对：症状特点' }));
    await screen.findByText('0 项未核对');
    expect(screen.getByText('已核对')).toBeInTheDocument();
    const confirmed = await repository.loadCurrent();
    expect(RECORD_CORE.fieldReviewValid(confirmed.record ?? repository.newRecord(), 'hpi.symptoms')).toBe(true);
  });

  it('blocks adopting a result after the record changes and explains why', async () => {
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const onAdoptRecord = vi.fn(async () => true);
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.id = 'stale_ui_case';
    const props = {
      record,
      configured: true,
      securityContext: 'web' as const,
      model: 'deepseek-flash',
      createTransport: () => transport.factory('sk-test-stale'),
      onOpenSettings: () => undefined,
      onAdoptRecord,
      onConfirmField: async () => true,
    };
    const view = render(<AiAssistantPanel {...props} />);

    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });

    const changed = RECORD_CORE.cloneValue(record);
    changed.hpi.onset = '刚补充的起病时间';
    view.rerender(<AiAssistantPanel {...props} record={changed} />);
    await user.click(screen.getByLabelText('选择症状特点'));
    await user.click(screen.getByRole('button', { name: '采纳勾选项' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('病历已改变，此 AI 结果已过期，无法写入');
    expect(onAdoptRecord).not.toHaveBeenCalled();
  });

  it('leaves every normal function usable without a key and shows an AI hint', async () => {
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const user = userEvent.setup();
    const { repository } = await renderApp(transport.factory);

    await user.type(screen.getByLabelText(/姓名/), '无密钥患者');
    await user.click(screen.getByRole('button', { name: /保存病历/ }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已保存到本机'));

    await goToOutput(user);
    expect(screen.getByRole('note')).toHaveTextContent(/未配置 API Key/);
    expect(screen.getByRole('button', { name: '前往设置输入密钥' })).toBeInTheDocument();
    expect(transport.factorySpy).not.toHaveBeenCalled();
    expect((await repository.loadCurrent()).record?.basic.name).toBe('无密钥患者');
  });

  it('shows the stable service error without writing or exposing credentials', async () => {
    const request = vi.fn(async () => {
      throw new AiError('server_unavailable');
    });
    const transport = fakeTransportFactory(request);
    const user = userEvent.setup();
    const { repository } = await renderApp(transport.factory);

    await enterKey(user, 'sk-test-error');
    await user.type(screen.getByLabelText(/姓名/), '服务错误患者');
    await saveFromHeader(user);
    await waitFor(async () => {
      expect((await repository.loadCurrent()).record?.basic.name).toBe('服务错误患者');
    });
    await goToOutput(user);
    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('DeepSeek 服务暂不可用，请稍后重试');
    expect((await repository.loadCurrent()).record?.hpi.symptoms).toBe('');
  });
});
