import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';
import { HttpParamsBuilder } from '@app/shared/utils/http-params.builder';

import type {
  ClientResponseDto,
  ClientType,
  ContactResponseDto,
  CreateClientDto,
  CreateContactDto,
  PaginatedBookingSummaryDto,
  PaginatedClientResponseDto,
  PaginatedInvoiceResponseDto,
  PaginatedLeadResponseDto,
  PaginatedOfferSummaryDto,
  UpdateClientDto,
  UpdateContactDto,
} from '@app/shared/models';

const CLIENTS_URL = `${environment.baseUrl}/api/clients`;

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  getList(params?: {
    type?: ClientType;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedClientResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('type', params?.type)
      .set('search', params?.search && params.search.length >= 2 ? params.search : null)
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<PaginatedClientResponseDto>(CLIENTS_URL, { params: httpParams })
      .pipe(this.errorHandler.catch());
  }

  getById(id: string): Observable<ClientResponseDto> {
    return this.http.get<ClientResponseDto>(`${CLIENTS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  create(dto: CreateClientDto): Observable<ClientResponseDto> {
    return this.http.post<ClientResponseDto>(CLIENTS_URL, dto).pipe(this.errorHandler.catch());
  }

  update(id: string, dto: UpdateClientDto): Observable<ClientResponseDto> {
    return this.http
      .put<ClientResponseDto>(`${CLIENTS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${CLIENTS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  createContact(clientId: string, dto: CreateContactDto): Observable<ContactResponseDto> {
    return this.http
      .post<ContactResponseDto>(`${CLIENTS_URL}/${clientId}/contacts`, dto)
      .pipe(this.errorHandler.catch());
  }

  updateContact(
    clientId: string,
    contactId: string,
    dto: UpdateContactDto,
  ): Observable<ContactResponseDto> {
    return this.http
      .put<ContactResponseDto>(`${CLIENTS_URL}/${clientId}/contacts/${contactId}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deleteContact(clientId: string, contactId: string): Observable<void> {
    return this.http
      .delete<void>(`${CLIENTS_URL}/${clientId}/contacts/${contactId}`)
      .pipe(this.errorHandler.catch());
  }

  listContacts(clientId: string): Observable<ContactResponseDto[]> {
    return this.http
      .get<ContactResponseDto[]>(`${CLIENTS_URL}/${clientId}/contacts`)
      .pipe(this.errorHandler.catch());
  }

  getLeads(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedLeadResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<PaginatedLeadResponseDto>(`${CLIENTS_URL}/${clientId}/leads`, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }

  getInvoices(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedInvoiceResponseDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<PaginatedInvoiceResponseDto>(`${CLIENTS_URL}/${clientId}/invoices`, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }

  getOffers(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedOfferSummaryDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<PaginatedOfferSummaryDto>(`${CLIENTS_URL}/${clientId}/offers`, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }

  getBookings(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedBookingSummaryDto> {
    const httpParams = new HttpParamsBuilder()
      .set('page', params?.page)
      .set('limit', params?.limit)
      .build();

    return this.http
      .get<PaginatedBookingSummaryDto>(`${CLIENTS_URL}/${clientId}/bookings`, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }
}
