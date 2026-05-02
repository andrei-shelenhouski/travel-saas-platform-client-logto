import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

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

  // eslint-disable-next-line complexity
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
