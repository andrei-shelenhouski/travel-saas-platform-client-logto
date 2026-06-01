import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  AddBookingTravelerRequestDto,
  BookingDocumentResponseDto,
  BookingResponseDto,
  BookingStatus,
  BookingTravelerResponseDto,
  CreateBookingDto,
  PaginatedBookingResponseDto,
  PaginatedInvoiceResponseDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from '@app/shared/models';

const BOOKINGS_URL = `${environment.baseUrl}/api/bookings`;

const BOOKINGS_STATS_URL = `${environment.baseUrl}/api/bookings/stats`;

/**
 * Bookings API. Aligned with openapi.json: GET/POST /api/bookings, GET/PUT/DELETE /api/bookings/{id},
 * GET /api/bookings/stats, PUT /api/bookings/{id}/status.
 */
@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);

  getList(params?: {
    page?: number;
    limit?: number;
    status?: BookingStatus | BookingStatus[];
    offerId?: string;
    assignedBackofficeId?: string;
    departDateFrom?: string;
    departDateTo?: string;
    travelerPersonId?: string;
  }): Observable<PaginatedBookingResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .appendArray('status', params?.status as string | string[] | undefined)
      .set('offerId', params?.offerId)
      .set('assignedBackofficeId', params?.assignedBackofficeId)
      .set('departDateFrom', params?.departDateFrom)
      .set('departDateTo', params?.departDateTo)
      .set('traveler_person_id', params?.travelerPersonId)
      .build();

    return this.http.get<PaginatedBookingResponseDto>(BOOKINGS_URL, { params: httpParams });
  }

  getById(id: string): Observable<BookingResponseDto> {
    return this.http.get<BookingResponseDto>(`${BOOKINGS_URL}/${id}`);
  }

  /** GET /api/bookings/stats. Returns counts by status (PENDING_CONFIRMATION, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED per OpenAPI). */
  getStatistics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(BOOKINGS_STATS_URL);
  }

  create(dto: CreateBookingDto): Observable<BookingResponseDto> {
    return this.http.post<BookingResponseDto>(BOOKINGS_URL, dto);
  }

  update(id: string, dto: UpdateBookingDto): Observable<BookingResponseDto> {
    return this.http.put<BookingResponseDto>(`${BOOKINGS_URL}/${id}`, dto);
  }

  /** PUT /api/bookings/{id}/status. Use for status transitions. */
  updateStatus(id: string, dto: UpdateBookingStatusDto): Observable<BookingResponseDto> {
    return this.http.put<BookingResponseDto>(`${BOOKINGS_URL}/${id}/status`, dto);
  }

  /** GET /api/bookings/{id}/invoices. Returns paginated invoices list. */
  listInvoices(
    id: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedInvoiceResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page ?? 1)
      .set('limit', params?.limit ?? 20)
      .build();

    return this.http.get<PaginatedInvoiceResponseDto>(`${BOOKINGS_URL}/${id}/invoices`, {
      params: httpParams,
    });
  }

  /** GET /api/bookings/{id}/documents. */
  listDocuments(id: string): Observable<BookingDocumentResponseDto[]> {
    return this.http.get<BookingDocumentResponseDto[]>(`${BOOKINGS_URL}/${id}/documents`);
  }

  /** GET /api/bookings/{id}/travelers. */
  listTravelers(id: string): Observable<BookingTravelerResponseDto[]> {
    return this.http.get<BookingTravelerResponseDto[]>(`${BOOKINGS_URL}/${id}/travelers`);
  }

  /** POST /api/bookings/{id}/travelers. */
  addTravelers(
    id: string,
    dto: AddBookingTravelerRequestDto,
  ): Observable<BookingTravelerResponseDto[]> {
    return this.http.post<BookingTravelerResponseDto[]>(`${BOOKINGS_URL}/${id}/travelers`, dto);
  }

  /** DELETE /api/bookings/{id}/travelers/{travelerId}. */
  removeTraveler(id: string, travelerId: string): Observable<void> {
    return this.http.delete<void>(`${BOOKINGS_URL}/${id}/travelers/${travelerId}`);
  }

  /** POST /api/bookings/{id}/documents. */
  uploadDocument(id: string, file: File): Observable<BookingDocumentResponseDto> {
    const formData = new FormData();

    formData.set('file', file);

    return this.http.post<BookingDocumentResponseDto>(`${BOOKINGS_URL}/${id}/documents`, formData);
  }

  /** DELETE /api/bookings/{id}/documents/{docId}. */
  deleteDocument(id: string, docId: string): Observable<void> {
    return this.http.delete<void>(`${BOOKINGS_URL}/${id}/documents/${docId}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BOOKINGS_URL}/${id}`);
  }
}
