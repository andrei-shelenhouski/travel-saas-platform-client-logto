/**
 * Offer domain types aligned with OpenAPI spec.
 */

import type { PaginatedDto } from './common.model';
import type { BookingStatus } from './booking.model';
import type { RequestStatus } from './organization.model';

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
  nights?: number;
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
  status: OfferStatus;
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
  status?: RequestStatus;
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
  status?: OfferStatus;
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
  status?: BookingStatus;
  totalPrice?: number;
  currency?: string;
  createdAt?: string;
};

export type PaginatedBookingSummaryDto = PaginatedDto<BookingSummaryDto>;

// ----- Status option constants -----

export type OfferStatusOption = { value: OfferStatus; label: string };

export const OFFER_STATUS_OPTIONS: OfferStatusOption[] = [
  { value: OfferStatus.DRAFT, label: 'Черновик' },
  { value: OfferStatus.SENT, label: 'Отправлено' },
  { value: OfferStatus.VIEWED, label: 'Просмотрено' },
  { value: OfferStatus.ACCEPTED, label: 'Принято' },
  { value: OfferStatus.REJECTED, label: 'Отклонено' },
  { value: OfferStatus.EXPIRED, label: 'Истекло' },
];
