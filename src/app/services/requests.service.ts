import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  CreateRequestDto,
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

  /** GET /api/requests. Optional filters: leadId, managerId. */
  getList(params?: {
    page?: number;
    limit?: number;
    leadId?: string;
    managerId?: string;
  }): Observable<PaginatedRequestResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.leadId !== undefined) {
      httpParams = httpParams.set('leadId', params.leadId);
    }

    if (params?.managerId !== undefined) {
      httpParams = httpParams.set('managerId', params.managerId);
    }

    return this.http.get<PaginatedRequestResponseDto>(REQUESTS_URL, { params: httpParams });
  }

  /** GET /api/requests/stats. Returns counts by status. */
  getStatistics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(REQUESTS_STATS_URL);
  }

  getById(id: string): Observable<RequestResponseDto> {
    return this.http.get<RequestResponseDto>(`${REQUESTS_URL}/${id}`);
  }

  create(dto: CreateRequestDto): Observable<RequestResponseDto> {
    return this.http.post<RequestResponseDto>(REQUESTS_URL, dto);
  }

  update(id: string, dto: UpdateRequestDto): Observable<RequestResponseDto> {
    return this.http.put<RequestResponseDto>(`${REQUESTS_URL}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${REQUESTS_URL}/${id}`);
  }
}
