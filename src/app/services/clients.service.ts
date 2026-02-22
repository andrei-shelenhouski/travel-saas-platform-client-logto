import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  ClientResponseDto,
  CreateClientDto,
  UpdateClientDto,
} from '../shared/models';

const CLIENTS_URL = `${environment.baseUrl}/api/clients`;

/**
 * Clients API. Aligned with openapi.json: GET/POST /api/clients, GET/PATCH/DELETE /api/clients/{id}.
 */
@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);

  getList(): Observable<ClientResponseDto[]> {
    return this.http.get<ClientResponseDto[]>(CLIENTS_URL);
  }

  getById(id: string): Observable<ClientResponseDto> {
    return this.http.get<ClientResponseDto>(`${CLIENTS_URL}/${id}`);
  }

  create(dto: CreateClientDto): Observable<ClientResponseDto> {
    return this.http.post<ClientResponseDto>(CLIENTS_URL, dto);
  }

  update(id: string, dto: UpdateClientDto): Observable<ClientResponseDto> {
    return this.http.patch<ClientResponseDto>(`${CLIENTS_URL}/${id}`, dto);
  }

  delete(id: string): Observable<ClientResponseDto> {
    return this.http.delete<ClientResponseDto>(`${CLIENTS_URL}/${id}`);
  }
}
