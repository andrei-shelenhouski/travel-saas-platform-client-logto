import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type { CreateApiKeyRequest, OrganizationApiKey } from '@app/shared/models';

const ORGANIZATION_API_KEYS_URL = `${environment.baseUrl}/api/organization-api-keys`;

@Injectable({ providedIn: 'root' })
export class OrganizationApiKeysService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  list(): Observable<OrganizationApiKey[]> {
    return this.http
      .get<OrganizationApiKey[]>(ORGANIZATION_API_KEYS_URL)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateApiKeyRequest): Observable<OrganizationApiKey> {
    return this.http
      .post<OrganizationApiKey>(ORGANIZATION_API_KEYS_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  revoke(id: string): Observable<void> {
    return this.http
      .delete<void>(`${ORGANIZATION_API_KEYS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }
}
