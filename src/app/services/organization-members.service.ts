import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  OrganizationMemberResponseDto,
  UpdateOrganizationMemberRoleDto,
} from '../shared/models';

const MEMBERS_URL = `${environment.baseUrl}/api/organization-members`;

/**
 * Organization members API. Requires ADMIN (MANAGE_USERS).
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class OrganizationMembersService {
  private readonly http = inject(HttpClient);

  /** GET /api/organization-members. List all active members with roles. */
  findAll(): Observable<OrganizationMemberResponseDto[]> {
    return this.http.get<OrganizationMemberResponseDto[]>(MEMBERS_URL);
  }

  /** PATCH /api/organization-members/{id}/role. Update a member's role (id = organizationMember id). */
  updateRole(id: string, dto: UpdateOrganizationMemberRoleDto): Observable<OrganizationMemberResponseDto> {
    return this.http.patch<OrganizationMemberResponseDto>(`${MEMBERS_URL}/${id}/role`, dto);
  }
}
