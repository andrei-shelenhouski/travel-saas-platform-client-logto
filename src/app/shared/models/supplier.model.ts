/**
 * Supplier domain types aligned with OpenAPI spec.
 */

import type { PaginatedDto } from './common.model';

// ----- Enums -----

export const SupplierCategory = {
  DIRECT: 'DIRECT',
  DMC: 'DMC',
  BED_BANK: 'BED_BANK',
  OTA: 'OTA',
  PACKAGE_OPERATOR: 'PACKAGE_OPERATOR',
  CONSOLIDATOR: 'CONSOLIDATOR',
  OTHER: 'OTHER',
} as const;
export type SupplierCategory = (typeof SupplierCategory)[keyof typeof SupplierCategory];

export const SUPPLIER_CATEGORY_LABELS: Record<string, string> = {
  [SupplierCategory.DIRECT]: 'Прямой',
  [SupplierCategory.DMC]: 'ДМК',
  [SupplierCategory.BED_BANK]: 'Кровать-банк',
  [SupplierCategory.OTA]: 'ОТА',
  [SupplierCategory.PACKAGE_OPERATOR]: 'Туроператор',
  [SupplierCategory.CONSOLIDATOR]: 'Консолидатор',
  [SupplierCategory.OTHER]: 'Другое',
};

export const SupplierServiceType = {
  HOTEL: 'HOTEL',
  TRANSFER: 'TRANSFER',
  EXCURSION: 'EXCURSION',
  FLIGHT: 'FLIGHT',
  INSURANCE: 'INSURANCE',
  VISA: 'VISA',
  PACKAGE: 'PACKAGE',
  OTHER: 'OTHER',
} as const;
export type SupplierServiceType = (typeof SupplierServiceType)[keyof typeof SupplierServiceType];

export const SUPPLIER_SERVICE_TYPE_LABELS: Record<string, string> = {
  [SupplierServiceType.HOTEL]: 'Отель',
  [SupplierServiceType.TRANSFER]: 'Трансфер',
  [SupplierServiceType.EXCURSION]: 'Экскурсия',
  [SupplierServiceType.FLIGHT]: 'Авиа',
  [SupplierServiceType.INSURANCE]: 'Страхование',
  [SupplierServiceType.VISA]: 'Виза',
  [SupplierServiceType.PACKAGE]: 'Пакет',
  [SupplierServiceType.OTHER]: 'Другое',
};

export const SupplierIntegrationType = {
  MANUAL: 'MANUAL',
  API: 'API',
} as const;
export type SupplierIntegrationType =
  (typeof SupplierIntegrationType)[keyof typeof SupplierIntegrationType];

export const SUPPLIER_EXTERNAL_SYSTEMS = [
  'OSTROVOK',
  'MASTER_TOUR',
  'TRAVELLINE',
  'HOTELS_PRO',
  'BRONEVIK',
] as const;
export type SupplierExternalSystem = (typeof SUPPLIER_EXTERNAL_SYSTEMS)[number];

// ----- Supplier -----

/** OpenAPI: SupplierResponse */
export type SupplierResponse = {
  id: string;
  organizationId: string;
  name: string;
  legalName: string | null;
  supplierCategory: SupplierCategory | (string & Record<never, never>);
  serviceTypes: string[];
  integrationType: SupplierIntegrationType | (string & Record<never, never>);
  externalSystem: string | null;
  destinationNotes: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  legalAddress: string | null;
  unp: string | null;
  iban: string | null;
  bankName: string | null;
  bik: string | null;
  clientId: string | null;
  notes: string | null;
  active: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

/** OpenAPI: CreateSupplierRequest */
export type CreateSupplierRequest = {
  name: string;
  legalName?: string | null;
  supplierCategory: string;
  serviceTypes: string[];
  integrationType: string;
  externalSystem?: string | null;
  destinationNotes?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  legalAddress?: string | null;
  unp?: string | null;
  iban?: string | null;
  bankName?: string | null;
  bik?: string | null;
  clientId?: string | null;
  notes?: string | null;
};

/** OpenAPI: UpdateSupplierRequest — same shape, all optional */
export type UpdateSupplierRequest = Partial<CreateSupplierRequest>;

export type PaginatedSupplierResponse = PaginatedDto<SupplierResponse>;

export type ListSuppliersQuery = {
  page?: number;
  limit?: number;
  category?: string;
  serviceType?: string;
  search?: string;
  isActive?: boolean;
};

// ----- Supplier Contacts -----

/** OpenAPI: SupplierContactResponse */
export type SupplierContactResponse = {
  id: string;
  organizationId: string;
  supplierId: string;
  fullName: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  telegramHandle: string | null;
  primary: boolean;
  createdAt: string;
  updatedAt: string;
};

/** OpenAPI: CreateSupplierContactRequest */
export type CreateSupplierContactRequest = {
  fullName: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramHandle?: string | null;
  isPrimary?: boolean | null;
};

/** OpenAPI: UpdateSupplierContactRequest — same, all optional */
export type UpdateSupplierContactRequest = Partial<CreateSupplierContactRequest>;
