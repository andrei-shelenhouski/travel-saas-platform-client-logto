import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  BookingDocumentResponseDto,
  BookingResponseDto,
  BookingStatus,
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
  }): Observable<PaginatedBookingResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.status !== undefined) {
      const statuses = Array.isArray(params.status)
        ? params.status.filter((value) => Boolean(value))
        : [params.status];

      for (const status of statuses) {
        httpParams = httpParams.append('status', status);
      }
    }

    if (params?.offerId !== undefined) {
      httpParams = httpParams.set('offerId', params.offerId);
    }

    if (params?.assignedBackofficeId !== undefined) {
      httpParams = httpParams.set('assignedBackofficeId', params.assignedBackofficeId);
    }

    if (params?.departDateFrom !== undefined) {
      httpParams = httpParams.set('departDateFrom', params.departDateFrom);
    }

    if (params?.departDateTo !== undefined) {
      httpParams = httpParams.set('departDateTo', params.departDateTo);
    }

    return this.http.get<PaginatedBookingResponseDto>(BOOKINGS_URL, { params: httpParams });
  }

  getById(id: string): Observable<BookingResponseDto> {
    return this.http.get<BookingResponseDto>(`${BOOKINGS_URL}/${id}`);
  }

  /** GET /api/bookings/stats. Returns counts by status (PENDING, CONFIRMED, PAID, CANCELLED per OpenAPI). */
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
    let httpParams = new HttpParams();

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    httpParams = httpParams.set('page', page);
    httpParams = httpParams.set('limit', limit);

    return this.http.get<PaginatedInvoiceResponseDto>(`${BOOKINGS_URL}/${id}/invoices`, {
      params: httpParams,
    });
  }

  /** GET /api/bookings/{id}/documents. */
  listDocuments(id: string): Observable<BookingDocumentResponseDto[]> {
    return this.http.get<BookingDocumentResponseDto[]>(`${BOOKINGS_URL}/${id}/documents`);
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
