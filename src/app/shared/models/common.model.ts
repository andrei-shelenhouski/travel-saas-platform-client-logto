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

/** App-level role for RBAC (display). Maps from API OrgRole. */
export const AppRole = {
  Admin: 'Admin',
  Manager: 'Manager',
  Agent: 'Agent',
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];
