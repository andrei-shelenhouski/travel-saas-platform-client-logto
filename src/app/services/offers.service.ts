import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

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

  // eslint-disable-next-line complexity
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
    let httpParams = new HttpParams();

    if (params?.status !== undefined) {
      const statuses = Array.isArray(params.status)
        ? params.status.filter((value) => Boolean(value))
        : [params.status];

      for (const status of statuses) {
        httpParams = httpParams.append('status', status);
      }
    }

    if (params?.requestId !== undefined) {
      httpParams = httpParams.set('requestId', params.requestId);
    }

    if (params?.leadId !== undefined) {
      httpParams = httpParams.set('leadId', params.leadId);
    }

    if (params?.agentId !== undefined) {
      httpParams = httpParams.set('agentId', params.agentId);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.dateFrom !== undefined) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }

    if (params?.dateTo !== undefined) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    if (params?.search !== undefined) {
      httpParams = httpParams.set('search', params.search);
    }

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
