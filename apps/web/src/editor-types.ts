import type { AppSettings, DabingliRecord, DocumentWarning } from '@dabingli/domain';
import type { ConfirmDialogOptions } from './components/ConfirmModal';

export type UpdateField = (path: string, value: unknown, options?: { snapshotLabel?: string }) => void;

export type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

export interface StepComponentProps {
  record: DabingliRecord;
  update: UpdateField;
  replaceRecord: (record: DabingliRecord, options?: { snapshotLabel?: string }) => void;
  errors: Readonly<Record<string, string>>;
  onJump: (path: string) => void;
  notify: (message: string, tone?: 'info' | 'success' | 'error') => void;
  warnings?: readonly DocumentWarning[];
  settings?: AppSettings;
  pushUndoSnapshot?: (label: string) => void;
  onUndo?: () => Promise<boolean>;
  canUndo?: boolean;
  undoLabel?: string;
  confirmAction?: ConfirmFn;
}
