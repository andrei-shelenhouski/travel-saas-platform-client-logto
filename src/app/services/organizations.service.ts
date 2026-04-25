import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type { CreateOrganizationDto, OrganizationResponseDto } from '@app/shared/models';

const ORGANIZATIONS_URL = `${environment.baseUrl}/api/organizations`;

/**
 * Organizations API (OpenAPI: POST /api/organizations — 201 with OrganizationResponse body).
 * Do not send X-Organization-Id for create (handled by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateOrganizationDto): Observable<OrganizationResponseDto> {
    return this.http.post<OrganizationResponseDto>(ORGANIZATIONS_URL, dto);
  }
}
