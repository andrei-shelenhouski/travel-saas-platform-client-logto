import { ClientType } from '@app/shared/models';

export function clientTypeLabel(type: string | undefined): string {
  if (type === ClientType.INDIVIDUAL) {
    return 'Физ. лицо';
  }

  if (type === ClientType.COMPANY) {
    return 'Компания';
  }

  if (type === ClientType.B2B_AGENT) {
    return 'B2B агент';
  }

  if (type === ClientType.AGENT) {
    return 'Агент';
  }

  return '—';
}

export function boolLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return value ? 'Да' : 'Нет';
}

export function textOrDash(value: string | null | undefined): string {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    return normalizedValue;
  }

  return '—';
}