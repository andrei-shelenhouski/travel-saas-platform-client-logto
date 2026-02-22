import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CreateOfferDto,
  OfferResponseDto,
  OfferStatus,
  UpdateOfferDto,
  UpdateOfferStatusDto,
} from '../shared/models';

const OFFERS_URL = `${environment.baseUrl}/api/offers`;

/**
 * Offers API. All methods require Authorization + X-Organization-Id (interceptor).
 * Aligned with openapi.json: GET/POST /api/offers, GET/PATCH/DELETE /api/offers/{id}, PATCH /api/offers/{id}/status.
 */
@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);

  getList(status?: OfferStatus): Observable<OfferResponseDto[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<OfferResponseDto[]>(OFFERS_URL, { params });
  }

  getById(id: string): Observable<OfferResponseDto> {
    return this.http.get<OfferResponseDto>(`${OFFERS_URL}/${id}`);
  }

  create(dto: CreateOfferDto): Observable<OfferResponseDto> {
    return this.http.post<OfferResponseDto>(OFFERS_URL, dto);
  }

  update(id: string, dto: UpdateOfferDto): Observable<OfferResponseDto> {
    return this.http.patch<OfferResponseDto>(`${OFFERS_URL}/${id}`, dto);
  }

  /** Transition offer status. PATCH /api/offers/{id}/status with UpdateOfferStatusDto. */
  setStatus(
    id: string,
    status: OfferStatus
  ): Observable<OfferResponseDto> {
    const body: UpdateOfferStatusDto = {
      status: status as UpdateOfferStatusDto['status'],
    };
    return this.http.patch<OfferResponseDto>(
      `${OFFERS_URL}/${id}/status`,
      body
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${OFFERS_URL}/${id}`);
  }

  /** Duplicate an offer. POST /api/offers with CreateOfferDto { duplicateFromId }. */
  duplicate(offerId: string): Observable<OfferResponseDto> {
    return this.http.post<OfferResponseDto>(OFFERS_URL, {
      duplicateFromId: offerId,
    } as CreateOfferDto);
  }
}
