import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';
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
  private readonly errorHandler = inject(ApiErrorHandlerService);

  getList(params?: {
    status?: OfferStatus | OfferStatus[];
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
      .set('leadId', params?.leadId)
      .set('agentId', params?.agentId)
      .set('page', params?.page)
      .set('limit', params?.limit)
      .set('dateFrom', params?.dateFrom)
      .set('dateTo', params?.dateTo)
      .set('search', params?.search)
      .build();

    return this.http
      .get<PaginatedOfferResponseDto>(OFFERS_URL, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  getById(id: string): Observable<OfferResponseDto> {
    return this.http.get<OfferResponseDto>(`${OFFERS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  /** GET /api/offers/stats. Returns counts by status. */
  getStatistics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(OFFERS_STATS_URL).pipe(this.errorHandler.catch());
  }

  create(dto: CreateOfferDto): Observable<OfferResponseDto> {
    return this.http.post<OfferResponseDto>(OFFERS_URL, dto).pipe(this.errorHandler.catch());
  }

  /** PUT /api/offers/{id}. */
  update(id: string, dto: UpdateOfferDto): Observable<OfferResponseDto> {
    return this.http
      .put<OfferResponseDto>(`${OFFERS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  /** PUT /api/offers/{id}/status. */
  setStatus(id: string, status: UpdateOfferStatusDto['status']): Observable<OfferResponseDto> {
    const body: UpdateOfferStatusDto = { status };

    return this.http
      .put<OfferResponseDto>(`${OFFERS_URL}/${id}/status`, body)
      .pipe(this.errorHandler.catch());
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${OFFERS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  /** POST /api/offers/{id}/revise. Creates a new draft revision of the offer. */
  revise(id: string): Observable<OfferResponseDto> {
    return this.http
      .post<OfferResponseDto>(`${OFFERS_URL}/${id}/revise`, {})
      .pipe(this.errorHandler.catch());
  }

  /** GET /api/offers/{id}/pdf. Returns the offer PDF as a Blob. */
  getPdf(id: string): Observable<Blob> {
    return this.http
      .get(`${OFFERS_URL}/${id}/pdf`, { responseType: 'blob' })
      .pipe(this.errorHandler.catch());
  }
}
