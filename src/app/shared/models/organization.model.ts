/**
 * Organization, User, Role, Permission, and supporting domain types.
 */

import type { CustomFieldValueDto, EntityType, PaginatedDto } from './common.model';
import type { ClientType } from './client.model';

// ----- Org Role -----

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

// ----- Permissions -----

export const PermissionKey = {
  SETTINGS_UPDATE: 'settings:update',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_UPDATE: 'members:update',
  ROLES_VIEW: 'roles:view',
  LEADS_CREATE: 'leads:create',
  LEADS_ASSIGN: 'leads:assign',
  LEADS_VIEW_ALL: 'leads:view:all',
  OFFERS_CREATE: 'offers:create',
  OFFERS_VIEW_ALL: 'offers:view:all',
  REQUESTS_VIEW_ALL: 'requests:view:all',
  OFFERS_DELETE: 'offers:delete',
  LEADS_DELETE: 'leads:delete',
  BOOKINGS_DELETE: 'bookings:delete',
  BOOKINGS_UPDATE: 'bookings:update',
  CONTRACTS_VIEW: 'contracts:view',
  CONTRACTS_CREATE: 'contracts:create',
  CONTRACTS_UPDATE: 'contracts:update',
  INVOICES_VIEW: 'invoices:view',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_PUBLISH: 'invoices:publish',
  INVOICES_RECORD_PAYMENT: 'invoices:record_payment',
  INVOICES_CANCEL: 'invoices:cancel',
  PERSONS_READ: 'persons:read',
  PERSONS_WRITE: 'persons:write',
} as const;
export type Permission =
  | (typeof PermissionKey)[keyof typeof PermissionKey]
  | (string & Record<never, never>);

// ----- /api/me (GET) – OpenAPI: UserResponse -----

/** OpenAPI: OrgMembership. Organization membership entry in UserResponse. */
export type OrganizationWithRoleDto = {
  id: string;
  name: string;
  // Legacy field present in older payloads; not guaranteed by current OpenAPI.
  role?: OrgRole | (string & Record<never, never>);
  roleId?: string;
  roleName?: string;
  permissions?: ReadonlySet<Permission>;
  // Compatibility aliases for existing app code.
  organizationId: string;
  organizationName: string;
};

export type OrganizationWithRoleApiDto = Omit<
  OrganizationWithRoleDto,
  'organizationId' | 'organizationName' | 'permissions'
> & {
  permissions?: Permission[];
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

export type MeResponseApiDto = Omit<MeResponseDto, 'organizations'> & {
  organizations: OrganizationWithRoleApiDto[];
};

/** Legacy alias for components that only need id + name. */
export type Organization = Pick<OrganizationWithRoleDto, 'id' | 'name'>;

// ----- Org users (/api/users) -----

/** OpenAPI: OrgUserResponse. Full user record returned by GET/PUT /api/users. */
export type OrgUserResponseDto = {
  id: string;
  appUserId: string;
  email: string;
  fullName: string;
  role: OrgRole | (string & Record<never, never>);
  roleId?: string;
  roleName?: string;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt?: string;
};

export type PaginatedOrgUserResponseDto = PaginatedDto<OrgUserResponseDto>;

/** OpenAPI: InviteUserRequest. POST /api/users body. */
export type InviteUserRequestDto = {
  email: string;
  fullName: string;
  roleId: string;
};

/** OpenAPI: UpdateUserRequest. PUT /api/users/{id} body. */
export type UpdateUserRequestDto = {
  fullName: string;
  roleId: string;
};

// ----- Organization members -----

/** OpenAPI: MemberResponse. Member of the current organization. */
export type OrganizationMemberResponseDto = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole | (string & Record<never, never>);
  active: boolean;
};

/** OpenAPI: UpdateMemberRoleRequest. PATCH /api/organization-members/{id}/role body. */
export type UpdateOrganizationMemberRoleDto = {
  roleId: string;
};

/** OpenAPI: AddMemberRequest. POST /api/organization-members body. */
export type AddOrganizationMemberDto = {
  email: string;
  roleId: string;
};

// ----- Roles and permissions -----

/** OpenAPI: ChangeRoleRequest. PUT /api/users/{id}/role body. */
export type ChangeRoleRequestDto = {
  roleId: string;
};

/** OpenAPI: PermissionKeyResponse. */
export type PermissionKeyResponseDto = {
  key?: Permission;
  description?: string;
};

/** OpenAPI: PermissionGroupResponse. GET /api/permissions item. */
export type PermissionGroupResponseDto = {
  module?: string;
  permissions?: PermissionKeyResponseDto[];
};

/** OpenAPI: RolePermissionResponse. */
export type RolePermissionResponseDto = {
  key?: Permission;
  module?: string;
  description?: string;
};

/** OpenAPI: RoleSummaryResponse. GET /api/roles item. */
export type RoleSummaryResponseDto = {
  id: string;
  name: string;
  description?: string;
  permissionCount?: number;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  system?: boolean;
  isSystem?: boolean;
};

/** OpenAPI: RoleDetailResponse. */
export type RoleDetailResponseDto = {
  id: string;
  name: string;
  description?: string;
  permissions?: RolePermissionResponseDto[];
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  system?: boolean;
  isSystem?: boolean;
};

/** OpenAPI: CreateRoleRequest. POST /api/roles body. */
export type CreateRoleRequestDto = {
  name: string;
  description?: string;
  permissions: Permission[];
};

/** OpenAPI: UpdateRoleRequest. PUT /api/roles/{id} body. */
export type UpdateRoleRequestDto = {
  name: string;
  description?: string;
  permissions: Permission[];
};

/** OpenAPI: ReplacePermissionsRequest. PUT /api/roles/{id}/permissions body. */
export type ReplacePermissionsRequestDto = {
  permissions: Permission[];
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

/** OpenAPI: UpdateOrganizationSettingsRequest.defaultCurrency pattern. */
export const OrganizationCurrency = {
  BYN: 'BYN',
  USD: 'USD',
  EUR: 'EUR',
  GEL: 'GEL',
  RUB: 'RUB',
  CZK: 'CZK',
  PLN: 'PLN',
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
  defaultPaymentTermsDays?: number;
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
  defaultPaymentTermsDays?: number;
  defaultCommissionPct?: number;
  agentAssignmentRule?: AgentAssignmentRule;
  createdAt?: string;
  updatedAt?: string;
};

/** OpenAPI: TourvisorIntegrationStatusResponse. */
export type TourvisorIntegrationStatusResponseDto = {
  connected: boolean;
  defaultAgentId?: string | null;
  lastPolledAt?: string | null;
  lastWebhookAt?: string | null;
  ingestOrderTypes?: number[];
};

/** OpenAPI: UpsertTourvisorIntegrationRequest. */
export type UpsertTourvisorIntegrationRequestDto = {
  authkey: string;
  defaultAgentId?: string | null;
  ingestOrderTypes?: number[];
};

/** OpenAPI: TourvisorTestResponse. */
export type TourvisorTestResponseDto = {
  ok: boolean;
  error?: string;
};

// Backward-compatible aliases.
export type TourvisorIntegrationSettingsResponseDto = TourvisorIntegrationStatusResponseDto;
export type UpdateTourvisorIntegrationSettingsDto = UpsertTourvisorIntegrationRequestDto;
export type TourvisorIntegrationTestResponseDto = TourvisorTestResponseDto;

// ----- Custom Fields -----

export const CustomFieldEntityType = {
  LEAD: 'LEAD',
  BOOKING: 'BOOKING',
  CLIENT: 'CLIENT',
} as const;
export type CustomFieldEntityType =
  (typeof CustomFieldEntityType)[keyof typeof CustomFieldEntityType];

export const CustomFieldType = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  DROPDOWN: 'DROPDOWN',
  DATE: 'DATE',
  URL: 'URL',
} as const;
export type CustomFieldType = (typeof CustomFieldType)[keyof typeof CustomFieldType];

export type CreateCustomFieldDefinitionRequestDto = {
  entityType: CustomFieldEntityType;
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
  required?: boolean;
  sortOrder?: number;
};

export type CustomFieldDefinitionRequestDto = {
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
  required?: boolean;
  sortOrder?: number;
};

export type CustomFieldDefinitionResponseDto = {
  id: string;
  organizationId: string;
  entityType: CustomFieldEntityType | string;
  fieldType: CustomFieldType;
  name: string;
  options?: string[];
  required?: boolean;
  active?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

export { CustomFieldValueDto };

export type UpsertCustomFieldsRequestDto = {
  values: Record<string, string>;
};

export type ReorderRequestDto = {
  ids: string[];
};

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

/** OpenAPI: IntegrationApiKeyResponse. GET /api/settings/integrations/api-keys item. */
export type IntegrationApiKeyResponseDto = {
  id: string;
  name: string;
  keyPrefix: string;
  widgetConfig: Record<string, unknown> | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

/** OpenAPI: IntegrationApiKeyCreateResponse. POST /api/settings/integrations/api-keys 201 body (contains rawKey). */
export type IntegrationApiKeyCreateResponseDto = {
  id: string;
  name: string;
  keyPrefix: string;
  rawKey: string;
  widgetConfig: Record<string, unknown> | null;
  lastUsedAt: string | null;
  createdAt: string;
};

/** OpenAPI: CreateIntegrationApiKeyRequest. POST /api/settings/integrations/api-keys body. */
export type CreateIntegrationApiKeyRequestDto = {
  name: string;
};

/** OpenAPI: UpdateIntegrationApiKeyRequest. PUT /api/settings/integrations/api-keys/{id} body. */
export type UpdateIntegrationApiKeyRequestDto = {
  name?: string;
  widgetConfig?: Record<string, unknown> | null;
};

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

// ----- Contracts -----

export const ContractStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const SignatureMethod = {
  ORIGINAL_MAIL: 'ORIGINAL_MAIL',
  ORIGINAL_COURIER: 'ORIGINAL_COURIER',
  DIGITAL_PODPIS: 'DIGITAL_PODPIS',
  OTHER: 'OTHER',
} as const;
export type SignatureMethod = (typeof SignatureMethod)[keyof typeof SignatureMethod];

export type ContractClientSummaryDto = {
  id: string;
  type?: ClientType;
  fullName?: string | null;
  companyName?: string | null;
  trademark?: string | null;
  registrationCert?: string | null;
  taxationType?: string | null;
  directorName?: string | null;
  rataMember?: boolean | null;
  email?: string | null;
  phone?: string | null;
};

export type ContractResponseDto = {
  id: string;
  organizationId: string;
  clientId: string;
  client?: ContractClientSummaryDto | null;
  contractNumber: string;
  signedAt: string;
  expiresAt: string | null;
  signatureMethod: SignatureMethod | null;
  status: ContractStatus;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedContractResponseDto = PaginatedDto<ContractResponseDto>;

export type ListContractsQueryDto = {
  page?: number;
  limit?: number;
  clientId?: string;
  status?: ContractStatus;
  /** Compatibility with backend pageable binding; preferred field is limit. */
  size?: number;
};

export type CreateContractDto = {
  clientId: string;
  contractNumber: string;
  signedAt: string;
  expiresAt?: string;
  signatureMethod?: SignatureMethod;
  notes?: string;
};

export type UpdateContractDto = {
  contractNumber?: string;
  signedAt?: string;
  expiresAt?: string;
  signatureMethod?: SignatureMethod;
  notes?: string;
};

export type TerminateContractDto = {
  notes?: string;
};
