import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';
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
  private readonly errorHandler = inject(ApiErrorHandlerService);

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

    return this.http
      .get<PaginatedInvoiceResponseDto>(INVOICES_URL, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  getById(id: string): Observable<InvoiceResponseDto> {
    return this.http
      .get<InvoiceResponseDto>(`${INVOICES_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }

  getSummary(): Observable<InvoiceSummaryResponseDto> {
    return this.http
      .get<InvoiceSummaryResponseDto>(`${INVOICES_URL}/summary`)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http.post<InvoiceResponseDto>(INVOICES_URL, dto).pipe(this.errorHandler.catch());
  }

  update(id: string, dto: UpdateInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http
      .put<InvoiceResponseDto>(`${INVOICES_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  publish(id: string): Observable<InvoiceResponseDto> {
    return this.http
      .put<InvoiceResponseDto>(`${INVOICES_URL}/${id}/publish`, {})
      .pipe(this.errorHandler.catch());
  }

  cancel(id: string, dto: CancelInvoiceDto): Observable<InvoiceResponseDto> {
    return this.http
      .put<InvoiceResponseDto>(`${INVOICES_URL}/${id}/cancel`, dto)
      .pipe(this.errorHandler.catch());
  }

  getPdf(id: string): Observable<Blob> {
    return this.http
      .get(`${INVOICES_URL}/${id}/pdf`, { responseType: 'blob' })
      .pipe(this.errorHandler.catch());
  }

  listPayments(invoiceId: string): Observable<PaymentResponseDto[]> {
    return this.http
      .get<PaymentResponseDto[]>(`${INVOICES_URL}/${invoiceId}/payments`)
      .pipe(this.errorHandler.catch());
  }

  recordPayment(invoiceId: string, dto: RecordPaymentRequestDto): Observable<PaymentResponseDto> {
    return this.http
      .post<PaymentResponseDto>(`${INVOICES_URL}/${invoiceId}/payments`, dto)
      .pipe(this.errorHandler.catch());
  }

  deletePayment(invoiceId: string, paymentId: string): Observable<void> {
    return this.http
      .delete<void>(`${INVOICES_URL}/${invoiceId}/payments/${paymentId}`)
      .pipe(this.errorHandler.catch());
  }
}
