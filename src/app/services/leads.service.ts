import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CreateLeadDto,
  LeadResponseDto,
  UpdateLeadStatusDto,
} from '../shared/models';

const LEADS_URL = `${environment.baseUrl}/api/leads`;

/**
 * Leads API. All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<LeadResponseDto[]> {
    return this.http.get<LeadResponseDto[]>(LEADS_URL);
  }

  findById(id: string): Observable<LeadResponseDto> {
    return this.http.get<LeadResponseDto>(`${LEADS_URL}/${id}`);
  }

  create(dto: CreateLeadDto): Observable<LeadResponseDto> {
    return this.http.post<LeadResponseDto>(LEADS_URL, dto);
  }

  updateStatus(id: string, dto: UpdateLeadStatusDto): Observable<LeadResponseDto> {
    return this.http.patch<LeadResponseDto>(`${LEADS_URL}/${id}/status`, dto);
  }
}
