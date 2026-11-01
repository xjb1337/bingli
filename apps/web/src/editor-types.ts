import type { DabingliRecord } from '@dabingli/domain';

export type UpdateField = (path: string, value: unknown) => void;

export interface StepComponentProps {
  record: DabingliRecord;
  update: UpdateField;
  replaceRecord: (record: DabingliRecord) => void;
  errors: Readonly<Record<string, string>>;
  onJump: (path: string) => void;
  notify: (message: string, tone?: 'info' | 'success' | 'error') => void;
}
