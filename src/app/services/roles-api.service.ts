import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  CreateRoleRequestDto,
  PermissionGroupResponseDto,
  ReplacePermissionsRequestDto,
  RoleDetailResponseDto,
  RoleSummaryResponseDto,
  UpdateRoleRequestDto,
} from '@app/shared/models';

const ROLES_URL = `${environment.baseUrl}/api/roles`;
const PERMISSIONS_URL = `${environment.baseUrl}/api/permissions`;

/**
 * Roles and permissions API.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private readonly http = inject(HttpClient);

  /** GET /api/roles. */
  listRoles(): Observable<RoleSummaryResponseDto[]> {
    return this.http.get<RoleSummaryResponseDto[]>(ROLES_URL);
  }

  /** GET /api/roles/{id}. */
  getRole(id: string): Observable<RoleDetailResponseDto> {
    return this.http.get<RoleDetailResponseDto>(`${ROLES_URL}/${id}`);
  }

  /** POST /api/roles. */
  createRole(dto: CreateRoleRequestDto): Observable<RoleDetailResponseDto> {
    return this.http.post<RoleDetailResponseDto>(ROLES_URL, dto);
  }

  /** PUT /api/roles/{id}. */
  updateRole(id: string, dto: UpdateRoleRequestDto): Observable<RoleDetailResponseDto> {
    return this.http.put<RoleDetailResponseDto>(`${ROLES_URL}/${id}`, dto);
  }

  /** PUT /api/roles/{id}/permissions. */
  replacePermissions(
    id: string,
    dto: ReplacePermissionsRequestDto,
  ): Observable<RoleDetailResponseDto> {
    return this.http.put<RoleDetailResponseDto>(`${ROLES_URL}/${id}/permissions`, dto);
  }

  /** DELETE /api/roles/{id}. */
  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${ROLES_URL}/${id}`);
  }

  /** GET /api/permissions. */
  listPermissions(): Observable<PermissionGroupResponseDto[]> {
    return this.http.get<PermissionGroupResponseDto[]>(PERMISSIONS_URL);
  }
}
