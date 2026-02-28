import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  BookingResponseDto,
  CreateOfferDto,
  OfferResponseDto,
  OfferStatus,
  PaginatedOfferResponseDto,
  UpdateOfferDto,
  UpdateOfferStatusDto,
} from '../shared/models';

const OFFERS_URL = `${environment.baseUrl}/api/offers`;

/**
 * Offers API. All methods require Authorization + X-Organization-Id (interceptor).
 * Aligned with openapi.json: GET/POST /api/offers, GET/PATCH/DELETE /api/offers/{id},
 * PATCH /api/offers/{id}/status, POST /api/offers/{id}/convert-to-booking.
 */
@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);

  getList(params?: { status?: OfferStatus; page?: number; limit?: number }): Observable<PaginatedOfferResponseDto> {
    let httpParams = new HttpParams();
    if (params?.status != null) httpParams = httpParams.set('status', params.status);
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedOfferResponseDto>(OFFERS_URL, { params: httpParams });
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

  delete(id: string): Observable<OfferResponseDto> {
    return this.http.delete<OfferResponseDto>(`${OFFERS_URL}/${id}`);
  }

  /** Duplicate an offer. POST /api/offers with CreateOfferDto { duplicateFromId }. */
  duplicate(offerId: string): Observable<OfferResponseDto> {
    return this.http.post<OfferResponseDto>(OFFERS_URL, {
      duplicateFromId: offerId,
    } as CreateOfferDto);
  }

  /** Convert offer to booking. POST /api/offers/{id}/convert-to-booking. Returns created booking. */
  convertToBooking(offerId: string): Observable<BookingResponseDto> {
    return this.http.post<BookingResponseDto>(`${OFFERS_URL}/${offerId}/convert-to-booking`, {});
  }
}
