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

// ----- Org users (/api/users) -----

/** OpenAPI: OrgUserResponse. Full user record returned by GET/PUT /api/users. */
export type OrgUserResponseDto = {
  id: string;
  appUserId: string;
  email: string;
  fullName: string;
  role: OrgRole;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt?: string;
};

export type PaginatedOrgUserResponseDto = PaginatedDto<OrgUserResponseDto>;

/** OpenAPI: InviteUserRequest. POST /api/users body. */
export type InviteUserRequestDto = {
  email: string;
  fullName: string;
  role: OrgRole;
};

/** OpenAPI: UpdateUserRequest. PUT /api/users/{id} body. */
export type UpdateUserRequestDto = {
  fullName: string;
  role: OrgRole;
};

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
  offerValidityDays?: number;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  createdAt: string;
};

/** OpenAPI: UpdateOrganizationSettingsRequest.defaultCurrency pattern. */
export const OrganizationCurrency = {
  BYN: 'BYN',
  USD: 'USD',
  EUR: 'EUR',
} as const;
export type OrganizationCurrency = (typeof OrganizationCurrency)[keyof typeof OrganizationCurrency];

/** OpenAPI: UpdateOrganizationSettingsRequest.defaultLanguage pattern. */
export const OrganizationLanguage = {
  RU: 'RU',
  EN: 'EN',
} as const;
export type OrganizationLanguage = (typeof OrganizationLanguage)[keyof typeof OrganizationLanguage];

/** OpenAPI: UpdateOrganizationSettingsRequest.agentAssignmentRule pattern. */
export const AgentAssignmentRule = {
  MANUAL: 'MANUAL',
  ROUND_ROBIN: 'ROUND_ROBIN',
} as const;
export type AgentAssignmentRule = (typeof AgentAssignmentRule)[keyof typeof AgentAssignmentRule];

/** OpenAPI: UpdateOrganizationSettingsRequest. PUT /api/settings/organization body. */
export type UpdateOrganizationSettingsDto = {
  name: string;
  defaultCurrency: OrganizationCurrency;
  defaultLanguage: OrganizationLanguage;
  legalName?: string;
  legalAddress?: string;
  unp?: string;
  okpo?: string;
  directorName?: string;
  directorTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  iban?: string;
  bankName?: string;
  bik?: string;
  offerNumberPrefix?: string;
  invoicePrefix?: string;
  offerValidityDays?: number;
  leadExpiryDays?: number;
  defaultPaymentTerms?: string;
  defaultCommissionPct?: number;
  agentAssignmentRule?: AgentAssignmentRule;
};

/** OpenAPI: OrganizationSettingsResponse. GET/PUT /api/settings/organization response. */
export type OrganizationSettingsResponseDto = {
  id?: string;
  name?: string;
  legalName?: string;
  legalAddress?: string;
  unp?: string;
  okpo?: string;
  directorName?: string;
  directorTitle?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  iban?: string;
  bankName?: string;
  bik?: string;
  defaultCurrency?: OrganizationCurrency;
  defaultLanguage?: OrganizationLanguage;
  offerNumberPrefix?: string;
  invoicePrefix?: string;
  offerValidityDays?: number;
  leadExpiryDays?: number;
  defaultPaymentTerms?: string;
  defaultCommissionPct?: number;
  agentAssignmentRule?: AgentAssignmentRule;
  createdAt?: string;
  updatedAt?: string;
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

/** OpenAPI: AccommodationRequest. Accommodation line item in CreateOfferRequest / UpdateOfferRequest. */
export type AccommodationRequest = {
  sortOrder?: number;
  hotelName: string;
  roomType?: string;
  mealPlan?: string;
  checkinDate: string;
  checkoutDate: string;
  unitPrice: number;
};

/** OpenAPI: ServiceItemRequest. Service line item in CreateOfferRequest / UpdateOfferRequest. */
export type ServiceItemRequest = {
  sortOrder?: number;
  serviceType: string;
  description?: string;
  quantity?: number;
  unitPrice: number;
};

/** OpenAPI: AccommodationDto. Accommodation line item in OfferResponse. */
export type AccommodationDto = {
  id?: string;
  sortOrder?: number;
  hotelName?: string;
  roomType?: string;
  mealPlan?: string;
  checkinDate?: string;
  checkoutDate?: string;
  unitPrice?: number;
  total?: number;
};

/** OpenAPI: ServiceItemDto. Service line item in OfferResponse. */
export type ServiceItemDto = {
  id?: string;
  sortOrder?: number;
  quantity?: number;
  serviceType?: string;
  description?: string;
  unitPrice?: number;
  total?: number;
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

/** OpenAPI: CreateOfferRequest. POST /api/offers. */
export type CreateOfferDto = {
  requestId: string;
  language: string;
  validityDate?: string;
  destination?: string;
  departureCity?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  currency: string;
  discountPct?: number;
  discountAmount?: number;
  internalNotes?: string;
  accommodations?: AccommodationRequest[];
  services?: ServiceItemRequest[];
};

/** OpenAPI: UpdateOfferRequest. PUT /api/offers/{id}. */
export type UpdateOfferDto = {
  language?: string;
  validityDate?: string;
  destination?: string;
  departureCity?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  currency?: string;
  discountPct?: number;
  discountAmount?: number;
  internalNotes?: string;
  accommodations?: AccommodationRequest[];
  services?: ServiceItemRequest[];
};

/** OpenAPI: UpdateOfferStatusRequest. PUT /api/offers/{id}/status. */
export type UpdateOfferStatusDto = {
  status: OfferStatus;
};

/** OpenAPI: OfferResponse. GET/POST /api/offers, GET/PUT /api/offers/{id}. */
export type OfferResponseDto = {
  id: string;
  organizationId?: string;
  requestId?: string;
  leadId?: string;
  previousVersionId?: string;
  number?: string;
  version?: number;
  status: OfferStatus | string;
  language?: string;
  offerDate?: string;
  validityDate?: string;
  departDate?: string;
  returnDate?: string;
  destination?: string;
  departureCity?: string;
  currency?: string;
  internalNotes?: string;
  adults?: number;
  children?: number;
  subtotal?: number;
  discountAmount?: number;
  discountPct?: number;
  total?: number;
  accommodations?: AccommodationDto[];
  services?: ServiceItemDto[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedOfferResponseDto = PaginatedDto<OfferResponseDto>;

// ----- Bookings -----

export const BookingStatus = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  // Backward-compatible aliases used in existing UI code.
  PENDING: 'PENDING_CONFIRMATION',
  PAID: 'COMPLETED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** OpenAPI: CreateBookingRequest. POST /api/bookings. */
export type CreateBookingDto = {
  offerId?: string;
  leadId?: string;
  clientId: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  accommodationDetails?: Record<string, unknown>[];
  assignedBackofficeId?: string;
  internalNotes?: string;
};

/** OpenAPI: UpdateBookingRequest. PUT /api/bookings/{id}. */
export type UpdateBookingDto = {
  supplierConfirmationNumber?: string;
  internalNotes?: string;
  assignedBackofficeId?: string;
  accommodationDetails?: Record<string, unknown>[];
  destination?: string;
  departDate?: string;
  returnDate?: string;
};

/** OpenAPI: UpdateBookingStatusRequest. PUT /api/bookings/{id}/status. */
export type UpdateBookingStatusDto = {
  status: BookingStatus;
  reason?: string;
};

/** OpenAPI: BookingDocumentResponse. */
export type BookingDocumentResponseDto = {
  id: string;
  filename?: string;
  uploadedAt?: string;
  uploadedByName?: string;
};

/** OpenAPI: ErrorResponse. */
export type ErrorResponseDto = {
  status?: number;
  error?: string;
  message?: string;
};

/** OpenAPI: BookingResponse. */
export type BookingResponseDto = {
  id: string;
  organizationId: string;
  number?: string;
  offerId: string;
  leadId?: string;
  clientId: string;
  clientSnapshot?: Record<string, unknown>;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  accommodationDetails?: Record<string, unknown>[];
  supplierConfirmationNumber?: string;
  assignedBackofficeId?: string;
  assignedBackofficeName?: string;
  status: BookingStatus | string;
  cancellationReason?: string;
  internalNotes?: string;
  invoicesCount?: number;
  documentsCount?: number;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedBookingResponseDto = PaginatedDto<BookingResponseDto>;

/** OpenAPI: TravelRequestSummary. Item in GET /api/clients/{id}/requests. */
export type TravelRequestSummaryDto = {
  id: string;
  leadId?: string;
  leadNumber?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  status?: string;
  offersCount?: number;
  createdAt?: string;
};

export type PaginatedTravelRequestSummaryDto = PaginatedDto<TravelRequestSummaryDto>;

/** OpenAPI: OfferSummary. Item in GET /api/clients/{id}/offers. */
export type OfferSummaryDto = {
  id: string;
  offerNumber?: string;
  leadId?: string;
  leadNumber?: string;
  travelRequestId?: string;
  destination?: string;
  totalPrice?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

export type PaginatedOfferSummaryDto = PaginatedDto<OfferSummaryDto>;

/** OpenAPI: BookingSummary. Item in GET /api/clients/{id}/bookings. */
export type BookingSummaryDto = {
  id: string;
  bookingNumber?: string;
  leadId?: string;
  leadNumber?: string;
  offerId?: string;
  offerNumber?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  status?: string;
  totalPrice?: number;
  currency?: string;
  createdAt?: string;
};

export type PaginatedBookingSummaryDto = PaginatedDto<BookingSummaryDto>;

// ----- Invoices -----

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export type CreateInvoiceLineItemDto = {
  sortOrder?: number;
  description: string;
  serviceDateFrom?: string;
  serviceDateTo?: string;
  travelers?: string;
  unitPrice?: number;
  quantity?: number;
  tourCost?: number;
  commissionAmount?: number;
};

/** OpenAPI: InvoiceResponse. amount as number. */
export type InvoiceResponseDto = {
  id: string;
  number: string;
  bookingId: string;
  clientId: string;
  clientType?: ClientType | string;
  clientSnapshot?: string;
  issuerSnapshot?: string;
  language?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal?: number;
  discountAmount?: number;
  commissionVatAmount?: number;
  total?: number;
  amountInWords?: string;
  paymentTerms?: string;
  internalNotes?: string;
  status: InvoiceStatus | string;
  cancellationReason?: string;
  publishedAt?: string;
  createdById?: string;
  lineItems?: InvoiceLineItemResponseDto[];
  payments?: PaymentResponseDto[];
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedInvoiceResponseDto = PaginatedDto<InvoiceResponseDto>;

/** OpenAPI: UpdateInvoiceRequest. PUT /api/invoices/{id}. */
export type UpdateInvoiceDto = {
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  language?: string;
  paymentTerms?: string;
  internalNotes?: string;
  lineItems?: CreateInvoiceLineItemDto[];
};

export type CreateInvoiceDto = {
  bookingId?: string;
  clientId: string;
  clientType: ClientType;
  language?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  paymentTerms?: string;
  internalNotes?: string;
  lineItems: CreateInvoiceLineItemDto[];
};

export type InvoiceLineItemResponseDto = {
  id?: string;
  sortOrder?: number;
  description?: string;
  serviceDateFrom?: string;
  serviceDateTo?: string;
  travelers?: string;
  unitPrice?: number;
  quantity?: number;
  tourCost?: number;
  commissionAmount?: number;
  commissionVat?: number;
  total?: number;
};

export type CancelInvoiceDto = {
  reason: string;
};

export const PaymentMethod = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** OpenAPI: PaymentResponse. GET /api/invoices/{id}/payments response item. */
export type PaymentResponseDto = {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | string;
  reference?: string;
  source?: string;
  recordedByName?: string;
  createdAt: string;
};

/** OpenAPI: RecordPaymentRequest. POST /api/invoices/{id}/payments body. */
export type RecordPaymentRequestDto = {
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | string;
  reference?: string;
};

export type InvoiceFilterQueryDto = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus[];
  clientType?: ClientType;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  search?: string;
};

export type InvoiceSummaryResponseDto = {
  drafts: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  currency: string;
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
  fullName: string;
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
  Invoice: 'Invoice',
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
