import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { CreateClientDto } from '../shared/models';

const CLIENTS_URL = `${environment.baseUrl}/api/clients`;

/**
 * Clients API (OpenAPI: POST /api/clients).
 */
@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateClientDto): Observable<unknown> {
    return this.http.post<unknown>(CLIENTS_URL, dto);
  }
}
