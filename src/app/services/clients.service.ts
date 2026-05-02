import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

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

  getList(params?: {
    type?: ClientType;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedClientResponseDto> {
    let httpParams = new HttpParams();

    if (params?.type !== undefined) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params?.search !== undefined && params.search.length >= 2) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http.get<PaginatedClientResponseDto>(CLIENTS_URL, { params: httpParams });
  }

  getById(id: string): Observable<ClientResponseDto> {
    return this.http.get<ClientResponseDto>(`${CLIENTS_URL}/${id}`);
  }

  create(dto: CreateClientDto): Observable<ClientResponseDto> {
    return this.http.post<ClientResponseDto>(CLIENTS_URL, dto);
  }

  update(id: string, dto: UpdateClientDto): Observable<ClientResponseDto> {
    return this.http.put<ClientResponseDto>(`${CLIENTS_URL}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${CLIENTS_URL}/${id}`);
  }

  createContact(clientId: string, dto: CreateContactDto): Observable<ContactResponseDto> {
    return this.http.post<ContactResponseDto>(`${CLIENTS_URL}/${clientId}/contacts`, dto);
  }

  updateContact(
    clientId: string,
    contactId: string,
    dto: UpdateContactDto,
  ): Observable<ContactResponseDto> {
    return this.http.put<ContactResponseDto>(
      `${CLIENTS_URL}/${clientId}/contacts/${contactId}`,
      dto,
    );
  }

  deleteContact(clientId: string, contactId: string): Observable<void> {
    return this.http.delete<void>(`${CLIENTS_URL}/${clientId}/contacts/${contactId}`);
  }

  getLeads(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedLeadResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http.get<PaginatedLeadResponseDto>(`${CLIENTS_URL}/${clientId}/leads`, {
      params: httpParams,
    });
  }

  getInvoices(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedInvoiceResponseDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http.get<PaginatedInvoiceResponseDto>(`${CLIENTS_URL}/${clientId}/invoices`, {
      params: httpParams,
    });
  }

  getOffers(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedOfferSummaryDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http.get<PaginatedOfferSummaryDto>(`${CLIENTS_URL}/${clientId}/offers`, {
      params: httpParams,
    });
  }

  getBookings(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Observable<PaginatedBookingSummaryDto> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http.get<PaginatedBookingSummaryDto>(`${CLIENTS_URL}/${clientId}/bookings`, {
      params: httpParams,
    });
  }
}
