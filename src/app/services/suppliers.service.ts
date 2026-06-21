import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  CreateSupplierContactRequest,
  CreateSupplierRequest,
  ListSuppliersQuery,
  PaginatedSupplierResponse,
  SupplierContactResponse,
  SupplierResponse,
  UpdateSupplierContactRequest,
  UpdateSupplierRequest,
} from '@app/shared/models';
import type { PaginatedContractResponseDto } from '@app/shared/models';

const SUPPLIERS_URL = `${environment.baseUrl}/api/suppliers`;

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  getList(params?: ListSuppliersQuery): Observable<PaginatedSupplierResponse> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .set('category', params?.category || null)
      .set('serviceType', params?.serviceType || null)
      .set('search', params?.search && params.search.length >= 2 ? params.search : null)
      .set('isActive', params?.isActive !== undefined ? params.isActive : null)
      .build();

    return this.http
      .get<PaginatedSupplierResponse>(SUPPLIERS_URL, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  getById(id: string): Observable<SupplierResponse> {
    return this.http
      .get<SupplierResponse>(`${SUPPLIERS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(SUPPLIERS_URL, dto).pipe(this.errorHandler.catch());
  }

  update(id: string, dto: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.http
      .put<SupplierResponse>(`${SUPPLIERS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deactivate(id: string): Observable<SupplierResponse> {
    return this.http
      .put<SupplierResponse>(`${SUPPLIERS_URL}/${id}/deactivate`, {})
      .pipe(this.errorHandler.catch());
  }

  reactivate(id: string): Observable<SupplierResponse> {
    return this.http
      .put<SupplierResponse>(`${SUPPLIERS_URL}/${id}/reactivate`, {})
      .pipe(this.errorHandler.catch());
  }

  listContacts(id: string): Observable<SupplierContactResponse[]> {
    return this.http
      .get<SupplierContactResponse[]>(`${SUPPLIERS_URL}/${id}/contacts`)
      .pipe(this.errorHandler.catch());
  }

  createContact(
    id: string,
    dto: CreateSupplierContactRequest,
  ): Observable<SupplierContactResponse> {
    return this.http
      .post<SupplierContactResponse>(`${SUPPLIERS_URL}/${id}/contacts`, dto)
      .pipe(this.errorHandler.catch());
  }

  updateContact(
    id: string,
    contactId: string,
    dto: UpdateSupplierContactRequest,
  ): Observable<SupplierContactResponse> {
    return this.http
      .put<SupplierContactResponse>(`${SUPPLIERS_URL}/${id}/contacts/${contactId}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deleteContact(id: string, contactId: string): Observable<void> {
    return this.http
      .delete<void>(`${SUPPLIERS_URL}/${id}/contacts/${contactId}`)
      .pipe(this.errorHandler.catch());
  }

  getBookings(
    id: string,
    params?: { page?: number; limit?: number },
  ): Observable<Record<string, unknown>> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<Record<string, unknown>>(`${SUPPLIERS_URL}/${id}/bookings`, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  getContracts(
    id: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedContractResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<PaginatedContractResponseDto>(`${SUPPLIERS_URL}/${id}/contracts`, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }
}
