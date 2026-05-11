export const INVOICE_CURRENCIES = ['BYN', 'USD', 'EUR'] as const;

const INVOICE_LANGUAGES = ['RU', 'EN'] as const;

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToIsoDate(isoDate: string, daysToAdd: number): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  date.setUTCDate(date.getUTCDate() + daysToAdd);

  return date.toISOString().slice(0, 10);
}

export function normalizePaymentTermsDays(days: number | null | undefined): number {
  if (typeof days !== 'number' || !Number.isFinite(days)) {
    return 1;
  }

  return Math.min(365, Math.max(1, Math.trunc(days)));
}

export function normalizeInvoiceCurrency(currency: string | null | undefined): string {
  const value = currency?.trim().toUpperCase();

  if (!value || !INVOICE_CURRENCIES.includes(value as (typeof INVOICE_CURRENCIES)[number])) {
    return 'EUR';
  }

  return value;
}

export function normalizeInvoiceLanguage(language: string | null | undefined): string {
  const value = language?.trim().toUpperCase();

  if (!value || !INVOICE_LANGUAGES.includes(value as (typeof INVOICE_LANGUAGES)[number])) {
    return 'EN';
  }

  return value;
}
