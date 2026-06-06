/**
 * Lead domain types aligned with OpenAPI spec.
 */

import type { CustomFieldValueDto, PaginatedDto } from './common.model';
import type { ClientResponseDto, CreateClientDto } from './client.model';
import type { OfferResponseDto } from './offer.model';

export const LeadSource = {
  MANUAL: 'MANUAL',
  INSTAGRAM_ADS: 'INSTAGRAM_ADS',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
  WEBSITE: 'WEBSITE',
  AGENT: 'AGENT',
  OTHER: 'OTHER',
  TOURVISOR: 'TOURVISOR',
  DIRECT_ENTRY: 'DIRECT_ENTRY',
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
  CONVERTED: 'CONVERTED',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export type CreateLeadDto = {
  clientId?: string;
  clientType?: string;
  clientName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactTelegram?: string;
  destination?: string;
  departDateFrom?: string;
  departDateTo?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  adults?: number;
  children?: number;
  notes?: string;
  assignedAgentId?: string;
  contactPersonId?: string;
};

export type DeletedByDto = {
  id?: string;
  name?: string;
};

export type DeleteLeadResponseDto = {
  id: string;
  deletedAt: string;
};

/** OpenAPI: LeadBookingDto. Booking summary embedded in GET /api/leads/{id} response. */
export type LeadBookingDto = {
  id: string;
  number: string;
  status: string;
  destination?: string | null;
  departDate?: string | null;
  returnDate?: string | null;
  assignedBackofficeName?: string | null;
  supplierConfirmationNumber?: string | null;
  invoicesCount: number;
};

export type LeadResponseDto = {
  id: string;
  number: string;
  source: LeadSource;
  clientId: string | null;
  clientName: string | null;
  clientType: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactTelegram: string | null;
  companyName: string | null;
  contactPersonId?: string | null;
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
  status: LeadStatus;
  expiresAt: string | null;
  createdById: string;
  convertedToClientId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: DeletedByDto | null;
  offers?: OfferResponseDto[];
  customFields?: CustomFieldValueDto[];
  booking?: LeadBookingDto | null;
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
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactTelegram?: string | null;
};

export type UpdateLeadStatusDto = {
  status: LeadStatus;
  reason?: string;
};

/** OpenAPI: LinkLeadClientRequest. PATCH /api/leads/{id}/client body. */
export type LinkLeadClientDto = {
  clientId: string;
};

/** OpenAPI: PromoteLeadToClientRequest. POST /api/leads/{id}/promote-client body. */
export type PromoteLeadToClientDto = CreateClientDto;

/** OpenAPI: PromoteLeadToClientResponse. */
export type PromoteLeadToClientResponseDto = {
  client: ClientResponseDto;
  lead: LeadResponseDto;
};

/** OpenAPI: AssignLeadRequest. PATCH /api/leads/{id}/assign body. */
export type AssignLeadDto = {
  agentId: string;
};

/** OpenAPI: UpdateLeadContactPersonRequest. PATCH /api/leads/{id}/contact-person body. */
export type UpdateLeadContactPersonDto = {
  contactPersonId: string;
};

// ----- Status option constants -----

export type LeadStatusOption = { value: LeadStatus; label: string };

export const LEAD_STATUS_OPTIONS: LeadStatusOption[] = [
  { value: LeadStatus.NEW, label: 'Новый' },
  { value: LeadStatus.ASSIGNED, label: 'Назначен' },
  { value: LeadStatus.IN_PROGRESS, label: 'В работе' },
  { value: LeadStatus.OFFER_SENT, label: 'Отправлено КП' },
  { value: LeadStatus.WON, label: 'Выигран' },
  { value: LeadStatus.LOST, label: 'Проигран' },
  { value: LeadStatus.EXPIRED, label: 'Истек' },
];
