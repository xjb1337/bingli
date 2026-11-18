import type { AppSettings } from '@dabingli/domain';
import type { CorruptLegacyEntry, RecoveryCopySummary, StorageQuotaInfo } from '@dabingli/storage';
import { DataTransferPanel } from '../components/DataTransferPanel';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid } from '../components/StepShell';
import { getNativeAndroidBridge } from '../native-host';

export type ThemePreference = 'auto' | 'light' | 'dark';

export function SettingsPage({
  settings,
  theme = 'auto',
  onThemeChange,
  exportText,
  getExportText,
  recovery,
  corruptEntries,
  quotaInfo,
  includeNotes,
  onChange,
  onImport,
  onDownload,
  onIncludeNotesChange,
  onRestoreRecovery,
  onMergeLegacy,
  onExportCorruptLegacy,
}: {
  settings: AppSettings;
  theme?: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
  exportText?: string;
  getExportText?: (includeNotes: boolean) => string;
  recovery?: RecoveryCopySummary | null;
  corruptEntries?: readonly CorruptLegacyEntry[];
  quotaInfo?: StorageQuotaInfo | null;
  includeNotes: boolean;
  onChange: (settings: AppSettings) => void;
  onImport: (raw: string, mode: 'merge' | 'replace') => void;
  onDownload: (scope: 'current' | 'all', options?: { includeNotes?: boolean }) => void;
  onIncludeNotesChange: (value: boolean) => void;
  onRestoreRecovery?: () => void;
  onMergeLegacy?: () => void;
  onExportCorruptLegacy?: () => void;
}) {
  const androidBridge = getNativeAndroidBridge();
  const androidVersion = typeof androidBridge?.versionName === 'function' ? androidBridge.versionName() : '';

  return (
    <section className="workspace-page" aria-labelledby="settings-heading">
      <header className="page-header">
        <div>
          <div className="eyebrow">本机偏好</div>
          <h2 id="settings-heading">设置</h2>
          <p>设置保存在本机 IndexedDB，不会改变已有病历内容。</p>
        </div>
      </header>

      <Card title="显示与文书">
        <FormGrid>
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
          <FieldRenderer
            path="settings.rosMode"
            label="系统回顾输出模式"
            value={settings.rosMode}
            onChange={(_path, value) =>
              onChange({ ...settings, rosMode: value === 'brief' ? 'brief' : 'detail' })
            }
            kind="segmented"
            options={[
              { value: 'detail', label: '详细' },
              { value: 'brief', label: '简略' },
            ]}
            hint="详细：逐项展开已询问阴阳性；简略：合并为概括句。"
          />
          {onThemeChange ? (
            <FieldRenderer
              path="settings.theme"
              label="颜色主题"
              value={theme}
              onChange={(_path, value) =>
                onThemeChange(value === 'dark' || value === 'light' ? value : 'auto')
              }
              kind="segmented"
              options={[
                { value: 'auto', label: '跟随系统' },
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
              ]}
            />
          ) : null}
        </FormGrid>
      </Card>

      <Card title="数据导入 / 导出">
        {quotaInfo?.supported ? (
          <p className="muted">
            本机存储已用 {Math.round(quotaInfo.usage / 1024)} KB / 约 {Math.round(quotaInfo.quota / (1024 * 1024))} MB
            （{Math.round(quotaInfo.ratio * 100)}%）
          </p>
        ) : null}
        <DataTransferPanel
          exportText={exportText}
          getExportText={getExportText}
          recovery={recovery}
          corruptEntries={corruptEntries}
          includeNotes={includeNotes}
          onIncludeNotesChange={onIncludeNotesChange}
          onImport={onImport}
          onDownload={onDownload}
          onRestoreRecovery={onRestoreRecovery}
          onMergeLegacy={onMergeLegacy}
          onExportCorruptLegacy={onExportCorruptLegacy}
        />
      </Card>

      {androidBridge ? (
        <Card title="Android 应用">
          <div className="button-row">
            {androidVersion ? <span className="muted">当前版本：{androidVersion}</span> : null}
            {typeof androidBridge.checkUpdates === 'function' ? (
              <button type="button" className="button secondary" onClick={() => androidBridge.checkUpdates?.()}>
                检查更新
              </button>
            ) : null}
            {typeof androidBridge.exportLegacyRaw === 'function' ? (
              <button type="button" className="button ghost" onClick={() => androidBridge.exportLegacyRaw?.()}>
                导出旧版迁移原始数据
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
