import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import type { MeResponse } from '../shared/models';

const ME_URL = `${environment.baseUrl}/api/me`;

/**
 * Holds /me response temporarily for onboarding decision.
 * Do NOT send X-Organization-Id when calling GET /me.
 */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);
  private data: MeResponse | null = null;

  /** Call GET /me (no org header). Stores result for onboarding decision. */
  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(ME_URL).pipe(
      tap((res) => {
        this.data = res;
      }),
    );
  }

  getMeData(): MeResponse | null {
    return this.data;
  }

  clearMeData(): void {
    this.data = null;
  }
}
