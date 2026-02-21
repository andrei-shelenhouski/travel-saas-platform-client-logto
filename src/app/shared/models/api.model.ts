/**
 * API types aligned with OpenAPI spec (GET /api/docs/json).
 * Backend: Travel SaaS API.
 */

// ----- Enums (from API schema enums) -----

export const LeadSource = {
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  AGENT: 'AGENT',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  LOST: 'LOST',
  CONVERTED: 'CONVERTED',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const ClientType = {
  INDIVIDUAL: 'INDIVIDUAL',
  AGENT: 'AGENT',
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

// ----- /api/me (GET) – response not in OpenAPI; common shape -----

export interface Organization {
  id: string;
  name: string;
}

export interface MeResponse {
  user: { id: string; email?: string; name?: string };
  organizations: Organization[];
}

// ----- Organizations -----

export interface CreateOrganizationDto {
  name: string;
  defaultCurrency?: string;
}

/** Response shape for POST /api/organizations (not in OpenAPI). */
export interface CreateOrganizationResponseDto {
  id: string;
  organizationId?: string; // some backends return this
  name?: string;
}

// ----- Leads -----

export interface CreateLeadDto {
  source: LeadSource;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface LeadResponseDto {
  id: string;
  organizationId: string;
  source: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  status: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface UpdateLeadStatusDto {
  status: LeadStatus;
}

// ----- Offers -----

export interface CreateOfferDto {
  requestId: string; // uuid
  title: string;
  supplierTotal: number;
  markup: number;
  commission: number;
  finalPrice: number;
  currency: string;
}

// ----- Bookings -----

export interface CreateBookingDto {
  offerId: string; // uuid
}

// ----- Invoices -----

export interface CreateInvoiceDto {
  bookingId: string;
  dueDate?: string;
}

// ----- Clients -----

export interface CreateClientDto {
  type: ClientType;
  name: string;
  phone?: string;
  email?: string;
}

// ----- Requests -----

export interface CreateRequestDto {
  clientId: string; // uuid
  managerId: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children?: number;
  comment?: string;
}
