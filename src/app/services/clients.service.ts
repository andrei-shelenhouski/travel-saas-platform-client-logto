import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  ClientPageDto,
  ClientResponseDto,
  ClientType,
  CreateClientDto,
  PaginatedClientResponseDto,
  UpdateClientDto,
} from '@app/shared/models';

const CLIENTS_URL = `${environment.baseUrl}/api/clients`;

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);

  getPage(params?: {
    type?: ClientType;
    search?: string;
    page?: number;
    size?: number;
  }): Observable<ClientPageDto> {
    let httpParams = new HttpParams();

    if (params?.type !== undefined) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params?.search !== undefined && params.search.length >= 2) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size);
    }

    return this.http.get<ClientPageDto>(CLIENTS_URL, { params: httpParams });
  }

  getList(params?: {
    type?: ClientType;
    page?: number;
    limit?: number;
  }): Observable<PaginatedClientResponseDto> {
    let httpParams = new HttpParams();

    if (params?.type !== undefined) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http.get<PaginatedClientResponseDto>(CLIENTS_URL, { params: httpParams });
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

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${CLIENTS_URL}/${id}`);
  }
}
