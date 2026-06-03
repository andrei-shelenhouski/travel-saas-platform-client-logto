import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  CreateCustomFieldDefinitionRequestDto,
  CustomFieldDefinitionRequestDto,
  CustomFieldDefinitionResponseDto,
  CustomFieldEntityType,
  CustomFieldValueDto,
  ReorderRequestDto,
  UpsertCustomFieldsRequestDto,
} from '@app/shared/models';

const CUSTOM_FIELD_DEFINITIONS_URL = `${environment.baseUrl}/api/custom-field-definitions`;

@Injectable({ providedIn: 'root' })
export class CustomFieldsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  listDefinitions(
    entityType: CustomFieldEntityType,
  ): Observable<CustomFieldDefinitionResponseDto[]> {
    const params = new HttpParams().set('entityType', entityType);

    return this.http
      .get<CustomFieldDefinitionResponseDto[]>(CUSTOM_FIELD_DEFINITIONS_URL, {
        params,
      })
      .pipe(this.errorHandler.catch());
  }

  createDefinition(
    dto: CreateCustomFieldDefinitionRequestDto,
  ): Observable<CustomFieldDefinitionResponseDto> {
    return this.http
      .post<CustomFieldDefinitionResponseDto>(CUSTOM_FIELD_DEFINITIONS_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  updateDefinition(
    id: string,
    dto: CustomFieldDefinitionRequestDto,
  ): Observable<CustomFieldDefinitionResponseDto> {
    return this.http
      .put<CustomFieldDefinitionResponseDto>(`${CUSTOM_FIELD_DEFINITIONS_URL}/${id}`, dto)
      .pipe(this.errorHandler.catch());
  }

  deactivateDefinition(id: string): Observable<void> {
    return this.http
      .delete<void>(`${CUSTOM_FIELD_DEFINITIONS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }

  reorderDefinitions(entityType: CustomFieldEntityType, ids: string[]): Observable<void> {
    const params = new HttpParams().set('entityType', entityType);
    const body: ReorderRequestDto = { ids };

    return this.http
      .put<void>(`${CUSTOM_FIELD_DEFINITIONS_URL}/reorder`, body, { params })
      .pipe(this.errorHandler.catch());
  }

  getLeadValues(id: string): Observable<CustomFieldValueDto[]> {
    return this.http
      .get<CustomFieldValueDto[]>(`${environment.baseUrl}/api/leads/${id}/custom-fields`)
      .pipe(this.errorHandler.catch());
  }

  upsertLeadValues(
    id: string,
    dto: UpsertCustomFieldsRequestDto,
  ): Observable<CustomFieldValueDto[]> {
    return this.http
      .put<CustomFieldValueDto[]>(`${environment.baseUrl}/api/leads/${id}/custom-fields`, dto)
      .pipe(this.errorHandler.catch());
  }

  getBookingValues(id: string): Observable<CustomFieldValueDto[]> {
    return this.http
      .get<CustomFieldValueDto[]>(`${environment.baseUrl}/api/bookings/${id}/custom-fields`)
      .pipe(this.errorHandler.catch());
  }

  upsertBookingValues(
    id: string,
    dto: UpsertCustomFieldsRequestDto,
  ): Observable<CustomFieldValueDto[]> {
    return this.http
      .put<CustomFieldValueDto[]>(`${environment.baseUrl}/api/bookings/${id}/custom-fields`, dto)
      .pipe(this.errorHandler.catch());
  }

  getClientValues(id: string): Observable<CustomFieldValueDto[]> {
    return this.http
      .get<CustomFieldValueDto[]>(`${environment.baseUrl}/api/clients/${id}/custom-fields`)
      .pipe(this.errorHandler.catch());
  }

  upsertClientValues(
    id: string,
    dto: UpsertCustomFieldsRequestDto,
  ): Observable<CustomFieldValueDto[]> {
    return this.http
      .put<CustomFieldValueDto[]>(`${environment.baseUrl}/api/clients/${id}/custom-fields`, dto)
      .pipe(this.errorHandler.catch());
  }
}
