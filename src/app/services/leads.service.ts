import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  AssignLeadDto,
  CreateLeadDto,
  LeadResponseDto,
  LeadSource,
  LeadStatus,
  PaginatedLeadResponseDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
} from '@app/shared/models';

const LEADS_URL = `${environment.baseUrl}/api/leads`;
const LEADS_STATS_URL = `${environment.baseUrl}/api/leads/stats`;

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  findAll(params?: {
    page?: number;
    limit?: number;
    status?: LeadStatus | string;
    agentId?: string;
    clientType?: string;
    source?: LeadSource;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Observable<PaginatedLeadResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.status !== undefined && params.status !== '') {
      httpParams = httpParams.set('status', params.status);
    }

    if (params?.agentId !== undefined) {
      httpParams = httpParams.set('agentId', params.agentId);
    }

    if (params?.clientType !== undefined) {
      httpParams = httpParams.set('clientType', params.clientType);
    }

    if (params?.source !== undefined) {
      httpParams = httpParams.set('source', params.source);
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

    return this.http.get<PaginatedLeadResponseDto>(LEADS_URL, { params: httpParams });
  }

  getStatistics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(LEADS_STATS_URL);
  }

  findById(id: string): Observable<LeadResponseDto> {
    return this.http.get<LeadResponseDto>(`${LEADS_URL}/${id}`);
  }

  create(dto: CreateLeadDto): Observable<LeadResponseDto> {
    return this.http.post<LeadResponseDto>(LEADS_URL, dto);
  }

  update(id: string, dto: UpdateLeadDto): Observable<LeadResponseDto> {
    return this.http.put<LeadResponseDto>(`${LEADS_URL}/${id}`, dto);
  }

  updateStatus(id: string, dto: UpdateLeadStatusDto): Observable<LeadResponseDto> {
    return this.http.put<LeadResponseDto>(`${LEADS_URL}/${id}/status`, dto);
  }

  assign(id: string, dto: AssignLeadDto): Observable<LeadResponseDto> {
    return this.http.patch<LeadResponseDto>(`${LEADS_URL}/${id}/assign`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${LEADS_URL}/${id}`);
  }

  convertToClient(id: string): Observable<LeadResponseDto> {
    return this.http.post<LeadResponseDto>(`${LEADS_URL}/${id}/convert-to-client`, {});
  }
}
