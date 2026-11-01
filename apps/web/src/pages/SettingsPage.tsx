import type { AppSettings } from '@dabingli/domain';
import type { RecoveryCopySummary } from '@dabingli/storage';
import { DataTransferPanel } from '../components/DataTransferPanel';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid } from '../components/StepShell';

export function SettingsPage({
  settings,
  exportText,
  recovery,
  apiKey,
  androidConfigured,
  androidModel,
  androidStatusLoading,
  onChange,
  onApiKeyChange,
  onOpenAndroidAiSettings,
  onRefreshAndroidStatus,
  onImport,
  onDownload,
  onRestoreRecovery,
}: {
  settings: AppSettings;
  exportText: string;
  recovery?: RecoveryCopySummary | null;
  apiKey: string;
  androidConfigured?: boolean;
  androidModel?: string;
  androidStatusLoading?: boolean;
  onChange: (settings: AppSettings) => void;
  onApiKeyChange: (value: string) => void;
  onOpenAndroidAiSettings?: () => void;
  onRefreshAndroidStatus?: () => void;
  onImport: (raw: string, mode: 'merge' | 'replace') => void;
  onDownload: (scope: 'current' | 'all') => void;
  onRestoreRecovery?: () => void;
}) {
  return (
    <section className="workspace-page" aria-labelledby="settings-heading">
      <header className="page-header">
        <div>
          <div className="eyebrow">本机偏好</div>
          <h2 id="settings-heading">设置</h2>
          <p>除 AI 密钥外，设置保存在本机 IndexedDB，不会改变已有病历内容；AI 密钥只在本页内存。</p>
        </div>
      </header>

      <Card title="显示与系统回顾">
        <FormGrid>
          <FieldRenderer
            path="settings.rosMode"
            label="系统回顾输出方式"
            value={settings.rosMode}
            onChange={(_path, value) =>
              onChange({ ...settings, rosMode: value === 'brief' ? 'brief' : 'detail' })
            }
            kind="segmented"
            options={[
              { value: 'detail', label: '详细' },
              { value: 'brief', label: '简要' },
            ]}
            hint="仅影响生成的大病历文本，不改变已记录的系统回顾数据。"
          />
          <FieldRenderer
            path="settings.fontScale"
            label="字号缩放"
            value={String(settings.fontScale)}
            onChange={(_path, value) =>
              onChange({ ...settings, fontScale: Number(value) })
            }
            kind="segmented"
            options={[
              { value: '0.9', label: '小' },
              { value: '1', label: '标准' },
              { value: '1.15', label: '大' },
              { value: '1.3', label: '特大' },
            ]}
          />
        </FormGrid>
      </Card>

      <Card title="DeepSeek AI">
        {onOpenAndroidAiSettings ? (
          <div className="ai-settings">
            <p>
              Android 版密钥只保存在系统 Keystore 中，网页脚本只能读取
              {androidStatusLoading ? '配置状态…' : androidConfigured ? '「已配置」及模型名' : '「未配置」'}，永远不会收到密钥本身。
            </p>
            <div className="ai-model-row">
              <span>状态：<strong>{androidStatusLoading ? '读取中' : androidConfigured ? '已配置' : '未配置'}</strong></span>
              <span>模型：<code>{androidModel || 'deepseek-flash'}</code></span>
            </div>
            <div className="button-row">
              <button type="button" className="button secondary" onClick={onOpenAndroidAiSettings}>
                打开 Android AI 设置
              </button>
              {onRefreshAndroidStatus ? (
                <button type="button" className="button ghost" onClick={onRefreshAndroidStatus}>
                  刷新状态
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="ai-settings">
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
              仅保存在本页内存，刷新后需重新输入。不会写入 localStorage、IndexedDB、Cookie、病历 JSON、导出文件或日志；AI 请求会直接发送到 https://api.deepseek.com。
            </p>
            <div className="ai-model-row">
              <span>模型：<code>deepseek-flash</code></span>
              <span>状态：<strong>{apiKey.trim() ? '本次页面已配置' : '未配置'}</strong></span>
            </div>
            <div className="button-row">
              <button type="button" className="button ghost" disabled={!apiKey} onClick={() => onApiKeyChange('')}>
                清除内存中的密钥
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card title="数据导入 / 导出">
        <DataTransferPanel
          exportText={exportText}
          recovery={recovery}
          onImport={onImport}
          onDownload={onDownload}
          onRestoreRecovery={onRestoreRecovery}
        />
      </Card>
    </section>
  );
}
