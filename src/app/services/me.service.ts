import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import type { MeResponseDto } from '../shared/models';

const ME_URL = `${environment.baseUrl}/api/me`;

/**
 * Holds GET /api/me response (MeResponseDto). Do NOT send X-Organization-Id when calling GET /me.
 */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);
  private data: MeResponseDto | null = null;

  /** Call GET /api/me (no org header). Stores result for onboarding and role. */
  getMe(): Observable<MeResponseDto> {
    return this.http.get<MeResponseDto>(ME_URL).pipe(
      tap((res) => {
        this.data = res;
      }),
    );
  }

  getMeData(): MeResponseDto | null {
    return this.data;
  }

  clearMeData(): void {
    this.data = null;
  }
}
