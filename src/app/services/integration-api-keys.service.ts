import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  CreateIntegrationApiKeyRequestDto,
  IntegrationApiKeyCreateResponseDto,
  IntegrationApiKeyResponseDto,
  UpdateIntegrationApiKeyRequestDto,
} from '@app/shared/models/organization.model';

const INTEGRATION_API_KEYS_URL = `${environment.baseUrl}/api/settings/integrations/api-keys`;

@Injectable({ providedIn: 'root' })
export class IntegrationApiKeysService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  list(): Observable<IntegrationApiKeyResponseDto[]> {
    return this.http
      .get<IntegrationApiKeyResponseDto[]>(INTEGRATION_API_KEYS_URL)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateIntegrationApiKeyRequestDto): Observable<IntegrationApiKeyCreateResponseDto> {
    return this.http
      .post<IntegrationApiKeyCreateResponseDto>(INTEGRATION_API_KEYS_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  update(
    id: string,
    dto: UpdateIntegrationApiKeyRequestDto,
  ): Observable<IntegrationApiKeyResponseDto> {
    return this.http
      .put<IntegrationApiKeyResponseDto>(`${INTEGRATION_API_KEYS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  revoke(id: string): Observable<void> {
    return this.http
      .delete<void>(`${INTEGRATION_API_KEYS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }
}
