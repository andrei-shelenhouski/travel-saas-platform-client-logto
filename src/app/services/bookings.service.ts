import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  BookingResponseDto,
  BookingStatus,
  CreateBookingDto,
  PaginatedBookingResponseDto,
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

  // eslint-disable-next-line complexity
  getList(params?: {
    page?: number;
    size?: number;
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

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size);
    }

    if (params?.limit !== undefined && params?.size === undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.status !== undefined) {
      const status = Array.isArray(params.status)
        ? params.status.filter((value) => Boolean(value)).join(',')
        : params.status;

      if (status) {
        httpParams = httpParams.set('status', status);
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

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BOOKINGS_URL}/${id}`);
  }
}
