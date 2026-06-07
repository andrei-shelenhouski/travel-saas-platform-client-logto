/**
 * Client, Contact, and Person domain types aligned with OpenAPI spec.
 */

import type { CustomFieldValueDto, PaginatedDto } from './common.model';

export const ClientType = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
  B2B_AGENT: 'B2B_AGENT',
  AGENT: 'AGENT',
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

// ----- Contacts -----

/** OpenAPI: ContactResponse. Contact person for a client. */
export type ContactResponseDto = {
  id: string;
  clientId: string;
  fullName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  telegramHandle: string | null;
  createdAt: string;
  updatedAt: string;
  primary: boolean;
};

/** OpenAPI: CreateContactRequest. POST /api/clients/{id}/contacts body. */
export type CreateContactDto = {
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
  telegramHandle?: string;
  isPrimary?: boolean;
};

/** OpenAPI: UpdateContactRequest. PUT /api/clients/{id}/contacts/{contactId} body. */
export type UpdateContactDto = {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
  telegramHandle?: string;
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
  trademark?: string;
  registrationCert?: string;
  taxationType?: string;
  directorName?: string;
  rataMember?: boolean;
  dataConsentGiven: boolean;
  dataConsentDate?: string;
};

/** OpenAPI: ClientResponse. */
export type ClientResponseDto = {
  id: string;
  organizationId: string;
  type: ClientType;
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
  trademark?: string | null;
  registrationCert?: string | null;
  taxationType?: string | null;
  directorName?: string | null;
  rataMember?: boolean | null;
  dataConsentGiven: boolean;
  dataConsentDate: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: ContactResponseDto[];
  personId?: string | null;
  customFields?: CustomFieldValueDto[];
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
  trademark?: string;
  registrationCert?: string;
  taxationType?: string;
  directorName?: string;
  rataMember?: boolean;
};

// ----- Persons -----

export const PersonDocumentType = {
  INTL_PASSPORT: 'INTL_PASSPORT',
  NATIONAL_PASSPORT: 'NATIONAL_PASSPORT',
  NATIONAL_ID: 'NATIONAL_ID',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  OTHER: 'OTHER',
} as const;
export type PersonDocumentType = (typeof PersonDocumentType)[keyof typeof PersonDocumentType];

export const PersonAddressType = {
  REGISTRATION: 'REGISTRATION',
  RESIDENTIAL: 'RESIDENTIAL',
  OTHER: 'OTHER',
} as const;
export type PersonAddressType = (typeof PersonAddressType)[keyof typeof PersonAddressType];

export const PersonContactMedium = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  TELEGRAM: 'TELEGRAM',
} as const;
export type PersonContactMedium = (typeof PersonContactMedium)[keyof typeof PersonContactMedium];

export const PersonGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type PersonGender = (typeof PersonGender)[keyof typeof PersonGender];

export const PersonRelationshipType = {
  SPOUSE_OF: 'SPOUSE_OF',
  PARENT_OF: 'PARENT_OF',
  SIBLING_OF: 'SIBLING_OF',
  GRANDPARENT_OF: 'GRANDPARENT_OF',
  OTHER: 'OTHER',
} as const;
export type PersonRelationshipType =
  (typeof PersonRelationshipType)[keyof typeof PersonRelationshipType];

export const PersonRelationshipStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type PersonRelationshipStatus =
  (typeof PersonRelationshipStatus)[keyof typeof PersonRelationshipStatus];

/** OpenAPI: PersonDocumentResponse. */
export type PersonDocumentResponseDto = {
  id: string;
  type: PersonDocumentType | (string & Record<never, never>);
  series?: string;
  numberLast4: string;
  issueDate?: string;
  expiryDate?: string;
  issuedBy?: string;
  primary: boolean;
  createdAt: string;
};

/** OpenAPI: PersonAddressResponse. */
export type PersonAddressResponseDto = {
  id: string;
  type: PersonAddressType | (string & Record<never, never>);
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  primary?: boolean;
  createdAt: string;
};

/** OpenAPI: PersonContactResponse. */
export type PersonContactResponseDto = {
  id: string;
  medium: PersonContactMedium | (string & Record<never, never>);
  value: string;
  primary: boolean;
  createdAt: string;
};

/** OpenAPI: PersonResponse. */
export type PersonResponseDto = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  firstNameTranslit?: string;
  lastNameTranslit?: string;
  dateOfBirth?: string;
  gender?: PersonGender | (string & Record<never, never>);
  citizenship?: string;
  personalNumber?: string;
  dataConsentGiven?: boolean;
  dataConsentDate?: string;
  notes?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  documents: PersonDocumentResponseDto[];
  addresses: PersonAddressResponseDto[];
  contacts: PersonContactResponseDto[];
  clientId?: string;
};

/** OpenAPI: PersonSearchResult. */
export type PersonSearchResultDto = {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  citizenship?: string;
  clientId?: string;
};

/** OpenAPI: RelationshipResponse. */
export type PersonRelationshipResponseDto = {
  id: string;
  personId: string;
  relatedPersonId: string;
  type: PersonRelationshipType | (string & Record<never, never>);
  inverseLabel?: string;
  status: PersonRelationshipStatus | (string & Record<never, never>);
  customLabel?: string;
  sinceDate?: string;
  untilDate?: string;
  notes?: string;
  createdAt?: string;
};

/** OpenAPI: CreatePersonRequest. POST /api/clients/:id/person body. */
export type CreatePersonRequestDto = {
  firstName: string;
  lastName: string;
  patronymic?: string;
  firstNameTranslit?: string;
  lastNameTranslit?: string;
  dateOfBirth?: string;
  gender?: string;
  citizenship?: string;
  personalNumber?: string;
  dataConsentGiven?: boolean;
  dataConsentDate?: string;
  notes?: string;
};

/** OpenAPI: UpdatePersonRequest. PATCH /api/persons/:id body. */
export type UpdatePersonRequestDto = {
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  firstNameTranslit?: string;
  lastNameTranslit?: string;
  dateOfBirth?: string;
  gender?: string;
  citizenship?: string;
  personalNumber?: string;
  dataConsentGiven?: boolean;
  dataConsentDate?: string;
  notes?: string;
};

/** OpenAPI: CreatePersonRequest. POST /api/persons body. */
export type CreateDetachedPersonRequestDto = CreatePersonRequestDto;

/** OpenAPI: AddPersonRelationshipRequest. POST /api/persons/:id/relationships body. */
export type AddPersonRelationshipRequestDto = {
  toPersonId: string;
  type: PersonRelationshipType | (string & Record<never, never>);
};

/** OpenAPI: PersonDocumentRequest. POST/PUT /api/persons/:id/documents body. */
export type PersonDocumentRequestDto = {
  type: string;
  number: string;
  series?: string;
  issueDate?: string;
  expiryDate?: string;
  issuedBy?: string;
  primary?: boolean;
};

/** OpenAPI: PersonAddressRequest. POST/PUT /api/persons/:id/addresses body. */
export type PersonAddressRequestDto = {
  type: PersonAddressType | (string & Record<never, never>);
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  primary?: boolean;
};

/** OpenAPI: PersonContactRequest. POST/PUT /api/persons/:id/contacts body. */
export type PersonContactRequestDto = {
  medium: PersonContactMedium | (string & Record<never, never>);
  value: string;
  primary?: boolean;
};

/** OpenAPI: LinkPersonRequest. PUT /api/clients/:id/person body. */
export type LinkPersonRequestDto = {
  personId: string;
};

// ----- Person list (GET /api/persons) -----

export type LinkedClientSummaryDto = {
  id: string;
  display_name: string;
};

/** OpenAPI: PersonListItem */
export type PersonListItemDto = {
  id: string;
  type: 'CLIENT' | 'DEPENDANT';
  full_name: string;
  date_of_birth?: string;
  linked_client?: LinkedClientSummaryDto;
  document_expiry_status: 'OK' | 'EXPIRING' | 'EXPIRED' | 'NONE';
  nearest_expiry?: string;
};

/** OpenAPI: PaginatedResponsePersonListItem */
export type PaginatedPersonListDto = {
  items: PersonListItemDto[];
  total: number;
  page: number;
  limit: number;
};

/** Query params for GET /api/persons */
export type ListPersonsQueryDto = {
  page?: number;
  limit?: number;
  type?: 'CLIENT' | 'DEPENDANT';
  docStatus?: 'EXPIRING' | 'EXPIRED';
  q?: string;
};

// ----- Person bookings (GET /api/persons/{id}/bookings) -----

/** OpenAPI: PersonBookingItem. One booking row on a person's booking history. */
export type PersonBookingItemDto = {
  id: string;
  number: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  status: string;
  travelerRole?: string;
  clientName?: string;
};

/** OpenAPI: PaginatedResponsePersonBookingItem. */
export type PaginatedPersonBookingItemDto = {
  items: PersonBookingItemDto[];
  total: number;
  page: number;
  limit: number;
};

// ----- Status option constants -----

export type StatusOption<T> = { value: T; label: string };

export const CLIENT_TYPE_OPTIONS: StatusOption<ClientType>[] = [
  { value: ClientType.INDIVIDUAL, label: 'Физ. лицо' },
  { value: ClientType.COMPANY, label: 'Компания' },
  { value: ClientType.B2B_AGENT, label: 'B2B агент' },
  { value: ClientType.AGENT, label: 'Агент' },
];
