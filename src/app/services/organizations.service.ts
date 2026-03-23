import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import type { CreateOrganizationDto } from '@app/shared/models';

const ORGANIZATIONS_URL = `${environment.baseUrl}/api/organizations`;

/**
 * Organizations API (OpenAPI: POST /api/organizations — 201 with no response body).
 * Do not send X-Organization-Id for create (handled by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateOrganizationDto): Observable<void> {
    return this.http.post<void>(ORGANIZATIONS_URL, dto);
  }
}
