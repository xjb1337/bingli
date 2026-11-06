import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RECORD_CORE, SCHEMA, type DabingliRecord } from '@dabingli/domain';
import { MarriageStep } from '../pages/MarriageStep';

function femaleRecord(age: string, applicable = ''): DabingliRecord {
  const record = RECORD_CORE.cloneValue(SCHEMA.emptyRecord()) as DabingliRecord;
  record.basic.gender = '女';
  record.basic.age = age;
  record.menstruation.applicable = applicable;
  return record;
}

function maleRecord(): DabingliRecord {
  const record = RECORD_CORE.cloneValue(SCHEMA.emptyRecord()) as DabingliRecord;
  record.basic.gender = '男';
  return record;
}

function renderStep(record: DabingliRecord, update = vi.fn()) {
  render(
    <MarriageStep
      record={record}
      update={update}
      replaceRecord={vi.fn()}
      errors={{}}
      onJump={vi.fn()}
      notify={vi.fn()}
    />,
  );
  return update;
}

describe('menstruation applicable options', () => {
  it('offers 未初潮 and hints it for a child before menarche', async () => {
    const user = userEvent.setup();
    const update = renderStep(femaleRecord('7岁'));

    const option = screen.getByRole('radio', { name: '未初潮' });
    expect(option).toBeInTheDocument();
    expect(screen.getByText('儿童可选『未初潮』')).toBeInTheDocument();

    await user.click(option);
    expect(update).toHaveBeenCalledWith('menstruation.applicable', '未初潮');
  });

  it('does not show the child hint when the field is already answered', () => {
    renderStep(femaleRecord('7岁', '未初潮'));

    expect(screen.queryByText('儿童可选『未初潮』')).not.toBeInTheDocument();
  });

  it('does not show the child hint for an adult', () => {
    renderStep(femaleRecord('28岁'));

    expect(screen.queryByText('儿童可选『未初潮』')).not.toBeInTheDocument();
  });
});

describe('male childbirth fields', () => {
  it('shows a legacy gravida value as the child count and writes the new children field', () => {
    const record = maleRecord();
    record.childbirth.gravida = '2';
    const update = renderStep(record);

    const input = screen.getByLabelText('子女数');
    expect(input).toHaveValue(2);

    fireEvent.change(input, { target: { value: '3' } });
    expect(update).toHaveBeenCalledWith('childbirth.children', '3');
  });

  it('prefers the dedicated children value over the legacy gravida value', () => {
    const record = maleRecord();
    record.childbirth.children = '1';
    record.childbirth.gravida = '2';
    renderStep(record);

    expect(screen.getByLabelText('子女数')).toHaveValue(1);
  });
});
