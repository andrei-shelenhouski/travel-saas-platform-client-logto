import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CreateLeadDto,
  LeadResponseDto,
  PaginatedLeadResponseDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
} from '../shared/models';
import type { ConvertLeadToClientResponseDto } from '../shared/models';

const LEADS_URL = `${environment.baseUrl}/api/leads`;

/**
 * Leads API. Aligned with openapi.json: GET/POST /api/leads, GET/PATCH/DELETE /api/leads/{id},
 * PATCH /api/leads/{id}/status, POST /api/leads/{id}/convert-to-client.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  findAll(params?: { page?: number; limit?: number }): Observable<PaginatedLeadResponseDto> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedLeadResponseDto>(LEADS_URL, { params: httpParams });
  }

  findById(id: string): Observable<LeadResponseDto> {
    return this.http.get<LeadResponseDto>(`${LEADS_URL}/${id}`);
  }

  create(dto: CreateLeadDto): Observable<LeadResponseDto> {
    return this.http.post<LeadResponseDto>(LEADS_URL, dto);
  }

  update(id: string, dto: UpdateLeadDto): Observable<LeadResponseDto> {
    return this.http.patch<LeadResponseDto>(`${LEADS_URL}/${id}`, dto);
  }

  updateStatus(id: string, dto: UpdateLeadStatusDto): Observable<LeadResponseDto> {
    return this.http.patch<LeadResponseDto>(`${LEADS_URL}/${id}/status`, dto);
  }

  delete(id: string): Observable<LeadResponseDto> {
    return this.http.delete<LeadResponseDto>(`${LEADS_URL}/${id}`);
  }

  /** Convert lead to client. POST /api/leads/{id}/convert-to-client. Returns created client and updated lead. */
  convertToClient(id: string): Observable<ConvertLeadToClientResponseDto> {
    return this.http.post<ConvertLeadToClientResponseDto>(`${LEADS_URL}/${id}/convert-to-client`, {});
  }
}
