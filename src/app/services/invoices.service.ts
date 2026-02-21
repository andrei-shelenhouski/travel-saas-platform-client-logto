import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { CreateInvoiceDto } from '../shared/models';

const INVOICES_URL = `${environment.baseUrl}/api/invoices`;

/**
 * Invoices API (OpenAPI: POST /api/invoices).
 */
@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  create(dto: CreateInvoiceDto): Observable<unknown> {
    return this.http.post<unknown>(INVOICES_URL, dto);
  }
}
