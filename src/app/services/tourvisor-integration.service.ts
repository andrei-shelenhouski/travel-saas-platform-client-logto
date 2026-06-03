import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  TourvisorIntegrationSettingsResponseDto,
  TourvisorIntegrationTestResponseDto,
  UpdateTourvisorIntegrationSettingsDto,
} from '@app/shared/models';

const TOURVISOR_INTEGRATION_URL = `${environment.baseUrl}/api/settings/integrations/tourvisor`;

@Injectable({ providedIn: 'root' })
export class TourvisorIntegrationService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  getSettings(): Observable<TourvisorIntegrationSettingsResponseDto> {
    return this.http
      .get<TourvisorIntegrationSettingsResponseDto>(TOURVISOR_INTEGRATION_URL)
      .pipe(this.errorHandler.catch());
  }

  upsertSettings(
    dto: UpdateTourvisorIntegrationSettingsDto,
  ): Observable<TourvisorIntegrationSettingsResponseDto> {
    return this.http
      .put<TourvisorIntegrationSettingsResponseDto>(TOURVISOR_INTEGRATION_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(TOURVISOR_INTEGRATION_URL).pipe(this.errorHandler.catch());
  }

  testConnection(): Observable<TourvisorIntegrationTestResponseDto> {
    return this.http
      .post<TourvisorIntegrationTestResponseDto>(`${TOURVISOR_INTEGRATION_URL}/test`, {})
      .pipe(this.errorHandler.catch());
  }

  syncNow(): Observable<void> {
    return this.http
      .post<void>(`${TOURVISOR_INTEGRATION_URL}/sync`, {})
      .pipe(this.errorHandler.catch());
  }
}
