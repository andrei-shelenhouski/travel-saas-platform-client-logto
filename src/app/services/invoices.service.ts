import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CreateInvoiceDto,
  InvoiceResponseDto,
  InvoiceStatus,
  PaginatedInvoiceResponseDto,
  UpdateInvoiceDto,
} from '../shared/models';

const INVOICES_URL = `${environment.baseUrl}/api/invoices`;

/**
 * Invoices API. Aligned with openapi.json: GET/POST /api/invoices, GET/PATCH/DELETE /api/invoices/{id}.
 */
@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  getList(params?: { page?: number; limit?: number; status?: InvoiceStatus }): Observable<PaginatedInvoiceResponseDto> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status != null) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedInvoiceResponseDto>(INVOICES_URL, { params: httpParams });
  }

  getById(id: string): Observable<InvoiceResponseDto> {
    return this.http.get<InvoiceResponseDto>(`${INVOICES_URL}/${id}`);
  }

  create(dto: CreateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.post<InvoiceResponseDto>(INVOICES_URL, dto);
  }

  update(id: string, dto: UpdateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.patch<InvoiceResponseDto>(`${INVOICES_URL}/${id}`, dto);
  }

  delete(id: string): Observable<InvoiceResponseDto> {
    return this.http.delete<InvoiceResponseDto>(`${INVOICES_URL}/${id}`);
  }
}
