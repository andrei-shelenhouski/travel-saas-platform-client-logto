import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  BookingResponseDto,
  BookingStatus,
  CreateBookingDto,
  PaginatedBookingResponseDto,
  UpdateBookingDto,
} from '../shared/models';

const BOOKINGS_URL = `${environment.baseUrl}/api/bookings`;

/**
 * Bookings API. Aligned with openapi.json: GET/POST /api/bookings, GET/PATCH/DELETE /api/bookings/{id}.
 */
@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);

  getList(params?: { page?: number; limit?: number; status?: BookingStatus }): Observable<PaginatedBookingResponseDto> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status != null) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedBookingResponseDto>(BOOKINGS_URL, { params: httpParams });
  }

  getById(id: string): Observable<BookingResponseDto> {
    return this.http.get<BookingResponseDto>(`${BOOKINGS_URL}/${id}`);
  }

  create(dto: CreateBookingDto): Observable<BookingResponseDto> {
    return this.http.post<BookingResponseDto>(BOOKINGS_URL, dto);
  }

  update(id: string, dto: UpdateBookingDto): Observable<BookingResponseDto> {
    return this.http.patch<BookingResponseDto>(`${BOOKINGS_URL}/${id}`, dto);
  }

  delete(id: string): Observable<BookingResponseDto> {
    return this.http.delete<BookingResponseDto>(`${BOOKINGS_URL}/${id}`);
  }
}
