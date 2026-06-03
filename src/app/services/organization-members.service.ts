import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';
import type {
  AddOrganizationMemberDto,
  OrganizationMemberResponseDto,
  UpdateOrganizationMemberRoleDto,
} from '@app/shared/models';

const MEMBERS_URL = `${environment.baseUrl}/api/organization-members`;

/**
 * Organization members API. Requires ADMIN (MANAGE_USERS).
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class OrganizationMembersService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  /** GET /api/organization-members. List all active members with roles. */
  findAll(): Observable<OrganizationMemberResponseDto[]> {
    return this.http
      .get<OrganizationMemberResponseDto[]>(MEMBERS_URL)
      .pipe(this.errorHandler.catch());
  }

  /** POST /api/organization-members. Add existing user to organization by email. */
  addMember(dto: AddOrganizationMemberDto): Observable<OrganizationMemberResponseDto> {
    return this.http
      .post<OrganizationMemberResponseDto>(MEMBERS_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  /** PATCH /api/organization-members/{id}/role. Update a member's role (id = organizationMember id). */
  updateRole(
    id: string,
    dto: UpdateOrganizationMemberRoleDto,
  ): Observable<OrganizationMemberResponseDto> {
    return this.http
      .patch<OrganizationMemberResponseDto>(`${MEMBERS_URL}/${id}/role`, dto)
      .pipe(this.errorHandler.catch());
  }
}
