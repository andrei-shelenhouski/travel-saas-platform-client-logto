import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  CreateOfferDto,
  OfferResponseDto,
  OfferStatus,
  PaginatedOfferResponseDto,
  UpdateOfferDto,
  UpdateOfferStatusDto,
} from '@app/shared/models';

const OFFERS_URL = `${environment.baseUrl}/api/offers`;
const OFFERS_STATS_URL = `${environment.baseUrl}/api/offers/stats`;

@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);

  getList(params?: {
    status?: OfferStatus | OfferStatus[];
    requestId?: string;
    leadId?: string;
    agentId?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Observable<PaginatedOfferResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .appendArray('status', params?.status as string | string[] | undefined)
      .set('requestId', params?.requestId)
      .set('leadId', params?.leadId)
      .set('agentId', params?.agentId)
      .set('page', params?.page)
      .set('limit', params?.limit)
      .set('dateFrom', params?.dateFrom)
      .set('dateTo', params?.dateTo)
      .set('search', params?.search)
      .build();

    return this.http.get<PaginatedOfferResponseDto>(OFFERS_URL, { params: httpParams });
  }

  getById(id: string): Observable<OfferResponseDto> {
    return this.http.get<OfferResponseDto>(`${OFFERS_URL}/${id}`);
  }

  /** GET /api/offers/stats. Returns counts by status. */
  getStatistics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(OFFERS_STATS_URL);
  }

  create(dto: CreateOfferDto): Observable<OfferResponseDto> {
    return this.http.post<OfferResponseDto>(OFFERS_URL, dto);
  }

  /** PUT /api/offers/{id}. */
  update(id: string, dto: UpdateOfferDto): Observable<OfferResponseDto> {
    return this.http.put<OfferResponseDto>(`${OFFERS_URL}/${id}`, dto);
  }

  /** PUT /api/offers/{id}/status. */
  setStatus(id: string, status: UpdateOfferStatusDto['status']): Observable<OfferResponseDto> {
    const body: UpdateOfferStatusDto = { status };

    return this.http.put<OfferResponseDto>(`${OFFERS_URL}/${id}/status`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${OFFERS_URL}/${id}`);
  }

  /** POST /api/offers/{id}/revise. Creates a new draft revision of the offer. */
  revise(id: string): Observable<OfferResponseDto> {
    return this.http.post<OfferResponseDto>(`${OFFERS_URL}/${id}/revise`, {});
  }

  /** GET /api/offers/{id}/pdf. Returns the offer PDF as a Blob. */
  getPdf(id: string): Observable<Blob> {
    return this.http.get(`${OFFERS_URL}/${id}/pdf`, { responseType: 'blob' });
  }
}
