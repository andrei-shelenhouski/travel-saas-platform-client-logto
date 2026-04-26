/**
 * API types aligned with OpenAPI spec.
 * Source of truth: project root openapi.json.
 * Backend: Travel SaaS API (Spring Boot).
 */

// ----- Enums -----

export const LeadSource = {
  MANUAL: 'MANUAL',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
  WEBSITE: 'WEBSITE',
  AGENT: 'AGENT',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadStatus = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  OFFER_SENT: 'OFFER_SENT',
  WON: 'WON',
  LOST: 'LOST',
  EXPIRED: 'EXPIRED',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const ClientType = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
  B2B_AGENT: 'B2B_AGENT',
  AGENT: 'AGENT',
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

/** Generic paginated response. All list endpoints return { items, total, page, limit }. */
export type PaginatedDto<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

// ----- /api/me (GET) – OpenAPI: UserResponse -----

/** Role in organization (API enum). */
export const OrgRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  AGENT: 'AGENT',
  // Backward-compatible roles accepted by some existing environments.
  SALES_AGENT: 'SALES_AGENT',
  BACK_OFFICE: 'BACK_OFFICE',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

/** OpenAPI: OrgMembership. Organization membership entry in UserResponse. */
export type OrganizationWithRoleDto = {
  id: string;
  name: string;
  role: OrgRole;
  // Compatibility aliases for existing app code.
  organizationId: string;
  organizationName: string;
};

/** OpenAPI: UserResponse. GET /api/me response. */
export type MeResponseDto = {
  id: string;
  firebaseUid: string;
  email: string;
  fullName?: string;
  organizations: OrganizationWithRoleDto[];
  // Legacy aliases used in parts of the current UI/tests.
  name?: string;
  createdAt?: string;
  active?: boolean;
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

// ----- Organization members -----

/** OpenAPI: MemberResponse. Member of the current organization. */
export type OrganizationMemberResponseDto = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  active: boolean;
};

/** OpenAPI: UpdateMemberRoleRequest. PATCH /api/organization-members/{id}/role body. */
export type UpdateOrganizationMemberRoleDto = {
  role: OrgRole;
};

/** OpenAPI: AddMemberRequest. POST /api/organization-members body. */
export type AddOrganizationMemberDto = {
  email: string;
  role: OrgRole;
};

// ----- Organizations -----

export type CreateOrganizationDto = {
  name: string;
  defaultCurrency?: string;
  invoicePrefix?: string;
};

export type OrganizationResponseDto = {
  id: string;
  name: string;
  defaultCurrency?: string;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  createdAt: string;
};

// ----- Leads -----

export type CreateLeadDto = {
  clientId?: string;
  clientType?: string;
  clientName?: string;
  contactPhone?: string;
  contactEmail?: string;
  destination?: string;
  departDateFrom?: string;
  departDateTo?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  adults?: number;
  children?: number;
  notes?: string;
  assignedAgentId?: string;
};

export type LeadResponseDto = {
  id: string;
  number: string;
  source: LeadSource | string;
  clientId: string | null;
  clientName: string | null;
  clientType: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  companyName: string | null;
  destination: string | null;
  departDateFrom: string | null;
  departDateTo: string | null;
  returnDateFrom: string | null;
  returnDateTo: string | null;
  adults: number | null;
  children: number | null;
  notes: string | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  status: LeadStatus | string;
  expiresAt: string | null;
  createdById: string;
  convertedToClientId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedLeadResponseDto = PaginatedDto<LeadResponseDto>;

export type UpdateLeadDto = {
  destination?: string;
  departDateFrom?: string;
  departDateTo?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  adults?: number;
  children?: number;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
};

export type UpdateLeadStatusDto = {
  status: LeadStatus;
  reason?: string;
};

/** OpenAPI: AssignLeadRequest. PATCH /api/leads/{id}/assign body. */
export type AssignLeadDto = {
  agentId: string;
};

// ----- Offers -----

export const OfferItemType = {
  HOTEL: 'HOTEL',
  FLIGHT: 'FLIGHT',
  TRANSFER: 'TRANSFER',
  INSURANCE: 'INSURANCE',
  SERVICE: 'SERVICE',
} as const;
export type OfferItemType = (typeof OfferItemType)[keyof typeof OfferItemType];

/** OpenAPI: OfferItemRequest. Offer line item in CreateOfferRequest / UpdateOfferRequest. */
export type OfferItemRequest = {
  type: OfferItemType;
  name: string;
  supplier?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  comment?: string;
};

/** OpenAPI: ItemDto. Offer line item in OfferResponse. */
export type OfferItemDto = {
  id: string;
  type: OfferItemType | string;
  name: string;
  supplier?: string;
  currency: string;
  comment?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
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

export const OfferSource = {
  MANUAL: 'MANUAL',
  OSTROVOK: 'OSTROVOK',
} as const;
export type OfferSource = (typeof OfferSource)[keyof typeof OfferSource];

/** OpenAPI: CreateOfferRequest. POST /api/offers. */
export type CreateOfferDto = {
  requestId: string;
  title: string;
  source: OfferSource;
  supplierTotal: number;
  markup: number;
  commission: number;
  finalPrice: number;
  currency: string;
  items?: OfferItemRequest[];
};

/** OpenAPI: UpdateOfferRequest. PATCH /api/offers/{id}. */
export type UpdateOfferDto = {
  title?: string;
  supplierTotal?: number;
  markup?: number;
  commission?: number;
  finalPrice?: number;
  currency?: string;
  items?: OfferItemRequest[];
};

/** OpenAPI: UpdateOfferStatusRequest. PATCH /api/offers/{id}/status. */
export type UpdateOfferStatusDto = {
  status: OfferStatus;
};

/** OpenAPI: OfferResponse. GET/POST /api/offers, GET/PATCH /api/offers/{id}. Amounts as number. */
export type OfferResponseDto = {
  id: string;
  organizationId: string;
  requestId: string;
  title: string;
  source: OfferSource | string;
  status: OfferStatus | string;
  supplierTotal: number;
  markup: number;
  commission: number;
  finalPrice: number;
  currency: string;
  items: OfferItemDto[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedOfferResponseDto = PaginatedDto<OfferResponseDto>;

// ----- Bookings -----

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** OpenAPI: CreateBookingRequest. POST /api/bookings. */
export type CreateBookingDto = {
  offerId: string;
  clientId: string;
  agreedPrice: number;
  currency: string;
};

/** OpenAPI: UpdateBookingRequest. PATCH /api/bookings/{id}. */
export type UpdateBookingDto = {
  agreedPrice?: number;
  currency?: string;
};

/** OpenAPI: UpdateBookingStatusRequest. PATCH /api/bookings/{id}/status. */
export type UpdateBookingStatusDto = {
  status: BookingStatus;
};

/** OpenAPI: BookingResponse. agreedPrice as number. */
export type BookingResponseDto = {
  id: string;
  organizationId: string;
  offerId: string;
  clientId: string;
  agreedPrice: number;
  currency: string;
  status: BookingStatus | string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedBookingResponseDto = PaginatedDto<BookingResponseDto>;

// ----- Invoices -----

/** OpenAPI: CreateInvoiceRequest. POST /api/invoices. */
export type CreateInvoiceDto = {
  bookingId: string;
  issueDate: string;
  amount: number;
  currency: string;
  dueDate?: string;
};

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

/** OpenAPI: InvoiceResponse. amount as number. */
export type InvoiceResponseDto = {
  id: string;
  organizationId: string;
  bookingId: string;
  number: string;
  issueDate: string;
  dueDate: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus | string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedInvoiceResponseDto = PaginatedDto<InvoiceResponseDto>;

/** OpenAPI: UpdateInvoiceRequest. PATCH /api/invoices/{id}. */
export type UpdateInvoiceDto = {
  issueDate?: string;
  dueDate?: string;
  amount?: number;
  currency?: string;
  status?: InvoiceStatus;
  pdfUrl?: string;
};

// ----- Contacts -----

/** OpenAPI: ContactResponse. Contact person for a client. */
export type ContactResponseDto = {
  id: string;
  clientId: string;
  fullName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  primary: boolean;
};

/** OpenAPI: CreateContactRequest. POST /api/clients/{id}/contacts body. */
export type CreateContactDto = {
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
};

/** OpenAPI: UpdateContactRequest. PUT /api/clients/{id}/contacts/{contactId} body. */
export type UpdateContactDto = {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
};

// ----- Clients -----

/** OpenAPI: CreateClientRequest. POST /api/clients body. */
export type CreateClientDto = {
  type: ClientType;
  fullName?: string;
  email?: string;
  phone?: string;
  telegramHandle?: string;
  notes?: string;
  companyName?: string;
  legalAddress?: string;
  unp?: string;
  okpo?: string;
  iban?: string;
  bankName?: string;
  bik?: string;
  commissionPct?: number;
  dataConsentGiven: boolean;
};

/** OpenAPI: ClientResponse. */
export type ClientResponseDto = {
  id: string;
  organizationId: string;
  type: ClientType | string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  telegramHandle: string | null;
  notes: string | null;
  companyName: string | null;
  legalAddress: string | null;
  unp: string | null;
  okpo: string | null;
  commissionPct: number | null;
  iban: string | null;
  bankName: string | null;
  bik: string | null;
  dataConsentGiven: boolean;
  dataConsentDate: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: ContactResponseDto[];
};

export type PaginatedClientResponseDto = PaginatedDto<ClientResponseDto>;

/** OpenAPI: UpdateClientRequest. PUT /api/clients/{id} body. */
export type UpdateClientDto = {
  fullName?: string;
  email?: string;
  phone?: string;
  telegramHandle?: string;
  notes?: string;
  companyName?: string;
  legalAddress?: string;
  unp?: string;
  okpo?: string;
  iban?: string;
  bankName?: string;
  bik?: string;
};

// ----- Requests -----

export const RequestStatus = {
  OPEN: 'OPEN',
  QUOTED: 'QUOTED',
  CLOSED: 'CLOSED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

/** OpenAPI: CreateTravelRequestRequest. POST /api/requests body. */
export type CreateRequestDto = {
  leadId: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  notes?: string;
  managerId?: string;
};

/** OpenAPI: TravelRequestResponse. */
export type RequestResponseDto = {
  id: string;
  leadId: string;
  managerId: string | null;
  managerName: string | null;
  destination: string | null;
  departDate: string | null;
  returnDate: string | null;
  adults: number | null;
  children: number | null;
  notes: string | null;
  status: RequestStatus | string;
  offersCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedRequestResponseDto = PaginatedDto<RequestResponseDto>;

/** OpenAPI: UpdateTravelRequestRequest. PUT /api/requests/{id} body. */
export type UpdateRequestDto = {
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  notes?: string;
  managerId?: string;
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

// ----- Activities -----

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
  createdBy: string;
  updatedBy: string;
};

export type ActivityListResponseDto = PaginatedDto<ActivityResponseDto>;

// ----- Comments -----

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
  deletedAt: string | null;
  createdBy: string;
  updatedBy: string;
};

export type CommentListResponseDto = PaginatedDto<CommentResponseDto>;

// ----- Tags -----

export type CreateTagDto = {
  name: string;
};

export type TagResponseDto = {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string;
  updatedBy: string;
};

export type PaginatedTagResponseDto = PaginatedDto<TagResponseDto>;

export type AttachTagDto = {
  entityType: EntityType;
  entityId: string;
};

// ----- Webhooks -----

export type CreateWebhookRequest = {
  url: string;
  events: string[];
};

export type WebhookSubscription = {
  id: string;
  organizationId: string;
  url: string;
  signingSecret: string;
  events: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  active: boolean;
};

// ----- API Keys -----

export type CreateApiKeyRequest = {
  name: string;
  scopes: string[];
};

export type OrganizationApiKey = {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdBy: string;
};
