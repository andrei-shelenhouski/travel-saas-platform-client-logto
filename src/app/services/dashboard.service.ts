import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type { DashboardResponseDto } from '@app/shared/models';

const DASHBOARD_URL = `${environment.baseUrl}/api/dashboard`;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  get(): Observable<DashboardResponseDto> {
    return this.http.get<DashboardResponseDto>(DASHBOARD_URL);
  }
}
