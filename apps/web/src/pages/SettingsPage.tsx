import type { AppSettings } from '@dabingli/domain';
import type { RecoveryCopySummary } from '@dabingli/storage';
import { DataTransferPanel } from '../components/DataTransferPanel';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid } from '../components/StepShell';

export function SettingsPage({
  settings,
  exportText,
  recovery,
  onChange,
  onImport,
  onDownload,
  onRestoreRecovery,
}: {
  settings: AppSettings;
  exportText: string;
  recovery?: RecoveryCopySummary | null;
  onChange: (settings: AppSettings) => void;
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
          <p>设置保存在本机 IndexedDB，不会改变已有病历内容。</p>
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
