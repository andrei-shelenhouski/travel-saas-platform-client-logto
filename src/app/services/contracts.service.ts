import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

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
    const httpParams = new HttpParamsBuilder()
      .set('clientId', params?.clientId || null)
      .set('status', params?.status || null)
      .set('page', params?.page)
      .set('limit', params?.limit)
      .set('size', params?.size)
      .build();

    return this.http.get<PaginatedContractResponseDto>(CONTRACTS_URL, { params: httpParams });
  }

  getByClient(
    clientId: string,
    params?: Pick<ListContractsQueryDto, 'page' | 'limit' | 'size'>,
  ): Observable<PaginatedContractResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .set('size', params?.size)
      .build();

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
