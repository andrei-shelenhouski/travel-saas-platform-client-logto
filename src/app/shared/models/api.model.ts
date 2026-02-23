/**
 * API types aligned with OpenAPI spec.
 * Source of truth: project root openapi.json (from http://localhost:3000/api/docs/json).
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

/** Generic paginated response. OpenAPI list endpoints return { data, total, page, limit }. */
export interface PaginatedDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

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
  source: LeadSource | string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  status: LeadStatus | string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

/** OpenAPI: GET /api/leads response. */
export type PaginatedLeadResponseDto = PaginatedDto<LeadResponseDto>;

/** OpenAPI schema: UpdateLeadDto. PATCH /api/leads/{id} request body. */
export interface UpdateLeadDto {
  source?: LeadSource;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface UpdateLeadStatusDto {
  status: LeadStatus;
}

// ----- Offers (OpenAPI: paths + CreateOfferDto, UpdateOfferDto, UpdateOfferStatusDto) -----

/** OpenAPI schema: CreateOfferDto. POST /api/offers (create or duplicate when duplicateFromId set). */
export interface CreateOfferDto {
  duplicateFromId?: string; // uuid
  requestId?: string; // uuid
  title?: string;
  supplierTotal?: number;
  markup?: number;
  commission?: number;
  finalPrice?: number;
  currency?: string;
}

/** OpenAPI schema: UpdateOfferDto. PATCH /api/offers/{id} request body. */
export interface UpdateOfferDto {
  title?: string;
  supplierTotal?: number;
  markup?: number;
  commission?: number;
  finalPrice?: number;
  currency?: string;
}

/** OpenAPI schema: UpdateOfferStatusDto. PATCH /api/offers/{id}/status request body. */
export interface UpdateOfferStatusDto {
  status: 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}

export const OfferStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

/** OpenAPI: OfferResponseDto.source enum. */
export const OfferSource = {
  MANUAL: 'MANUAL',
  OSTROVOK: 'OSTROVOK',
} as const;
export type OfferSource = (typeof OfferSource)[keyof typeof OfferSource];

/** OpenAPI schema: OfferResponseDto. GET /api/offers, GET /api/offers/{id}. Amounts as string. */
export interface OfferResponseDto {
  id: string;
  organizationId: string;
  requestId: string;
  title: string;
  source: OfferSource | string;
  status: OfferStatus | string;
  supplierTotal: string;
  markup: string;
  commission: string;
  finalPrice: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** OpenAPI: GET /api/offers response. */
export type PaginatedOfferResponseDto = PaginatedDto<OfferResponseDto>;

// ----- Bookings (OpenAPI: CreateBookingDto) -----

/** OpenAPI schema: CreateBookingDto. POST /api/bookings request body. */
export interface CreateBookingDto {
  offerId: string; // uuid
}

// ----- Invoices -----

export interface CreateInvoiceDto {
  bookingId: string;
  dueDate?: string;
}

// ----- Clients (OpenAPI: GET/POST /api/clients, GET/PATCH/DELETE /api/clients/{id}) -----

export interface CreateClientDto {
  type: ClientType;
  name: string;
  phone?: string;
  email?: string;
}

/** OpenAPI schema: ClientResponseDto. */
export interface ClientResponseDto {
  id: string;
  organizationId: string;
  type: ClientType | string;
  name: string;
  phone: string | null;
  email: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

/** OpenAPI: GET /api/clients response. */
export type PaginatedClientResponseDto = PaginatedDto<ClientResponseDto>;

/** OpenAPI schema: UpdateClientDto. PATCH /api/clients/{id} request body. */
export interface UpdateClientDto {
  type?: ClientType;
  name?: string;
  phone?: string;
  email?: string;
  comment?: string;
}

// ----- Requests (OpenAPI: GET/POST /api/requests, GET/PATCH/DELETE /api/requests/{id}, PATCH status) -----

/** OpenAPI: RequestResponseDto.status and UpdateRequestStatusDto.status enum. */
export const RequestStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  OFFERED: 'OFFERED',
  CLOSED: 'CLOSED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export interface CreateRequestDto {
  clientId: string; // uuid
  managerId: string; // uuid
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children?: number;
  comment?: string;
}

/** OpenAPI schema: RequestResponseDto. */
export interface RequestResponseDto {
  id: string;
  organizationId: string;
  clientId: string;
  managerId: string;
  destination: string;
  startDate: string; // date-time
  endDate: string; // date-time
  adults: number;
  children: number;
  comment: string | null;
  status: RequestStatus | string;
  createdAt: string;
  updatedAt: string;
}

/** OpenAPI: GET /api/requests response. */
export type PaginatedRequestResponseDto = PaginatedDto<RequestResponseDto>;

/** OpenAPI schema: UpdateRequestDto. PATCH /api/requests/{id} request body. */
export interface UpdateRequestDto {
  clientId?: string;
  managerId?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
  comment?: string;
}

/** OpenAPI schema: UpdateRequestStatusDto. PATCH /api/requests/{id}/status request body. */
export interface UpdateRequestStatusDto {
  status: RequestStatus;
}
