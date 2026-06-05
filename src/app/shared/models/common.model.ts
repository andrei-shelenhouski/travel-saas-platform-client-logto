/**
 * Shared/common types used across multiple domains.
 */

/** Generic paginated response. All list endpoints return { items, total, page, limit }. */
export type PaginatedDto<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

// ----- Entity type (Activities, Comments, Tags) -----

export const EntityType = {
  Lead: 'Lead',
  Client: 'Client',
  Request: 'Request',
  Offer: 'Offer',
  Booking: 'Booking',
  Invoice: 'Invoice',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const MEAL_PLAN_OPTIONS = ['ALL_INCLUSIVE', 'BB', 'HB', 'FB', 'RO', 'OTHER'] as const;
export type MealPlan = (typeof MEAL_PLAN_OPTIONS)[number];

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  TRANSFER: 'Трансфер',
  EXCURSION: 'Экскурсия',
  VISA: 'Виза',
  INSURANCE: 'Страховка',
  FLIGHT: 'Перелет',
  OTHER: 'Другое',
};

export const SERVICE_TYPE_OPTIONS = Object.keys(SERVICE_TYPE_LABELS);

export function serviceTypeLabel(type: string | null | undefined): string {
  if (!type) {
    return '—';
  }

  return SERVICE_TYPE_LABELS[type] ?? type;
}

/** App-level role for RBAC (display). Maps from API OrgRole. */
export const AppRole = {
  Admin: 'Admin',
  Manager: 'Manager',
  Agent: 'Agent',
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];
