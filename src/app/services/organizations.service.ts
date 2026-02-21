import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CreateOrganizationDto,
  CreateOrganizationResponseDto,
} from '../shared/models';

const ORGANIZATIONS_URL = `${environment.baseUrl}/api/organizations`;

/**
 * Organizations API (OpenAPI: POST /api/organizations).
 * Do not send X-Organization-Id for create (handled by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateOrganizationDto): Observable<CreateOrganizationResponseDto> {
    return this.http.post<CreateOrganizationResponseDto>(ORGANIZATIONS_URL, dto);
  }
}
