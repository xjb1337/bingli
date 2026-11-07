import { useEffect, useRef, useState } from 'react';
import { aiError, errorMessage } from '@dabingli/ai';
import { AiAssistantPanel, type AiAssistantPanelProps } from '../components/AiAssistantPanel';
import { Card } from '../components/StepShell';

interface AiPageProps extends AiAssistantPanelProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onOpenAndroidAiSettings?: () => void;
  onRefreshAndroidStatus?: () => void;
}

export function AiPage(props: AiPageProps) {
  const {
    apiKey, configured, securityContext, model, loadingAndroidStatus,
    onApiKeyChange, onModelChange, onOpenAndroidAiSettings, onRefreshAndroidStatus,
  } = props;
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTestMessage('');
    setTesting(false);
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [apiKey, model]);

  async function testConnection() {
    if (testing || !configured) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setTesting(true);
    setTestMessage('正在测试连接…');
    try {
      const response = await props.createTransport().request({
        system: '这是 API 连接测试。只返回 JSON 对象 {"ok":true}。',
        user: '{"connection_test":true}',
      }, { signal: controller.signal });
      if (!response.content || typeof response.content !== 'object'
        || !('ok' in response.content) || response.content.ok !== true) {
        throw aiError('invalid_response', '测试返回不符合约定，请重试');
      }
      if (!controller.signal.aborted) setTestMessage(`连接成功，响应模型：${response.model}`);
    } catch (reason) {
      if (!controller.signal.aborted) setTestMessage(errorMessage(reason));
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setTesting(false);
      }
    }
  }

  return (
    <section className="workspace-page" aria-labelledby="ai-heading">
      <header className="page-header">
        <div>
          <div className="eyebrow">当前病历 · 填写辅助</div>
          <h2 id="ai-heading">AI 助手</h2>
          <p>先配置 API，再预览资料、生成建议并逐项核对采纳。</p>
        </div>
      </header>
      <Card title="API 设置">
        <div className="ai-settings">
          {securityContext === 'android' ? (
            <>
              <p>密钥只保存在 Android Keystore 中，网页只能读取配置状态和模型名。</p>
              <div className="button-row">
                <button type="button" className="button secondary" disabled={!onOpenAndroidAiSettings} onClick={onOpenAndroidAiSettings}>
                  打开 Android AI 设置 / 测试连接
                </button>
                <button type="button" className="button ghost" disabled={loadingAndroidStatus} onClick={onRefreshAndroidStatus}>
                  刷新状态
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="ai-field" htmlFor="deepseek-api-key">
                <span>DeepSeek API Key</span>
                <input
                  id="deepseek-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(event) => onApiKeyChange(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="deepseek-api-key-hint"
                  placeholder="sk-..."
                />
              </label>
              <p id="deepseek-api-key-hint" className="field-hint">
                仅保存在本页内存，刷新后需重新输入。不会写入浏览器存储、病历、导出文件或日志；请求直接发送到 https://api.deepseek.com。
              </p>
              <label className="ai-field">
                <span>文本模型</span>
                <select value={model} onChange={(event) => onModelChange(event.target.value)}>
                  <option value="deepseek-flash">deepseek-flash</option>
                  <option value="deepseek-v4-pro">deepseek-v4-pro</option>
                </select>
              </label>
              <p className="field-hint">测试连接仅发送固定测试文字，不发送病历资料；会产生少量 API 用量。</p>
              <div className="button-row">
                <button type="button" className="button secondary" disabled={!configured || testing} onClick={() => void testConnection()}>
                  {testing ? '正在测试连接…' : '测试连接'}
                </button>
                <button type="button" className="button ghost" disabled={!apiKey} onClick={() => onApiKeyChange('')}>
                  清除内存中的密钥
                </button>
              </div>
            </>
          )}
          <div className="ai-model-row" role="status">
            <span>状态：<strong>{loadingAndroidStatus ? '读取中' : configured ? '已配置' : '未配置'}</strong></span>
            <span>模型：<code>{model}</code></span>
          </div>
          {testMessage ? <p className="ai-status" role="status">{testMessage}</p> : null}
        </div>
      </Card>
      <AiAssistantPanel {...props} />
    </section>
  );
}
