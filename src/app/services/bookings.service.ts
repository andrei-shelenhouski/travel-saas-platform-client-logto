import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
 * Bookings API. Aligned with openapi.json: GET/POST /api/bookings, GET/PATCH/DELETE /api/bookings/{id},
 * GET /api/bookings/stats, PATCH /api/bookings/{id}/status.
 */
@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);

  getList(params?: {
    page?: number;
    limit?: number;
    status?: BookingStatus;
  }): Observable<PaginatedBookingResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.status !== undefined) {
      httpParams = httpParams.set('status', params.status);
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
    return this.http.patch<BookingResponseDto>(`${BOOKINGS_URL}/${id}`, dto);
  }

  /** PATCH /api/bookings/{id}/status. Use for status transitions. */
  updateStatus(id: string, dto: UpdateBookingStatusDto): Observable<BookingResponseDto> {
    return this.http.patch<BookingResponseDto>(`${BOOKINGS_URL}/${id}/status`, dto);
  }

  delete(id: string): Observable<BookingResponseDto> {
    return this.http.delete<BookingResponseDto>(`${BOOKINGS_URL}/${id}`);
  }
}
