import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import { map, Observable, tap } from 'rxjs';

import { environment } from '@environments/environment';

import type { MeResponseDto } from '@app/shared/models';

const ME_URL = `${environment.baseUrl}/api/me`;

/**
 * Holds GET /api/me response (MeResponseDto). Do NOT send X-Organization-Id when calling GET /me.
 */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);
  private readonly meData = signal<MeResponseDto | null>(null);

  /** Call GET /api/me (no org header). Stores result for onboarding and role. */
  getMe(): Observable<MeResponseDto> {
    return this.http.get<MeResponseDto>(ME_URL).pipe(
      map((res) => ({
        ...res,
        organizations: (res.organizations ?? []).map((organization) => ({
          ...organization,
          organizationId: organization.id,
          organizationName: organization.name,
        })),
      })),
      tap((res) => {
        this.meData.set(res);
      }),
    );
  }

  getMeData(): MeResponseDto | null {
    return this.meData();
  }

  clearMeData(): void {
    this.meData.set(null);
  }
}
