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
  adoptAiSuggestions,
  confirmAiField,
  parseAiResult,
  prepareAiRequest,
  type AiTransport,
  type AiTransportFactory,
} from '@dabingli/ai';
import { App } from '../App';
import { AiAssistantPanel } from '../components/AiAssistantPanel';
import { AiPage } from '../pages/AiPage';
import { STEPS } from '../steps';
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

async function goToAi(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'AI 助手' }));
  await screen.findByRole('heading', { name: 'AI 助手' });
}

async function saveFromHeader(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const actions = screen.getByRole('navigation', { name: '全局操作' });
  await user.click(within(actions).getByRole('button', { name: /保存病历/ }));
}

async function enterKey(user: ReturnType<typeof userEvent.setup>, key: string): Promise<void> {
  await goToAi(user);
  const input = await screen.findByLabelText('DeepSeek API Key');
  await user.clear(input);
  await user.type(input, key);
  expect(screen.getByText(/仅保存在本页内存，刷新后需重新输入/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '返回编辑' }));
}

async function runAdoption(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await goToAi(user);
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
  vi.unstubAllGlobals();
  await Promise.all(testRepositories.splice(0).map((repository) => repository.close()));
  await Promise.all(testDatabaseNames.splice(0).map((name) => deleteIndexedDbDatabase(name)));
});

describe('DeepSeek web security boundary', () => {
  it('opens the independent AI page from every step and returns to the same step', async () => {
    const user = userEvent.setup();
    await renderApp();
    const expectedTargets: Record<string, string> = {
      basic: 'basic.chiefComplaint', hpi: 'hpi.symptoms', pmh: 'pmh.diseaseDetail',
      personal: 'personal.drugs', family: 'family.other',
    };
    for (const step of STEPS) {
      const directory = screen.getByRole('complementary', { name: '步骤目录' });
      await user.click(within(directory).getByRole('button', { name: new RegExp(step.name) }));
      expect(screen.queryByLabelText('AI 操作')).not.toBeInTheDocument();
      await goToAi(user);
      expect(screen.getAllByRole('heading', { name: 'API 设置' })).toHaveLength(1);
      expect(screen.queryByRole('complementary', { name: '步骤目录' })).not.toBeInTheDocument();
      await user.type(screen.getByLabelText('DeepSeek API Key'), 'sk-context');
      await user.selectOptions(screen.getByLabelText('AI 操作'), 'polish');
      expect(screen.getByLabelText('润色字段')).toHaveValue(expectedTargets[step.key] ?? 'hpi.symptoms');
      await user.click(screen.getByRole('button', { name: '清除内存中的密钥' }));
      await user.click(screen.getByRole('button', { name: '返回编辑' }));
      expect(within(screen.getByRole('complementary', { name: '步骤目录' }))
        .getByRole('button', { name: new RegExp(step.name) })).toHaveAttribute('aria-current', 'step');
    }
    await user.click(screen.getByRole('button', { name: '设置' }));
    await screen.findByRole('heading', { name: '设置' });
    expect(screen.queryByLabelText('DeepSeek API Key')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'API 设置' })).not.toBeInTheDocument();
    await goToAi(user);
    await user.click(screen.getByRole('button', { name: '病历列表' }));
    await screen.findByRole('heading', { name: '病历列表' });
    await goToAi(user);
  }, 15000);

  it('tests the connection with fixed text, keeps configuration across views and clears the key in place', async () => {
    const request = vi.fn(async (_request: Parameters<AiTransport['request']>[0]) => ({ content: { ok: true }, model: 'deepseek-flash' }));
    const transport = fakeTransportFactory(request);
    const user = userEvent.setup();
    await renderApp(transport.factory);
    await enterKey(user, 'sk-connection-test');
    await goToAi(user);
    await user.click(screen.getByText('如何获取 DeepSeek API Key · 配置与测试'));
    expect(screen.getByLabelText('DeepSeek API Key')).toHaveValue('sk-connection-test');
    expect(request).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '测试连接' }));
    expect(await screen.findByText('连接成功，响应模型：deepseek-flash')).toBeInTheDocument();
    expect(request.mock.calls[0]?.[0]).toEqual({
      system: '这是 API 连接测试。只返回 JSON 对象 {"ok":true}。',
      user: '{"connection_test":true}',
    });
    await user.selectOptions(screen.getByLabelText('文本模型'), 'deepseek-v4-pro');
    expect(screen.queryByText(/连接成功/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '清除内存中的密钥' }));
    expect(screen.getByLabelText('DeepSeek API Key')).toHaveValue('');
    expect(screen.getByRole('button', { name: '测试连接' })).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent('本页顶部「API 设置」');
  });

  it('configures Android through the native bridge on the AI page without a key input', async () => {
    let configured = false;
    const aiSettings = vi.fn();
    vi.stubGlobal('BingliAndroid', {
      aiStatus: () => JSON.stringify({ configured, model: configured ? 'deepseek-v4-pro' : 'deepseek-flash' }),
      aiSettings, aiRequest: vi.fn(), aiCancel: vi.fn(),
    });
    const user = userEvent.setup();
    await renderApp();
    await goToAi(user);
    expect(screen.queryByLabelText('DeepSeek API Key')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '打开 Android AI 设置 / 测试连接' }));
    expect(aiSettings).toHaveBeenCalledTimes(1);
    configured = true;
    await user.click(screen.getByRole('button', { name: '刷新状态' }));
    expect(await screen.findByLabelText('AI 操作')).toBeInTheDocument();
    expect(screen.getAllByText('deepseek-v4-pro').length).toBeGreaterThan(0);
  });

  it('keeps touch targets at 44px and AI output wrapping at narrow widths', () => {
    expect(appStyles).toMatch(/button\s*\{[^}]*min-height:\s*44px/s);
    expect(appStyles).toMatch(/\.ai-panel details > summary\s*\{[^}]*min-height:\s*44px/s);
    expect(appStyles).toMatch(/\.ai-json-preview\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(appStyles).toMatch(/\.ai-compare\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(appStyles).toMatch(/\.ai-compare\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
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
        onAdoptRecord={async () => true}
        onConfirmField={async () => true}
        onJumpToPath={vi.fn()}
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

  it('walks through four organize steps, keeps evidence expanded and jumps to the adopted field', async () => {
    const request = vi.fn(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const transport = fakeTransportFactory(request);
    const user = userEvent.setup();
    await renderApp(transport.factory);
    await enterKey(user, 'sk-organize-steps');
    await goToAi(user);

    const progress = () => within(screen.getByRole('navigation', { name: '整理填表进度' }));
    const currentStep = () => screen.getByRole('navigation', { name: '整理填表进度' }).querySelector('[aria-current="step"]');
    expect(progress().getAllByRole('button')).toHaveLength(4);
    expect(currentStep()).toHaveTextContent('贴笔记');
    expect(progress().getByRole('button', { name: '预览确认' })).toBeDisabled();
    expect(progress().getByRole('button', { name: '建议对照' })).toBeDisabled();
    expect(progress().getByRole('button', { name: '已采纳/回表单' })).toBeDisabled();
    expect(screen.queryByRole('heading', { name: '已采纳的 AI 内容' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    expect(currentStep()).toHaveTextContent('预览确认');
    expect(screen.queryByLabelText(/问诊笔记/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生成建议' })).toBeDisabled();
    expect(request).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '返回贴笔记' }));
    expect(screen.getByLabelText(/问诊笔记/)).toHaveValue('患者诉咳嗽3天');
    await user.click(progress().getByRole('button', { name: '预览确认' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });
    expect(currentStep()).toHaveTextContent('建议对照');
    expect(screen.queryByRole('region', { name: /实际发送内容/ })).not.toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(within(card).getByText('原内容')).toBeVisible();
    expect(within(card).getByText('（空白）')).toBeVisible();
    expect(within(card).getByText('AI 建议 · 待核对')).toBeVisible();
    expect(within(card).getByText('患者诉咳嗽3天。')).toBeVisible();
    expect(within(card).getByText('原文依据')).toBeVisible();
    const quote = within(card).getByText('患者诉咳嗽3天');
    expect(quote).toBeVisible();
    expect(quote.closest('details')).toBeNull();
    expect(screen.getByLabelText('选择症状特点')).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: '返回预览确认' }));
    expect(currentStep()).toHaveTextContent('预览确认');
    await user.click(progress().getByRole('button', { name: '建议对照' }));
    await user.click(screen.getByLabelText('选择症状特点'));
    await user.click(screen.getByRole('button', { name: '采纳勾选项' }));
    await screen.findByRole('heading', { name: '已采纳的 AI 内容' });
    expect(currentStep()).toHaveTextContent('已采纳/回表单');
    expect(screen.getByRole('button', { name: '确认已核对：症状特点' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '返回建议对照' }));
    expect(await screen.findByRole('heading', { name: '建议对照 · 本轮已采纳' })).toBeInTheDocument();
    expect(screen.getByLabelText('选择症状特点')).toBeDisabled();
    expect(screen.queryByRole('button', { name: '采纳勾选项' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新预览发送内容' }));
    expect(currentStep()).toHaveTextContent('预览确认');
    expect(screen.getByLabelText(/我已核对下方实际发送内容/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: '生成建议' })).toBeDisabled();
    expect(progress().getByRole('button', { name: '建议对照' })).toBeDisabled();
    await user.click(progress().getByRole('button', { name: '已采纳/回表单' }));

    await user.click(screen.getByRole('button', { name: '去改该字段' }));
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-field-path', 'hpi.symptoms');
    });
    expect(document.activeElement).toHaveValue('患者诉咳嗽3天。');
    expect(screen.queryByRole('heading', { name: 'AI 助手' })).not.toBeInTheDocument();
  });

  it('invalidates preview and consent when notes change, and keeps other operations outside the step flow', async () => {
    const user = userEvent.setup();
    render(<AiAssistantPanel
      record={SCHEMA.emptyRecord()}
      configured
      securityContext="web"
      model="deepseek-flash"
      createTransport={() => fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' })).factory('sk-test')}
      onAdoptRecord={async () => true}
      onConfirmField={async () => true}
      onJumpToPath={vi.fn()}
    />);
    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '返回贴笔记' }));
    await user.type(screen.getByLabelText(/问诊笔记/), '，无发热');
    const progress = within(screen.getByRole('navigation', { name: '整理填表进度' }));
    expect(progress.getByRole('button', { name: '预览确认' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    expect(screen.getByLabelText(/我已核对下方实际发送内容/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: '生成建议' })).toBeDisabled();
    for (const operation of ['polish', 'check', 'summary', 'recognize']) {
      await user.selectOptions(screen.getByLabelText('AI 操作'), operation);
      expect(screen.queryByRole('navigation', { name: '整理填表进度' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '预览发送内容' })).toBeEnabled();
    }
  });

  it('offers camera, gallery and pasted-text recognition without auto-selecting results', async () => {
    const requestSpy = vi.fn(async (_request: Parameters<AiTransport['request']>[0]) => ({
      content: {
        suggestions: [
          { path: 'pe.vitals.temperature', text: '37.8', evidence: [{ source: 'note', quote: '体温 37.8℃' }] },
          { path: 'basic.gender', text: '女', evidence: [{ source: 'note', quote: '性别女' }] },
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
        onAdoptRecord={onAdoptRecord}
        onConfirmField={async () => true}
        onJumpToPath={vi.fn()}
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

  it('shows dropped recognition suggestions with their reasons', async () => {
    const transport = fakeTransportFactory(async () => ({
      content: {
        suggestions: [
          { path: 'pe.vitals.temperature', text: '37.8', evidence: [{ source: 'note', quote: '体温 37.8℃' }] },
          { path: 'pe.vitals.pulse', text: '80', evidence: [] },
        ],
        issues: [],
        questions: [],
      },
      model: 'deepseek-flash',
    }));
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.id = 'dropped_ui_case';

    render(
      <AiAssistantPanel
        record={record}
        configured
        securityContext="web"
        model="deepseek-flash"
        createTransport={() => transport.factory('sk-test-dropped')}
        onAdoptRecord={async () => true}
        onConfirmField={async () => true}
        onJumpToPath={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('AI 操作'), 'recognize');
    await user.type(screen.getByLabelText(/粘贴病历文字/), '体温 37.8℃，脉搏 80 次/分');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });

    expect(screen.getByText('1 条建议因格式问题未采用')).toBeInTheDocument();
    expect(screen.getByText(/生命体征 · 脉搏/)).toBeInTheDocument();
    expect(screen.getByText(/缺少有效原文依据/)).toBeInTheDocument();
  });

  it('marks image-derived suggestions as manually unverified', async () => {
    const requestSpy = vi.fn(async (_request: Parameters<AiTransport['request']>[0]) => ({
      content: {
        suggestions: [{
          path: 'pe.vitals.temperature',
          text: '37.8',
          evidence: [{ source: 'image', quote: '体温 37.8℃' }],
        }],
        issues: [],
        questions: [],
      },
      model: 'deepseek-flash',
    }));
    const transport = fakeTransportFactory(requestSpy);
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.id = 'image_note_ui_case';

    vi.stubGlobal('Image', class {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { setTimeout(() => this.onload?.(), 0); }
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,QUJD');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:mock-image') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn(() => undefined) });

    render(
      <AiAssistantPanel
        record={record}
        configured
        securityContext="web"
        model="deepseek-flash"
        createTransport={() => transport.factory('sk-test-image-note')}
        onAdoptRecord={async () => true}
        onConfirmField={async () => true}
        onJumpToPath={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('AI 操作'), 'recognize');
    const file = new File([new Uint8Array([1, 2, 3])], '病历.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('选择病历图片'), file);
    expect(await screen.findByAltText('待发送病历图片缩略图')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已确认图片可能含患者身份信息/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });

    expect(screen.getByText('来自图片，依据未能自动核实')).toBeInTheDocument();
    expect(requestSpy.mock.calls[0]?.[0].image).toBeDefined();
  });

  it('clears the entered key when the page component is remounted', async () => {
    const transport = fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' }));
    const repository = createTestRepository();
    const first = await renderApp(transport.factory, repository);
    const user = userEvent.setup();
    await enterKey(user, 'sk-reload-clears');
    first.unmount();

    await renderApp(transport.factory, repository);
    await goToAi(user);
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
      onAdoptRecord,
      onConfirmField: async () => true,
      onJumpToPath: vi.fn(),
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

    await goToAi(user);
    expect(screen.getByRole('note')).toHaveTextContent(/未配置 API Key/);
    expect(screen.getByLabelText('DeepSeek API Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '测试连接' })).toBeDisabled();
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
    await goToAi(user);
    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('DeepSeek 服务暂不可用，请稍后重试');
    expect((await repository.loadCurrent()).record?.hpi.symptoms).toBe('');
  });

  it('states that image recognition always uses Flash even when Pro is the selected model', () => {
    render(
      <AiAssistantPanel
        record={SCHEMA.emptyRecord()}
        configured
        securityContext="web"
        model="deepseek-pro"
        createTransport={() => fakeTransportFactory(async () => ({ content: aiContent(), model: 'deepseek-flash' })).factory('sk-test')}
        onAdoptRecord={async () => true}
        onConfirmField={async () => true}
        onJumpToPath={vi.fn()}
      />,
    );

    expect(screen.getByText('图片识别固定使用 Flash（Pro 不支持图片）')).toBeInTheDocument();
  });

  it('displays the original ROS status with the same readable labels as Android', async () => {
    const transport = fakeTransportFactory(async () => ({
      content: {
        suggestions: [
          {
            path: 'ros.resp.cough.status',
            text: 'asked_negative',
            evidence: [{ source: 'note', quote: '患者诉咳嗽3天' }],
          },
        ],
        issues: [],
        questions: [],
      },
      model: 'deepseek-flash',
    }));
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    RECORD_CORE.setPath(record, 'ros.resp.cough.status', 'asked_positive');

    render(
      <AiAssistantPanel
        record={record}
        configured
        securityContext="web"
        model="deepseek-flash"
        createTransport={() => transport.factory('sk-test-status')}
        onAdoptRecord={async () => true}
        onConfirmField={async () => true}
        onJumpToPath={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('AI 操作'), 'recognize');
    await user.type(screen.getByLabelText(/粘贴病历文字/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    await screen.findByRole('heading', { name: '建议对照 · 尚未写入' });

    const compare = screen.getByText('原内容').closest('.ai-compare');
    expect(compare).not.toBeNull();
    expect(within(compare as HTMLElement).getByText('阳性')).toBeInTheDocument();
    expect(within(compare as HTMLElement).getByText('阴性')).toBeInTheDocument();
  });
});


describe('AI 中低优 UX', () => {
  const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  beforeEach(() => {
    if (!originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, writable: true, value: () => {} });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (!originalScroll) Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });
  function panelProps(record = SCHEMA.emptyRecord()) {
    return {
      record, configured: true, securityContext: 'web' as const, model: 'deepseek-flash',
      createTransport: () => ({ kind: 'web' as const,
        status: async () => ({ configured: true, model: 'deepseek-flash' }),
        request: async () => ({ content: { suggestions: [], issues: [], questions: [] }, model: 'deepseek-flash' }),
      }),
      onAdoptRecord: vi.fn(async () => true), onConfirmField: vi.fn(async () => true), onJumpToPath: vi.fn(),
    };
  }

  it('opens the unconfigured guide, supports collapse and focuses configuration from the empty state', async () => {
    const scroll = vi.fn();
    vi.stubGlobal('ResizeObserver', undefined);
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scroll);
    const user = userEvent.setup();
    render(<AiPage {...panelProps()} configured={false} apiKey="" onApiKeyChange={vi.fn()} onModelChange={vi.fn()} />);
    const summary = screen.getByText('如何获取 DeepSeek API Key · 配置与测试');
    const details = summary.closest('details');
    expect(details).toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'platform.deepseek.com' })).toHaveAttribute('href', 'https://platform.deepseek.com');
    expect(screen.getByText(/在左侧菜单点击 API keys/)).toBeInTheDocument();
    expect(screen.getByText(/复制以 sk- 开头/)).toBeInTheDocument();
    for (const code of ['401', '403', '402', '429', '网络', '超时']) expect(screen.getByText(code)).toBeVisible();
    expect(screen.getByText('API Key 无权限，请检查 AI 设置后重试')).toBeVisible();
    expect(screen.getByText('DeepSeek 余额不足，请充值后重试')).toBeVisible();
    await user.click(summary);
    expect(details).not.toHaveAttribute('open');
    await user.click(screen.getByRole('button', { name: '去配置 API' }));
    expect(details).toHaveAttribute('open');
    expect(screen.getByLabelText('DeepSeek API Key')).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
  });

  it('collapses settings by default when configured and retains the connection test explanation', async () => {
    const user = userEvent.setup();
    render(<AiPage {...panelProps()} apiKey="sk-local" onApiKeyChange={vi.fn()} onModelChange={vi.fn()} />);
    const summary = screen.getByText('如何获取 DeepSeek API Key · 配置与测试');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    await user.click(summary);
    expect(screen.getByRole('button', { name: '测试连接' })).toBeEnabled();
    expect(screen.getByText(/测试连接仅发送固定测试文字，不发送病历资料/)).toBeVisible();
  });

  it('jumps to adopted unreviewed content from step 1 and removes the reminder when reviewed', async () => {
    const scroll = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scroll);
    const user = userEvent.setup();
    const original = SCHEMA.emptyRecord();
    const request = prepareAiRequest('organize', original, '患者诉咳嗽3天');
    const content = aiContent();
    content.suggestions.push({ path: 'hpi.onset', text: '患者诉3天', evidence: [{ source: 'note', quote: '患者诉咳嗽3天' }] });
    const result = parseAiResult(content, request, 'deepseek-flash');
    const record = confirmAiField(adoptAiSuggestions(original, request, result, [0, 1], false), 'hpi.symptoms');
    const props = panelProps(record);
    const view = render(<AiAssistantPanel {...props} />);
    expect(screen.queryByRole('heading', { name: '已采纳的 AI 内容' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '1 项未核对' }));
    const list = screen.getByRole('list', { name: '已采纳待核对列表' });
    expect(list).toHaveAttribute('id', 'ai-adopted-unreviewed');
    expect(list).toHaveFocus();
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('起病情况');
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    const reviewed = confirmAiField(record, 'hpi.onset');
    view.rerender(<AiAssistantPanel {...props} record={reviewed} />);
    expect(screen.queryByRole('button', { name: '1 项未核对' })).not.toBeInTheDocument();
    const edited = RECORD_CORE.cloneValue(reviewed);
    edited.hpi.symptoms = '患者诉咳嗽4天';
    view.rerender(<AiAssistantPanel {...props} record={edited} />);
    expect(screen.getByRole('button', { name: '1 项未核对' })).toBeVisible();
  });

  it.each(['organize', 'polish'])('describes redactions in sent notes or fields (%s) without revealing originals', async (operation) => {
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    Object.assign(record.basic, { name: '张三', phone: '13812345678', recordNo: 'MR12345' });
    const raw = '张三，电话13812345678，病历号MR12345，证件110101199001010011，咳嗽3天';
    record.hpi.symptoms = raw;
    render(<AiAssistantPanel {...panelProps(record)} />);
    if (operation === 'polish') await user.selectOptions(screen.getByLabelText('AI 操作'), operation);
    else await user.type(screen.getByLabelText(/问诊笔记/), raw);
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    const diff = screen.getByRole('region', { name: '脱敏变化' });
    for (const label of ['姓名', '电话', '病历号', '身份证']) expect(within(diff).getByRole('listitem')).toHaveTextContent(label);
    expect(within(diff).getByRole('listitem')).toHaveTextContent('已隐去');
    const preview = screen.getByRole('region', { name: /实际发送内容/ });
    for (const privateText of ['张三', '13812345678', 'MR12345', '110101199001010011']) {
      expect(preview).not.toHaveTextContent(privateText);
    }
    expect(preview).toHaveTextContent('[已隐去]');
    expect(screen.getByRole('button', { name: '生成建议' })).toBeDisabled();
  });

  it('does not describe redactions in excluded unreviewed AI fields as if they were sent', async () => {
    const user = userEvent.setup();
    const record = SCHEMA.emptyRecord();
    record.hpi.symptoms = '姓名：张三，电话13912345678';
    RECORD_CORE.setFieldState(record, 'hpi.symptoms', { source: 'ai', reviewed: false });
    record.pmh.surgery = '3年前手术';
    render(<AiAssistantPanel {...panelProps(record)} />);
    await user.selectOptions(screen.getByLabelText('AI 操作'), 'check');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    expect(screen.getByRole('region', { name: '脱敏变化' })).toHaveTextContent('未检测到可自动隐去');
    const preview = screen.getByRole('region', { name: /实际发送内容/ });
    expect(preview).toHaveTextContent('3年前手术');
    expect(preview).not.toHaveTextContent('张三');
    expect(preview).not.toHaveTextContent('13912345678');
  });

  it('offers actionable circular-icon empty states for notes, no suggestions and no adoptions', async () => {
    const user = userEvent.setup();
    render(<AiAssistantPanel {...panelProps()} />);
    const start = screen.getByRole('button', { name: '粘贴笔记开始' });
    expect(start.closest('.ai-empty')?.querySelector('.ai-empty-icon svg')).not.toBeNull();
    await user.click(start);
    expect(screen.getByLabelText(/问诊笔记/)).toHaveFocus();
    await user.type(screen.getByLabelText(/问诊笔记/), '患者诉咳嗽3天');
    await user.click(screen.getByRole('button', { name: '预览发送内容' }));
    expect(screen.getByRole('region', { name: '脱敏变化' })).toHaveTextContent('未检测到可自动隐去');
    await user.click(screen.getByLabelText(/我已核对下方实际发送内容/));
    await user.click(screen.getByRole('button', { name: '生成建议' }));
    const supplement = await screen.findByRole('button', { name: '补充原文' });
    expect(supplement.closest('.ai-empty')?.querySelector('.ai-empty-icon svg')).not.toBeNull();
    await user.click(supplement);
    expect(screen.getByLabelText(/问诊笔记/)).toHaveFocus();
    await user.selectOptions(screen.getByLabelText('AI 操作'), 'check');
    const empty = screen.getByText('尚未采纳 AI 内容').closest('.ai-empty') as HTMLElement;
    expect(empty.querySelector('.ai-empty-icon svg')).not.toBeNull();
    await user.click(within(empty).getByRole('button', { name: '粘贴笔记开始' }));
    expect(screen.getByLabelText('AI 操作')).toHaveValue('organize');
    expect(screen.getByLabelText(/问诊笔记/)).toHaveFocus();
  });
});
