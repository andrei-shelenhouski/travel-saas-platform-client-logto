import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  ActivityListResponseDto,
  AssignLeadDto,
  CreateLeadDto,
  DeleteLeadResponseDto,
  LeadResponseDto,
  LeadSource,
  LeadStatus,
  LinkLeadClientDto,
  PaginatedLeadResponseDto,
  PromoteLeadToClientDto,
  PromoteLeadToClientResponseDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
} from '@app/shared/models';

const LEADS_URL = `${environment.baseUrl}/api/leads`;
const LEADS_STATS_URL = `${environment.baseUrl}/api/leads/stats`;

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  getList(params?: {
    page?: number;
    limit?: number;
    status?: LeadStatus | LeadStatus[];
    agentId?: string;
    clientType?: string;
    source?: LeadSource | string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    includeDeleted?: boolean;
  }): Observable<PaginatedLeadResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .appendArray('status', params?.status as string | string[] | undefined)
      .set('agentId', params?.agentId)
      .set('clientType', params?.clientType)
      .set('source', params?.source)
      .set('dateFrom', params?.dateFrom)
      .set('dateTo', params?.dateTo)
      .set('search', params?.search)
      .set('includeDeleted', params?.includeDeleted === true ? 'true' : null)
      .build();

    return this.http.get<PaginatedLeadResponseDto>(LEADS_URL, { params: httpParams });
  }

  getStatistics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(LEADS_STATS_URL);
  }

  getById(id: string): Observable<LeadResponseDto> {
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

  softDelete(id: string): Observable<DeleteLeadResponseDto> {
    return this.http.delete<DeleteLeadResponseDto>(`${LEADS_URL}/${id}`);
  }

  convertToClient(id: string): Observable<LeadResponseDto> {
    return this.http.post<LeadResponseDto>(`${LEADS_URL}/${id}/convert-to-client`, {});
  }

  linkClient(id: string, dto: LinkLeadClientDto): Observable<LeadResponseDto> {
    return this.http.patch<LeadResponseDto>(`${LEADS_URL}/${id}/client`, dto);
  }

  promoteToClient(
    id: string,
    dto: PromoteLeadToClientDto,
  ): Observable<PromoteLeadToClientResponseDto> {
    return this.http.post<PromoteLeadToClientResponseDto>(`${LEADS_URL}/${id}/promote-client`, dto);
  }

  /** GET /api/leads/{id}/activity. Returns paginated activity history for this lead. */
  getActivity(
    id: string,
    params?: { page?: number; limit?: number },
  ): Observable<ActivityListResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http.get<ActivityListResponseDto>(`${LEADS_URL}/${id}/activity`, {
      params: httpParams,
    });
  }
}
