/**
 * API types aligned with OpenAPI spec.
 * Source of truth: project root openapi.json.
 * Backend: Travel SaaS API (Spring Boot).
 */

// ----- Enums -----

export const LeadSource = {
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
  convertedToClientId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedLeadResponseDto = PaginatedDto<LeadResponseDto>;

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

// ----- Clients -----

export type CreateClientDto = {
  type: ClientType;
  name: string;
  phone?: string;
  email?: string;
  comment?: string;
};

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

export type PaginatedClientResponseDto = PaginatedDto<ClientResponseDto>;

export type UpdateClientDto = {
  type?: ClientType;
  name?: string;
  phone?: string;
  email?: string;
  comment?: string;
};

// ----- Requests -----

export const RequestStatus = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CLIENT: 'WAITING_CLIENT',
  CLOSED: 'CLOSED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export type CreateRequestDto = {
  clientId: string;
  managerId: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children?: number;
  comment?: string;
};

export type RequestResponseDto = {
  id: string;
  organizationId: string;
  clientId: string;
  managerId: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  comment: string | null;
  status: RequestStatus | string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedRequestResponseDto = PaginatedDto<RequestResponseDto>;

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
