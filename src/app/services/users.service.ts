import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  ChangeRoleRequestDto,
  InviteUserRequestDto,
  OrgRole,
  OrgUserResponseDto,
  PaginatedOrgUserResponseDto,
  UpdateUserRequestDto,
} from '@app/shared/models';

const USERS_URL = `${environment.baseUrl}/api/users`;

/**
 * Users API. Manages org-scoped users (invite, deactivate, reactivate).
 * Uses /api/users — distinct from /api/organization-members.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  /** GET /api/users. List users with optional role / isActive filters. */
  getList(params?: {
    role?: OrgRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Observable<PaginatedOrgUserResponseDto> {
    let httpParams = new HttpParams();

    if (params?.role !== undefined) {
      httpParams = httpParams.set('role', params.role);
    }

    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('size', params.limit);
    }

    return this.http
      .get<PaginatedOrgUserResponseDto>(USERS_URL, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  /** POST /api/users. Invite a new user to the organization. Returns 201. */
  invite(dto: InviteUserRequestDto): Observable<OrgUserResponseDto> {
    return this.http.post<OrgUserResponseDto>(USERS_URL, dto).pipe(this.errorHandler.catch());
  }

  /** GET /api/users/{id}. */
  getById(id: string): Observable<OrgUserResponseDto> {
    return this.http.get<OrgUserResponseDto>(`${USERS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  /** PUT /api/users/{id}. Update fullName and/or role. */
  update(id: string, dto: UpdateUserRequestDto): Observable<OrgUserResponseDto> {
    return this.http
      .put<OrgUserResponseDto>(`${USERS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  /** PUT /api/users/{id}/role. Update role without changing profile fields. */
  changeRole(id: string, dto: ChangeRoleRequestDto): Observable<OrgUserResponseDto> {
    return this.http
      .put<OrgUserResponseDto>(`${USERS_URL}/${id}/role`, dto)
      .pipe(this.errorHandler.catch());
  }

  /** PUT /api/users/{id}/deactivate. */
  deactivate(id: string): Observable<OrgUserResponseDto> {
    return this.http
      .put<OrgUserResponseDto>(`${USERS_URL}/${id}/deactivate`, {})
      .pipe(this.errorHandler.catch());
  }

  /** PUT /api/users/{id}/reactivate. */
  reactivate(id: string): Observable<OrgUserResponseDto> {
    return this.http
      .put<OrgUserResponseDto>(`${USERS_URL}/${id}/reactivate`, {})
      .pipe(this.errorHandler.catch());
  }
}
