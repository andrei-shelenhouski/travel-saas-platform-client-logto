import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  AddPersonRelationshipRequestDto,
  CreateDetachedPersonRequestDto,
  CreatePersonRequestDto,
  LinkPersonRequestDto,
  PersonAddressRequestDto,
  PersonAddressResponseDto,
  PersonContactRequestDto,
  PersonContactResponseDto,
  PersonDocumentRequestDto,
  PersonDocumentResponseDto,
  PersonRelationshipResponseDto,
  PersonResponseDto,
  PersonSearchResultDto,
  UpdatePersonRequestDto,
} from '@app/shared/models';

const CLIENTS_URL = `${environment.baseUrl}/api/clients`;
const PERSONS_URL = `${environment.baseUrl}/api/persons`;

@Injectable({ providedIn: 'root' })
export class PersonsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  getById(id: string): Observable<PersonResponseDto> {
    return this.http.get<PersonResponseDto>(`${PERSONS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  getByClientId(clientId: string): Observable<PersonResponseDto> {
    return this.http
      .get<PersonResponseDto>(`${CLIENTS_URL}/${clientId}/person`)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateDetachedPersonRequestDto): Observable<PersonResponseDto> {
    return this.http.post<PersonResponseDto>(PERSONS_URL, dto).pipe(this.errorHandler.catch());
  }

  createForClient(clientId: string, dto: CreatePersonRequestDto): Observable<PersonResponseDto> {
    return this.http
      .post<PersonResponseDto>(`${CLIENTS_URL}/${clientId}/person`, dto)
      .pipe(this.errorHandler.catch());
  }

  linkToClient(clientId: string, dto: LinkPersonRequestDto): Observable<PersonResponseDto> {
    return this.http
      .put<PersonResponseDto>(`${CLIENTS_URL}/${clientId}/person`, dto)
      .pipe(this.errorHandler.catch());
  }

  update(id: string, dto: UpdatePersonRequestDto): Observable<PersonResponseDto> {
    return this.http
      .patch<PersonResponseDto>(`${PERSONS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  search(query: string): Observable<PersonSearchResultDto[]> {
    if (query.trim().length < 2) {
      return of([]);
    }

    const params = new HttpParams().set('q', query.trim());

    return this.http.get<{ items: PersonResponseDto[] }>(`${PERSONS_URL}/search`, { params }).pipe(
      this.errorHandler.catch(),
      map((response) =>
        response.items.map((person) => ({
          id: person.id,
          fullName: [person.lastName, person.firstName, person.patronymic]
            .filter(Boolean)
            .join(' '),
          dateOfBirth: person.dateOfBirth,
          citizenship: person.citizenship,
          clientId: person.clientId,
        })),
      ),
    );
  }

  searchFull(query: string): Observable<PersonResponseDto[]> {
    if (query.trim().length < 2) {
      return of([]);
    }

    const params = new HttpParams().set('q', query.trim());

    return this.http
      .get<{ items: PersonResponseDto[] }>(`${PERSONS_URL}/search`, { params })
      .pipe(this.errorHandler.catch(), map((response) => response.items));
  }

  getRelationships(personId: string): Observable<PersonRelationshipResponseDto[]> {
    return this.http
      .get<PersonRelationshipResponseDto[]>(`${PERSONS_URL}/${personId}/relationships`)
      .pipe(this.errorHandler.catch());
  }

  getFamily(personId: string): Observable<PersonResponseDto[]> {
    return this.http
      .get<PersonResponseDto[]>(`${PERSONS_URL}/${personId}/family`)
      .pipe(this.errorHandler.catch());
  }

  addRelationship(
    personId: string,
    dto: AddPersonRelationshipRequestDto,
  ): Observable<PersonRelationshipResponseDto> {
    return this.http
      .post<PersonRelationshipResponseDto>(`${PERSONS_URL}/${personId}/relationships`, dto)
      .pipe(this.errorHandler.catch());
  }

  getDocuments(personId: string): Observable<PersonDocumentResponseDto[]> {
    return this.http
      .get<PersonDocumentResponseDto[]>(`${PERSONS_URL}/${personId}/documents`)
      .pipe(this.errorHandler.catch());
  }

  addDocument(
    personId: string,
    dto: PersonDocumentRequestDto,
  ): Observable<PersonDocumentResponseDto> {
    return this.http
      .post<PersonDocumentResponseDto>(`${PERSONS_URL}/${personId}/documents`, dto)
      .pipe(this.errorHandler.catch());
  }

  updateDocument(
    personId: string,
    docId: string,
    dto: PersonDocumentRequestDto,
  ): Observable<PersonDocumentResponseDto> {
    return this.http
      .patch<PersonDocumentResponseDto>(`${PERSONS_URL}/${personId}/documents/${docId}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deleteDocument(personId: string, docId: string): Observable<void> {
    return this.http
      .delete<void>(`${PERSONS_URL}/${personId}/documents/${docId}`)
      .pipe(this.errorHandler.catch());
  }

  setDocumentPrimary(personId: string, docId: string): Observable<PersonDocumentResponseDto> {
    return this.http
      .put<PersonDocumentResponseDto>(
        `${PERSONS_URL}/${personId}/documents/${docId}/set-primary`,
        {},
      )
      .pipe(this.errorHandler.catch());
  }

  getAddresses(personId: string): Observable<PersonAddressResponseDto[]> {
    return this.http
      .get<PersonAddressResponseDto[]>(`${PERSONS_URL}/${personId}/addresses`)
      .pipe(this.errorHandler.catch());
  }

  addAddress(personId: string, dto: PersonAddressRequestDto): Observable<PersonAddressResponseDto> {
    return this.http
      .post<PersonAddressResponseDto>(`${PERSONS_URL}/${personId}/addresses`, dto)
      .pipe(this.errorHandler.catch());
  }

  updateAddress(
    personId: string,
    addrId: string,
    dto: PersonAddressRequestDto,
  ): Observable<PersonAddressResponseDto> {
    return this.http
      .patch<PersonAddressResponseDto>(`${PERSONS_URL}/${personId}/addresses/${addrId}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deleteAddress(personId: string, addrId: string): Observable<void> {
    return this.http
      .delete<void>(`${PERSONS_URL}/${personId}/addresses/${addrId}`)
      .pipe(this.errorHandler.catch());
  }

  getContacts(personId: string): Observable<PersonContactResponseDto[]> {
    return this.http
      .get<PersonContactResponseDto[]>(`${PERSONS_URL}/${personId}/contacts`)
      .pipe(this.errorHandler.catch());
  }

  addContact(personId: string, dto: PersonContactRequestDto): Observable<PersonContactResponseDto> {
    return this.http
      .post<PersonContactResponseDto>(`${PERSONS_URL}/${personId}/contacts`, dto)
      .pipe(this.errorHandler.catch());
  }

  updateContact(
    personId: string,
    ctcId: string,
    dto: PersonContactRequestDto,
  ): Observable<PersonContactResponseDto> {
    return this.http
      .patch<PersonContactResponseDto>(`${PERSONS_URL}/${personId}/contacts/${ctcId}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deleteContact(personId: string, ctcId: string): Observable<void> {
    return this.http
      .delete<void>(`${PERSONS_URL}/${personId}/contacts/${ctcId}`)
      .pipe(this.errorHandler.catch());
  }

  setContactPrimary(personId: string, ctcId: string): Observable<PersonContactResponseDto> {
    return this.http
      .put<PersonContactResponseDto>(`${PERSONS_URL}/${personId}/contacts/${ctcId}/set-primary`, {})
      .pipe(this.errorHandler.catch());
  }
}
