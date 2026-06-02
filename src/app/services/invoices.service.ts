import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  CancelInvoiceDto,
  CreateInvoiceDto,
  InvoiceFilterQueryDto,
  InvoiceResponseDto,
  InvoiceSummaryResponseDto,
  PaginatedInvoiceResponseDto,
  PaymentResponseDto,
  RecordPaymentRequestDto,
  UpdateInvoiceDto,
} from '@app/shared/models';

const INVOICES_URL = `${environment.baseUrl}/api/invoices`;

/**
 * Invoices API. Aligned with openapi.json:
 * GET/POST /api/invoices,
 * GET/PUT /api/invoices/{id},
 * PUT /api/invoices/{id}/publish,
 * PUT /api/invoices/{id}/cancel,
 * GET /api/invoices/{id}/pdf,
 * GET /api/invoices/summary.
 */
@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  getList(params?: InvoiceFilterQueryDto): Observable<PaginatedInvoiceResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .appendArray('status', params?.status)
      .set('clientType', params?.clientType)
      .set('dateFrom', params?.dateFrom && params.dateFrom.length > 0 ? params.dateFrom : null)
      .set('dateTo', params?.dateTo && params.dateTo.length > 0 ? params.dateTo : null)
      .set('currency', params?.currency && params.currency.length > 0 ? params.currency : null)
      .set('search', params?.search && params.search.length > 0 ? params.search : null)
      .build();

    return this.http.get<PaginatedInvoiceResponseDto>(INVOICES_URL, { params: httpParams });
  }

  getById(id: string): Observable<InvoiceResponseDto> {
    return this.http.get<InvoiceResponseDto>(`${INVOICES_URL}/${id}`);
  }

  getSummary(): Observable<InvoiceSummaryResponseDto> {
    return this.http.get<InvoiceSummaryResponseDto>(`${INVOICES_URL}/summary`);
  }

  create(dto: CreateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.post<InvoiceResponseDto>(INVOICES_URL, dto);
  }

  update(id: string, dto: UpdateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.put<InvoiceResponseDto>(`${INVOICES_URL}/${id}`, dto);
  }

  publish(id: string): Observable<InvoiceResponseDto> {
    return this.http.put<InvoiceResponseDto>(`${INVOICES_URL}/${id}/publish`, {});
  }

  cancel(id: string, dto: CancelInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.put<InvoiceResponseDto>(`${INVOICES_URL}/${id}/cancel`, dto);
  }

  getPdf(id: string): Observable<Blob> {
    return this.http.get(`${INVOICES_URL}/${id}/pdf`, { responseType: 'blob' });
  }

  listPayments(invoiceId: string): Observable<PaymentResponseDto[]> {
    return this.http.get<PaymentResponseDto[]>(`${INVOICES_URL}/${invoiceId}/payments`);
  }

  recordPayment(invoiceId: string, dto: RecordPaymentRequestDto): Observable<PaymentResponseDto> {
    return this.http.post<PaymentResponseDto>(`${INVOICES_URL}/${invoiceId}/payments`, dto);
  }

  deletePayment(invoiceId: string, paymentId: string): Observable<void> {
    return this.http.delete<void>(`${INVOICES_URL}/${invoiceId}/payments/${paymentId}`);
  }
}
