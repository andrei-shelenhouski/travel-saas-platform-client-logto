/**
 * API types aligned with OpenAPI spec.
 * Source of truth: project root openapi.json.
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
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
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
export type PaginatedDto<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

// ----- /api/me (GET) – OpenAPI: MeResponseDto -----

/** Role in organization (API enum). GET /api/me returns this per organization. */
export const OrgRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  AGENT: 'AGENT',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

/** OpenAPI: OrganizationWithRoleDto. Organization with current user's role. */
export type OrganizationWithRoleDto = {
  id: string;
  name: string;
  defaultCurrency: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  createdAt: string;
  updatedAt: string;
  role: OrgRole;
};

/** OpenAPI: MeResponseDto. GET /api/me response. */
export type MeResponseDto = {
  id: string;
  firebaseUid: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
  organizations: OrganizationWithRoleDto[];
};

/** Legacy alias for components that only need id + name. */
export type Organization = Pick<OrganizationWithRoleDto, 'id' | 'name'>;

/** App-level role for RBAC (display). Maps from API OrgRole. */
export const AppRole = {
  Admin: 'Admin',
  Manager: 'Manager',
  Agent: 'Agent',
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

// ----- Organization members (GET /api/organization-members, PATCH .../role) -----

/** OpenAPI: OrganizationMemberResponseDto. Member of the current organization. */
export type OrganizationMemberResponseDto = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** OpenAPI: UpdateOrganizationMemberRoleDto. PATCH /api/organization-members/{id}/role body. */
export type UpdateOrganizationMemberRoleDto = {
  role: OrgRole;
};

/** OpenAPI: AddOrganizationMemberDto. POST /api/organization-members body. User must already exist. */
export type AddOrganizationMemberDto = {
  email: string;
  role: OrgRole;
};

// ----- Organizations -----

export type CreateOrganizationDto = {
  name: string;
  defaultCurrency?: string;
};

// ----- Leads -----

export type CreateLeadDto = {
  source: LeadSource;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export type LeadResponseDto = {
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
};

/** OpenAPI: GET /api/leads response. */
export type PaginatedLeadResponseDto = PaginatedDto<LeadResponseDto>;

/** OpenAPI schema: UpdateLeadDto. PATCH /api/leads/{id} request body. */
export type UpdateLeadDto = {
  source?: LeadSource;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export type UpdateLeadStatusDto = {
  status: LeadStatus;
};

/** Response for POST /api/leads/{id}/convert-to-client. */
export type ConvertLeadToClientResponseDto = {
  client: ClientResponseDto;
  lead: LeadResponseDto;
};

// ----- Offers (OpenAPI: paths + CreateOfferDto, UpdateOfferDto, UpdateOfferStatusDto) -----

/** OpenAPI schema: CreateOfferDto. POST /api/offers (create or duplicate when duplicateFromId set). */
export type CreateOfferDto = {
  duplicateFromId?: string; // uuid
  requestId?: string; // uuid
  title?: string;
  supplierTotal?: number;
  markup?: number;
  commission?: number;
  finalPrice?: number;
  currency?: string;
};

/** OpenAPI schema: UpdateOfferDto. PATCH /api/offers/{id} request body. */
export type UpdateOfferDto = {
  title?: string;
  supplierTotal?: number;
  markup?: number;
  commission?: number;
  finalPrice?: number;
  currency?: string;
};

/** OpenAPI schema: UpdateOfferStatusDto. PATCH /api/offers/{id}/status request body. */
export type UpdateOfferStatusDto = {
  status: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
};

export const OfferStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
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
export type OfferResponseDto = {
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
};

/** OpenAPI: GET /api/offers response. */
export type PaginatedOfferResponseDto = PaginatedDto<OfferResponseDto>;

// ----- Bookings (OpenAPI: CreateBookingDto, BookingResponseDto, UpdateBookingDto) -----

/** OpenAPI schema: CreateBookingDto. POST /api/bookings request body. */
export type CreateBookingDto = {
  offerId: string; // uuid
};

/** OpenAPI: filter + UpdateBookingStatusDto use PENDING, CONFIRMED, PAID, CANCELLED; response may use CONFIRMED, CANCELLED. */
export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** OpenAPI schema: BookingResponseDto.status (list/filter still use full BookingStatus). */
export type BookingRecordStatus = 'CONFIRMED' | 'CANCELLED';

/** OpenAPI schema: BookingResponseDto. GET/POST/PATCH/DELETE /api/bookings. agreedPrice decimal as string. */
export type BookingResponseDto = {
  id: string;
  organizationId: string;
  offerId: string;
  clientId: string;
  agreedPrice: string;
  currency: string;
  status: BookingRecordStatus | string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
};

/** OpenAPI: GET /api/bookings response. */
export type PaginatedBookingResponseDto = PaginatedDto<BookingResponseDto>;

/** OpenAPI schema: UpdateBookingDto. PATCH /api/bookings/{id} request body. */
export type UpdateBookingDto = {
  status?: BookingStatus;
};

/** OpenAPI schema: UpdateBookingStatusDto. PATCH /api/bookings/{id}/status request body. */
export type UpdateBookingStatusDto = {
  status: BookingStatus;
};

// ----- Invoices (OpenAPI: CreateInvoiceDto, InvoiceResponseDto, UpdateInvoiceDto) -----

export type CreateInvoiceDto = {
  bookingId: string; // uuid
  dueDate?: string;
};

/** OpenAPI: InvoiceResponseDto.status and UpdateInvoiceDto.status enum. */
export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

/** OpenAPI schema: InvoiceResponseDto. Amount and dates as string; dueDate/pdfUrl nullable. */
export type InvoiceResponseDto = {
  id: string;
  organizationId: string;
  bookingId: string;
  number: string;
  issueDate: string; // date-time
  dueDate: string | null;
  amount: string; // decimal as string
  currency: string;
  status: InvoiceStatus | string;
  pdfUrl: string | null;
  createdAt: string; // date-time
};

/** OpenAPI: GET /api/invoices response. */
export type PaginatedInvoiceResponseDto = PaginatedDto<InvoiceResponseDto>;

/** OpenAPI schema: UpdateInvoiceDto. PATCH /api/invoices/{id} request body. */
export type UpdateInvoiceDto = {
  status?: InvoiceStatus;
  dueDate?: string; // date-time
  pdfUrl?: string;
};

// ----- Clients (OpenAPI: GET/POST /api/clients, GET/PATCH/DELETE /api/clients/{id}) -----

export type CreateClientDto = {
  type: ClientType;
  name: string;
  phone?: string;
  email?: string;
};

/** OpenAPI schema: ClientResponseDto. */
export type ClientResponseDto = {
  id: string;
  organizationId: string;
  type: ClientType | string;
  name: string;
  phone: string | null;
  email: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

/** OpenAPI: GET /api/clients response. */
export type PaginatedClientResponseDto = PaginatedDto<ClientResponseDto>;

/** OpenAPI schema: UpdateClientDto. PATCH /api/clients/{id} request body. */
export type UpdateClientDto = {
  type?: ClientType;
  name?: string;
  phone?: string;
  email?: string;
  comment?: string;
};

// ----- Requests (OpenAPI: GET/POST /api/requests, GET/PATCH/DELETE /api/requests/{id}, PATCH status) -----

/** OpenAPI: GET /api/requests query + UpdateRequestStatusDto body. */
export const RequestStatus = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CLIENT: 'WAITING_CLIENT',
  CLOSED: 'CLOSED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

/** OpenAPI: RequestResponseDto.status on GET/PATCH responses. */
export const RequestResponseStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  OFFERED: 'OFFERED',
  CLOSED: 'CLOSED',
} as const;
export type RequestResponseStatus =
  (typeof RequestResponseStatus)[keyof typeof RequestResponseStatus];

export type CreateRequestDto = {
  clientId: string; // uuid
  managerId: string; // uuid
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children?: number;
  comment?: string;
};

/** OpenAPI schema: RequestResponseDto. */
export type RequestResponseDto = {
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
  status: RequestResponseStatus | string;
  createdAt: string;
  updatedAt: string;
};

/** OpenAPI: GET /api/requests response. */
export type PaginatedRequestResponseDto = PaginatedDto<RequestResponseDto>;

/** OpenAPI schema: UpdateRequestDto. PATCH /api/requests/{id} request body. */
export type UpdateRequestDto = {
  clientId?: string;
  managerId?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
  comment?: string;
};

/** OpenAPI schema: UpdateRequestStatusDto. PATCH /api/requests/{id}/status request body. */
export type UpdateRequestStatusDto = {
  status: RequestStatus;
};

// ----- Entity type (Activities, Comments, Tags) -----

export const EntityType = {
  Lead: 'Lead',
  Client: 'Client',
  Request: 'Request',
  Offer: 'Offer',
  Booking: 'Booking',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

// ----- Activities (POST/GET /api/activities, GET /api/activities/{id}) -----

export type CreateActivityDto = {
  entityType: EntityType;
  entityId: string;
  type: string;
  payload?: Record<string, unknown>;
};

export type ActivityResponseDto = {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
};

/** Response for GET /api/activities (findByEntity): items + pagination. */
export type ActivityListResponseDto = {
  items: ActivityResponseDto[];
  total: number;
  page: number;
  limit: number;
};

// ----- Comments (POST/GET /api/comments, GET/DELETE /api/comments/{id}) -----

export type CreateCommentDto = {
  commentableType: EntityType;
  commentableId: string;
  body: string;
};

export type CommentResponseDto = {
  id: string;
  organizationId: string;
  commentableType: string;
  commentableId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

/** Response for GET /api/comments (findByEntity). */
export type CommentListResponseDto = {
  items: CommentResponseDto[];
  total: number;
  page: number;
  limit: number;
};

// ----- Tags (POST/GET /api/tags, GET/DELETE /api/tags/{id}, attach/detach) -----

export type CreateTagDto = {
  name: string;
};

export type TagResponseDto = {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AttachTagDto = {
  entityType: EntityType;
  entityId: string;
};
