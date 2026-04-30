import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  CancelInvoiceDto,
  CreateInvoiceDto,
  InvoiceFilterQueryDto,
  InvoiceResponseDto,
  PaginatedInvoiceResponseDto,
  UpdateInvoiceDto,
} from '@app/shared/models';

const INVOICES_URL = `${environment.baseUrl}/api/invoices`;

/**
 * Invoices API. Aligned with openapi.json: GET/POST /api/invoices, GET/PUT /api/invoices/{id}, PUT /api/invoices/{id}/cancel.
 */
@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  getList(params?: InvoiceFilterQueryDto): Observable<PaginatedInvoiceResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    if (params?.status !== undefined) {
      params.status.forEach((status) => {
        httpParams = httpParams.append('status', status);
      });
    }

    if (params?.clientType !== undefined) {
      httpParams = httpParams.set('clientType', params.clientType);
    }

    if (params?.dateFrom !== undefined && params.dateFrom.length > 0) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }

    if (params?.dateTo !== undefined && params.dateTo.length > 0) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    if (params?.currency !== undefined && params.currency.length > 0) {
      httpParams = httpParams.set('currency', params.currency);
    }

    if (params?.search !== undefined && params.search.length > 0) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<PaginatedInvoiceResponseDto>(INVOICES_URL, { params: httpParams });
  }

  getById(id: string): Observable<InvoiceResponseDto> {
    return this.http.get<InvoiceResponseDto>(`${INVOICES_URL}/${id}`);
  }

  create(dto: CreateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.post<InvoiceResponseDto>(INVOICES_URL, dto);
  }

  update(id: string, dto: UpdateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.put<InvoiceResponseDto>(`${INVOICES_URL}/${id}`, dto);
  }

  cancel(id: string, dto: CancelInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.put<InvoiceResponseDto>(`${INVOICES_URL}/${id}/cancel`, dto);
  }
}
