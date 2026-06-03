import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  CreateRequestDto,
  OfferResponseDto,
  PaginatedRequestResponseDto,
  RequestResponseDto,
  UpdateRequestDto,
} from '@app/shared/models';

const REQUESTS_URL = `${environment.baseUrl}/api/requests`;
const REQUESTS_STATS_URL = `${environment.baseUrl}/api/requests/stats`;

/**
 * Requests API. Aligned with openapi.json: GET/POST /api/requests,
 * GET/PUT/DELETE /api/requests/{id}, GET /api/requests/stats.
 */
@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  /** GET /api/requests. Optional filters: leadId, managerId. */
  getList(params?: {
    page?: number;
    limit?: number;
    leadId?: string;
    managerId?: string;
  }): Observable<PaginatedRequestResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .set('leadId', params?.leadId)
      .set('managerId', params?.managerId)
      .build();

    return this.http
      .get<PaginatedRequestResponseDto>(REQUESTS_URL, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  /** GET /api/requests/stats. Returns counts by status. */
  getStatistics(): Observable<Record<string, number>> {
    return this.http
      .get<Record<string, number>>(REQUESTS_STATS_URL)
      .pipe(this.errorHandler.catch());
  }

  getById(id: string): Observable<RequestResponseDto> {
    return this.http
      .get<RequestResponseDto>(`${REQUESTS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateRequestDto): Observable<RequestResponseDto> {
    return this.http.post<RequestResponseDto>(REQUESTS_URL, dto).pipe(this.errorHandler.catch());
  }

  update(id: string, dto: UpdateRequestDto): Observable<RequestResponseDto> {
    return this.http
      .put<RequestResponseDto>(`${REQUESTS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${REQUESTS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  /** GET /api/requests/{id}/offers. Returns all offers linked to this travel request. */
  getOffers(requestId: string): Observable<OfferResponseDto[]> {
    return this.http
      .get<OfferResponseDto[]>(`${REQUESTS_URL}/${requestId}/offers`)
      .pipe(this.errorHandler.catch());
  }
}
