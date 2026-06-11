import type { OrganizationCurrency } from '@app/shared/models/organization.model';

export const CURRENCY_OPTIONS = [
  'BYN',
  'USD',
  'EUR',
  'GEL',
  'RUB',
  'CZK',
  'PLN',
] as const satisfies readonly OrganizationCurrency[];

export const CURRENCY_LABELS: Record<OrganizationCurrency, string> = {
  BYN: 'BYN (Белорусский рубль)',
  USD: 'USD (Доллар США)',
  EUR: 'EUR (Евро)',
  GEL: 'GEL (Грузинский лари)',
  RUB: 'RUB (Российский рубль)',
  CZK: 'CZK (Чешская крона)',
  PLN: 'PLN (Польский злотый)',
};
