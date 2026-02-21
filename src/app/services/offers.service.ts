import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { CreateOfferDto } from '../shared/models';

const OFFERS_URL = `${environment.baseUrl}/api/offers`;

/**
 * Offers API (OpenAPI: POST /api/offers).
 */
@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);

  create(dto: CreateOfferDto): Observable<unknown> {
    return this.http.post<unknown>(OFFERS_URL, dto);
  }
}
