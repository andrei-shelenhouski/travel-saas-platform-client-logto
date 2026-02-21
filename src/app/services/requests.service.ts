import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { CreateRequestDto } from '../shared/models';

const REQUESTS_URL = `${environment.baseUrl}/api/requests`;

/**
 * Requests API (OpenAPI: POST /api/requests).
 */
@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateRequestDto): Observable<unknown> {
    return this.http.post<unknown>(REQUESTS_URL, dto);
  }
}
