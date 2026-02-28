import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CreateRequestDto,
  PaginatedRequestResponseDto,
  RequestResponseDto,
  UpdateRequestDto,
  UpdateRequestStatusDto,
} from '../shared/models';

const REQUESTS_URL = `${environment.baseUrl}/api/requests`;

/**
 * Requests API. Aligned with openapi.json: GET/POST /api/requests,
 * GET/PATCH/DELETE /api/requests/{id}, PATCH /api/requests/{id}/status.
 */
@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly http = inject(HttpClient);

  /** GET /api/requests. OpenAPI: no clientId filter; filter client-side if needed. */
  getList(params?: { page?: number; limit?: number }): Observable<PaginatedRequestResponseDto> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedRequestResponseDto>(REQUESTS_URL, { params: httpParams });
  }

  getById(id: string): Observable<RequestResponseDto> {
    return this.http.get<RequestResponseDto>(`${REQUESTS_URL}/${id}`);
  }

  create(dto: CreateRequestDto): Observable<RequestResponseDto> {
    return this.http.post<RequestResponseDto>(REQUESTS_URL, dto);
  }

  update(id: string, dto: UpdateRequestDto): Observable<RequestResponseDto> {
    return this.http.patch<RequestResponseDto>(`${REQUESTS_URL}/${id}`, dto);
  }

  updateStatus(
    id: string,
    dto: UpdateRequestStatusDto
  ): Observable<RequestResponseDto> {
    return this.http.patch<RequestResponseDto>(
      `${REQUESTS_URL}/${id}/status`,
      dto
    );
  }

  delete(id: string): Observable<RequestResponseDto> {
    return this.http.delete<RequestResponseDto>(`${REQUESTS_URL}/${id}`);
  }
}
