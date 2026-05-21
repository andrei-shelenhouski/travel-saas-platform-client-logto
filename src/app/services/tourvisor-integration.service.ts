import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  TourvisorIntegrationSettingsResponseDto,
  TourvisorIntegrationTestResponseDto,
  UpdateTourvisorIntegrationSettingsDto,
} from '@app/shared/models';

const TOURVISOR_INTEGRATION_URL = `${environment.baseUrl}/api/settings/integrations/tourvisor`;

@Injectable({ providedIn: 'root' })
export class TourvisorIntegrationService {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<TourvisorIntegrationSettingsResponseDto> {
    return this.http.get<TourvisorIntegrationSettingsResponseDto>(TOURVISOR_INTEGRATION_URL);
  }

  upsertSettings(
    dto: UpdateTourvisorIntegrationSettingsDto,
  ): Observable<TourvisorIntegrationSettingsResponseDto> {
    return this.http.put<TourvisorIntegrationSettingsResponseDto>(TOURVISOR_INTEGRATION_URL, dto);
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(TOURVISOR_INTEGRATION_URL);
  }

  testConnection(): Observable<TourvisorIntegrationTestResponseDto> {
    return this.http.post<TourvisorIntegrationTestResponseDto>(
      `${TOURVISOR_INTEGRATION_URL}/test`,
      {},
    );
  }

  syncNow(): Observable<void> {
    return this.http.post<void>(`${TOURVISOR_INTEGRATION_URL}/sync`, {});
  }
}
