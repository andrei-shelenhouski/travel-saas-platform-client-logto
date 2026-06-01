import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

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

  listDefinitions(
    entityType: CustomFieldEntityType,
  ): Observable<CustomFieldDefinitionResponseDto[]> {
    const params = new HttpParams().set('entityType', entityType);

    return this.http.get<CustomFieldDefinitionResponseDto[]>(CUSTOM_FIELD_DEFINITIONS_URL, {
      params,
    });
  }

  createDefinition(
    dto: CreateCustomFieldDefinitionRequestDto,
  ): Observable<CustomFieldDefinitionResponseDto> {
    return this.http.post<CustomFieldDefinitionResponseDto>(CUSTOM_FIELD_DEFINITIONS_URL, dto);
  }

  updateDefinition(
    id: string,
    dto: CustomFieldDefinitionRequestDto,
  ): Observable<CustomFieldDefinitionResponseDto> {
    return this.http.put<CustomFieldDefinitionResponseDto>(
      `${CUSTOM_FIELD_DEFINITIONS_URL}/${id}`,
      dto,
    );
  }

  deactivateDefinition(id: string): Observable<void> {
    return this.http.delete<void>(`${CUSTOM_FIELD_DEFINITIONS_URL}/${id}`);
  }

  reorderDefinitions(entityType: CustomFieldEntityType, ids: string[]): Observable<void> {
    const params = new HttpParams().set('entityType', entityType);
    const body: ReorderRequestDto = { ids };

    return this.http.put<void>(`${CUSTOM_FIELD_DEFINITIONS_URL}/reorder`, body, { params });
  }

  getLeadValues(id: string): Observable<CustomFieldValueDto[]> {
    return this.http.get<CustomFieldValueDto[]>(
      `${environment.baseUrl}/api/leads/${id}/custom-fields`,
    );
  }

  upsertLeadValues(
    id: string,
    dto: UpsertCustomFieldsRequestDto,
  ): Observable<CustomFieldValueDto[]> {
    return this.http.put<CustomFieldValueDto[]>(
      `${environment.baseUrl}/api/leads/${id}/custom-fields`,
      dto,
    );
  }

  getBookingValues(id: string): Observable<CustomFieldValueDto[]> {
    return this.http.get<CustomFieldValueDto[]>(
      `${environment.baseUrl}/api/bookings/${id}/custom-fields`,
    );
  }

  upsertBookingValues(
    id: string,
    dto: UpsertCustomFieldsRequestDto,
  ): Observable<CustomFieldValueDto[]> {
    return this.http.put<CustomFieldValueDto[]>(
      `${environment.baseUrl}/api/bookings/${id}/custom-fields`,
      dto,
    );
  }

  getClientValues(id: string): Observable<CustomFieldValueDto[]> {
    return this.http.get<CustomFieldValueDto[]>(
      `${environment.baseUrl}/api/clients/${id}/custom-fields`,
    );
  }

  upsertClientValues(
    id: string,
    dto: UpsertCustomFieldsRequestDto,
  ): Observable<CustomFieldValueDto[]> {
    return this.http.put<CustomFieldValueDto[]>(
      `${environment.baseUrl}/api/clients/${id}/custom-fields`,
      dto,
    );
  }
}
