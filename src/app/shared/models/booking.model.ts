/**
 * Booking domain types aligned with OpenAPI spec.
 */

import type { PaginatedDto } from './common.model';

/** OpenAPI: BookingAccommodationDto. Accommodation in booking requests and responses. */
export type BookingAccommodationDto = {
  hotelName?: string;
  roomType?: string;
  mealPlan?: string;
  checkinDate?: string;
  checkoutDate?: string;
  nights?: number;
  total?: number;
};

/** OpenAPI: BookingServiceSnapshotEntry. Additional services in BookingResponse. */
export type BookingServiceSnapshotEntryDto = {
  serviceType?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

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
  accommodationDetails?: BookingAccommodationDto[];
  assignedBackofficeId?: string;
  internalNotes?: string;
};

/** OpenAPI: UpdateBookingRequest. PUT /api/bookings/{id}. */
export type UpdateBookingDto = {
  supplierConfirmationNumber?: string;
  internalNotes?: string;
  assignedBackofficeId?: string;
  accommodationDetails?: BookingAccommodationDto[];
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

/** OpenAPI: ExpiryWarning. Document expiry hint on a traveler. */
export type ExpiryWarningDto = {
  documentType?: string;
  expiryDate?: string;
  message?: string;
};

/** OpenAPI: BookingTravelerResponse. */
export type BookingTravelerResponseDto = {
  id: string;
  personId: string;
  role: 'LEAD' | 'COMPANION' | (string & Record<never, never>);
  documentId?: string;
  personSnapshot?: Record<string, unknown>;
  createdAt?: string;
  expiryWarnings?: ExpiryWarningDto[];
};

/** OpenAPI: TravelerEntry. */
export type TravelerEntryDto = {
  personId: string;
  role: 'LEAD' | 'COMPANION' | (string & Record<never, never>);
  documentId?: string;
};

/** OpenAPI: AddBookingTravelerRequest. POST /api/bookings/:id/travelers body. */
export type AddBookingTravelerRequestDto = {
  travelers: TravelerEntryDto[];
};

/** OpenAPI: BookingExpiringDocumentHint. */
export type BookingExpiringDocumentHintDto = {
  personShortName?: string;
  documentLabel?: string;
  expiryDate?: string;
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
  offerId?: string;
  leadId?: string;
  clientId: string;
  clientSnapshot?: Record<string, unknown>;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  currency?: string;
  adults?: number;
  children?: number;
  accommodationDetails?: BookingAccommodationDto[];
  servicesSnapshot?: BookingServiceSnapshotEntryDto[];
  supplierConfirmationNumber?: string;
  assignedBackofficeId?: string;
  assignedBackofficeName?: string;
  status: BookingStatus;
  cancellationReason?: string;
  internalNotes?: string;
  invoicesCount?: number;
  documentsCount?: number;
  hasExpiringDocuments?: boolean;
  expiringDocuments?: BookingExpiringDocumentHintDto[];
  travelers?: string;
  bookingTravelers?: BookingTravelerResponseDto[];
  clientPersonId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedBookingResponseDto = PaginatedDto<BookingResponseDto>;

// ----- Status option constants -----

export type BookingStatusOption = { value: BookingStatus; label: string };

export const BOOKING_STATUS_OPTIONS: BookingStatusOption[] = [
  { value: BookingStatus.PENDING_CONFIRMATION, label: 'Ожидает подтверждения' },
  { value: BookingStatus.CONFIRMED, label: 'Подтверждено' },
  { value: BookingStatus.IN_PROGRESS, label: 'В поездке' },
  { value: BookingStatus.COMPLETED, label: 'Завершено' },
  { value: BookingStatus.CANCELLED, label: 'Отменено' },
];
