import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  ContractResponseDto,
  CreateContractDto,
  ListContractsQueryDto,
  PaginatedContractResponseDto,
  TerminateContractDto,
  UpdateContractDto,
} from '@app/shared/models';

const CONTRACTS_URL = `${environment.baseUrl}/api/contracts`;
const CLIENTS_URL = `${environment.baseUrl}/api/clients`;

@Injectable({ providedIn: 'root' })
export class ContractsService {
  private readonly http = inject(HttpClient);

  getList(params?: ListContractsQueryDto): Observable<PaginatedContractResponseDto> {
    let httpParams = new HttpParams();

    if (params?.clientId !== undefined && params.clientId) {
      httpParams = httpParams.set('clientId', params.clientId);
    }

    if (params?.status !== undefined && params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size);
    }

    return this.http.get<PaginatedContractResponseDto>(CONTRACTS_URL, { params: httpParams });
  }

  getByClient(
    clientId: string,
    params?: Pick<ListContractsQueryDto, 'page' | 'limit' | 'size'>,
  ): Observable<PaginatedContractResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size);
    }

    return this.http.get<PaginatedContractResponseDto>(`${CLIENTS_URL}/${clientId}/contracts`, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<ContractResponseDto> {
    return this.http.get<ContractResponseDto>(`${CONTRACTS_URL}/${id}`);
  }

  create(dto: CreateContractDto): Observable<ContractResponseDto> {
    return this.http.post<ContractResponseDto>(CONTRACTS_URL, dto);
  }

  update(id: string, dto: UpdateContractDto): Observable<ContractResponseDto> {
    return this.http.put<ContractResponseDto>(`${CONTRACTS_URL}/${id}`, dto);
  }

  terminate(id: string, dto?: TerminateContractDto): Observable<ContractResponseDto> {
    return this.http.put<ContractResponseDto>(`${CONTRACTS_URL}/${id}/terminate`, dto ?? {});
  }
}
