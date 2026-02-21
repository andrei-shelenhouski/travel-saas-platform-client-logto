import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { CreateBookingDto } from '../shared/models';

const BOOKINGS_URL = `${environment.baseUrl}/api/bookings`;

/**
 * Bookings API (OpenAPI: POST /api/bookings).
 */
@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateBookingDto): Observable<unknown> {
    return this.http.post<unknown>(BOOKINGS_URL, dto);
  }
}
