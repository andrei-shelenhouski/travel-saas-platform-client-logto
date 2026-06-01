/**
 * Parses a date string in `YYYY-MM-DD` format into a `Date` object.
 * Returns `null` for empty, malformed, or invalid date strings.
 */
export function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Formats a `Date` object to a `YYYY-MM-DD` string.
 * Returns an empty string for `null` input.
 */
export function formatDate(value: Date | null): string {
  if (!value) {
    return '';
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Compares two filter objects that share `departDateFrom` and `departDateTo` string fields
 * and a `status` array. Returns `true` when the two filters are equal (no change).
 */
export function compareDateRangeFilters<
  T extends { departDateFrom: string; departDateTo: string; status: unknown[] },
>(a: T, b: T): boolean {
  if (a.departDateFrom !== b.departDateFrom || a.departDateTo !== b.departDateTo) {
    return false;
  }

  if (a.status.length !== b.status.length) {
    return false;
  }

  return a.status.every((s, i) => s === b.status[i]);
}
